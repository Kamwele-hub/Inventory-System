import csv
import io
from datetime import date, timedelta
from decimal import Decimal
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import viewsets, filters, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Item, Department, Location, Category, Vendor,
    CustodyRecord, ServiceRecord, Attachment, DisposalRecord,
)
from .serializers import (
    ItemListSerializer, ItemDetailSerializer, DepartmentSerializer, LocationSerializer,
    CategorySerializer, VendorSerializer, CustodyRecordSerializer, ServiceRecordSerializer,
    AttachmentSerializer, DisposalRecordSerializer, DashboardSummarySerializer, UserMiniSerializer,
)
from .permissions import CanManageInventory, IsAdminOrReadOnly, IsAdmin
from .pagination import ItemCursorPagination, CustodyRecordCursorPagination, ServiceRecordCursorPagination
from .signals import DASHBOARD_CACHE_KEY

User = get_user_model()


class ItemViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for asset records.
    list/retrieve: any authenticated user.
    create/update: custodian, warehouse_officer, admin groups.
    destroy: disabled -- items are retired via DisposalRecord, never
    deleted, so the register always reconciles with historical audit reports.
    """
    permission_classes = [CanManageInventory]
    pagination_class = ItemCursorPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "condition", "category", "current_location"]
    search_fields = ["name", "serial_number", "asset_tag", "ifmis_asset_code", "description"]
    ordering_fields = ["created_at", "next_service_due", "date_acquired", "unit_cost"]

    def get_queryset(self):
        # select_related for FKs shown in the list serializer, prefetch for
        # history only needed on retrieve -- avoids N+1 queries either way
        # and avoids pulling unused history rows on list requests.
        qs = Item.objects.select_related(
            "category", "vendor", "current_custodian", "current_location"
        )
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "custody_history__custodian", "custody_history__location",
                "service_history", "attachments", "disposal",
            )
        return qs

    def get_serializer_class(self):
        return ItemDetailSerializer if self.action in (
            "retrieve", "create", "update", "partial_update"
        ) else ItemListSerializer

    def perform_destroy(self, instance):
        raise PermissionError("Items cannot be hard-deleted. Create a DisposalRecord instead.")


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related("department").all()
    serializer_class = LocationSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["department"]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAdminOrReadOnly]


class CustodyRecordViewSet(viewsets.ModelViewSet):
    queryset = CustodyRecord.objects.select_related("custodian", "location", "item")
    serializer_class = CustodyRecordSerializer
    permission_classes = [CanManageInventory]
    pagination_class = CustodyRecordCursorPagination
    filterset_fields = ["item", "custodian", "location"]

    def perform_destroy(self, instance):
        raise PermissionError("Custody records are immutable history and cannot be deleted.")


class ServiceRecordViewSet(viewsets.ModelViewSet):
    queryset = ServiceRecord.objects.select_related("item")
    serializer_class = ServiceRecordSerializer
    permission_classes = [CanManageInventory]
    pagination_class = ServiceRecordCursorPagination
    filterset_fields = ["item"]

    def perform_destroy(self, instance):
        raise PermissionError("Service records are immutable history and cannot be deleted.")


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.select_related("item", "uploaded_by")
    serializer_class = AttachmentSerializer
    permission_classes = [CanManageInventory]
    filterset_fields = ["item"]


class DisposalRecordViewSet(viewsets.ModelViewSet):
    queryset = DisposalRecord.objects.select_related("item", "approved_by")
    serializer_class = DisposalRecordSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["item", "method"]


class DashboardSummaryView(generics.GenericAPIView):
    """
    Aggregate counts for the dashboard landing page. Cached for 5 minutes
    and explicitly invalidated by the signals in signals.py whenever an
    Item, CustodyRecord, ServiceRecord, or DisposalRecord changes -- so the
    dashboard stays cheap to load under concurrent traffic without ever
    showing stale data past the next write.
    """
    serializer_class = DashboardSummarySerializer

    def get(self, request):
        cached = cache.get(DASHBOARD_CACHE_KEY)
        if cached is not None:
            return Response(cached)

        today = timezone.localdate()
        qs = Item.objects.exclude(status=Item.Status.DISPOSED)

        # Book value requires per-item depreciation math (unit_cost, category
        # rate, acquisition date all vary), so it's summed in Python rather
        # than in SQL -- select_related avoids an N+1 on category here.
        # This runs at most once per cache window (5 min), not per request.
        total_book_value = sum(
            (item.current_book_value(as_of=today) for item in qs.select_related("category")),
            start=Decimal("0"),
        )

        data = {
            "total_items": qs.count(),
            "total_value_kes": qs.aggregate(total=Sum("unit_cost"))["total"] or 0,
            "total_book_value_kes": total_book_value,
            "by_status": dict(
                Item.objects.values_list("status").annotate(c=Count("id")).order_by()
            ),
            "by_condition": dict(
                qs.values_list("condition").annotate(c=Count("id")).order_by()
            ),
            "due_for_service_30d": qs.filter(
                next_service_due__gte=today, next_service_due__lte=today + timedelta(days=30)
            ).count(),
            "overdue_for_service": qs.filter(next_service_due__lt=today).count(),
            "disposed_ytd": DisposalRecord.objects.filter(
                disposal_date__year=today.year
            ).count(),
        }
        serialized = DashboardSummarySerializer(data).data
        cache.set(DASHBOARD_CACHE_KEY, serialized, timeout=300)
        return Response(serialized)


class ItemExportView(generics.GenericAPIView):
    """
    Server-side streaming CSV export of the asset register. Unlike the
    client-side export (which pages through the API and builds the CSV in
    the browser -- fine for a few thousand items), this streams rows
    directly from the database cursor, so memory use stays flat regardless
    of register size. Supports the same status/category/current_location
    filters as the list endpoint.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Item.objects.select_related(
            "category", "vendor", "current_custodian", "current_location"
        ).order_by("name")

        status_param = request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        category_param = request.query_params.get("category")
        if category_param:
            qs = qs.filter(category_id=category_param)
        location_param = request.query_params.get("current_location")
        if location_param:
            qs = qs.filter(current_location_id=location_param)

        def row_iterator():
            buffer = io.StringIO()
            writer = csv.writer(buffer)
            writer.writerow([
                "Name", "Serial number", "Asset tag", "IFMIS asset code", "Category",
                "Status", "Condition", "Custodian", "Location", "Unit cost (KES)",
                "Current book value (KES)", "Date acquired", "Warranty expiry",
                "Funding source", "LPO reference",
            ])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

            # .iterator() avoids loading the whole queryset into memory at
            # once -- Django streams rows from the DB cursor in chunks.
            for item in qs.iterator(chunk_size=500):
                writer.writerow([
                    item.name, item.serial_number, item.asset_tag, item.ifmis_asset_code,
                    item.category.name if item.category else "",
                    item.status, item.condition,
                    item.current_custodian.username if item.current_custodian else "",
                    item.current_location.name if item.current_location else "",
                    item.unit_cost, item.current_book_value(),
                    item.date_acquired, item.warranty_expiry or "",
                    item.funding_source, item.purchase_order_ref,
                ])
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

        filename = f"treasury-asset-register-{timezone.localdate().isoformat()}.csv"
        response = StreamingHttpResponse(row_iterator(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only staff directory search, used to power the custodian typeahead
    picker on the custody-transfer form. Deliberately narrow:
    - requires at least 2 characters of input, so it never dumps the full
      staff list to the client
    - caps results at 10, appropriate for a typeahead, not a browse list
    - only exposes id/username/first_name/last_name (no email, no personal
      data beyond what's needed to identify a colleague by name)
    """
    serializer_class = UserMiniSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "first_name", "last_name"]
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(is_active=True).order_by("username")

    def list(self, request, *args, **kwargs):
        search = request.query_params.get("search", "")
        if len(search.strip()) < 2:
            return Response([])
        queryset = self.filter_queryset(self.get_queryset())[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
