from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Item, Department, Location, Category, Vendor,
    CustodyRecord, ServiceRecord, Attachment, DisposalRecord,
)

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "code"]


class LocationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Location
        fields = ["id", "name", "department", "department_name", "address"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "depreciation_rate_pct"]


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ["id", "name", "contact_email", "contact_phone"]


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class CustodyRecordSerializer(serializers.ModelSerializer):
    custodian_detail = UserMiniSerializer(source="custodian", read_only=True)
    location_detail = LocationSerializer(source="location", read_only=True)

    class Meta:
        model = CustodyRecord
        fields = [
            "id", "item", "custodian", "custodian_detail", "location", "location_detail",
            "received_at", "returned_at", "notes", "recorded_by",
        ]
        read_only_fields = ["received_at", "recorded_by"]

    def create(self, validated_data):
        validated_data["recorded_by"] = self.context["request"].user
        return super().create(validated_data)


class ServiceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRecord
        fields = [
            "id", "item", "service_date", "performed_by", "description",
            "cost", "next_service_due", "recorded_by", "created_at",
        ]
        read_only_fields = ["recorded_by", "created_at"]

    def create(self, validated_data):
        validated_data["recorded_by"] = self.context["request"].user
        return super().create(validated_data)


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id", "item", "file", "description", "uploaded_by", "uploaded_at"]
        read_only_fields = ["uploaded_by", "uploaded_at"]

    def validate_file(self, value):
        max_size_mb = 10
        allowed_types = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(f"File must be under {max_size_mb}MB.")
        if hasattr(value, "content_type") and value.content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF, JPEG, PNG, or WEBP files are allowed.")
        return value

    def create(self, validated_data):
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)


class DisposalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisposalRecord
        fields = [
            "id", "item", "disposal_date", "method", "reason",
            "approved_by", "proceeds", "created_at",
        ]
        read_only_fields = ["approved_by", "created_at"]

    def create(self, validated_data):
        validated_data["approved_by"] = self.context["request"].user
        instance = super().create(validated_data)
        Item.objects.filter(pk=instance.item_id).update(status=Item.Status.DISPOSED)
        return instance


class ItemListSerializer(serializers.ModelSerializer):
    """Lean serializer for list/table views -- avoids serializing full history."""
    category_name = serializers.CharField(source="category.name", read_only=True)
    current_custodian_name = serializers.CharField(source="current_custodian.username", read_only=True)
    current_location_name = serializers.CharField(source="current_location.name", read_only=True)

    class Meta:
        model = Item
        fields = [
            "id", "name", "serial_number", "asset_tag", "category_name",
            "status", "condition", "current_custodian_name",
            "current_location_name", "next_service_due", "unit_cost",
        ]


class ItemDetailSerializer(serializers.ModelSerializer):
    """Full record including nested history -- used for the item detail page."""
    category_detail = CategorySerializer(source="category", read_only=True)
    vendor_detail = VendorSerializer(source="vendor", read_only=True)
    current_custodian_detail = UserMiniSerializer(source="current_custodian", read_only=True)
    current_location_detail = LocationSerializer(source="current_location", read_only=True)
    custody_history = CustodyRecordSerializer(many=True, read_only=True)
    service_history = ServiceRecordSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    disposal = DisposalRecordSerializer(read_only=True)
    current_book_value_kes = serializers.SerializerMethodField()

    def get_current_book_value_kes(self, obj):
        return str(obj.current_book_value())

    class Meta:
        model = Item
        fields = [
            "id", "name", "description", "serial_number", "asset_tag",
            "category", "category_detail", "vendor", "vendor_detail",
            "purchase_order_ref", "funding_source", "ifmis_asset_code", "unit_cost",
            "current_book_value_kes",
            "date_acquired", "warranty_expiry", "date_issued",
            "current_custodian", "current_custodian_detail",
            "current_location", "current_location_detail",
            "status", "condition", "next_service_due",
            "created_at", "updated_at",
            "custody_history", "service_history", "attachments", "disposal",
        ]
        read_only_fields = ["current_custodian", "current_location", "status", "date_issued"]


class DashboardSummarySerializer(serializers.Serializer):
    total_items = serializers.IntegerField()
    total_value_kes = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_book_value_kes = serializers.DecimalField(max_digits=16, decimal_places=2)
    by_status = serializers.DictField(child=serializers.IntegerField())
    by_condition = serializers.DictField(child=serializers.IntegerField())
    due_for_service_30d = serializers.IntegerField()
    overdue_for_service = serializers.IntegerField()
    disposed_ytd = serializers.IntegerField()
