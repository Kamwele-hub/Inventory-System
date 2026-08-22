from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ItemViewSet, DepartmentViewSet, LocationViewSet, CategoryViewSet, VendorViewSet,
    CustodyRecordViewSet, ServiceRecordViewSet, AttachmentViewSet, DisposalRecordViewSet,
    DashboardSummaryView, UserViewSet, ItemExportView,
)

router = DefaultRouter()
router.register("items", ItemViewSet, basename="item")
router.register("departments", DepartmentViewSet, basename="department")
router.register("locations", LocationViewSet, basename="location")
router.register("categories", CategoryViewSet, basename="category")
router.register("vendors", VendorViewSet, basename="vendor")
router.register("custody-records", CustodyRecordViewSet, basename="custodyrecord")
router.register("service-records", ServiceRecordViewSet, basename="servicerecord")
router.register("attachments", AttachmentViewSet, basename="attachment")
router.register("disposals", DisposalRecordViewSet, basename="disposalrecord")
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("items-export/", ItemExportView.as_view(), name="items-export"),
] + router.urls
