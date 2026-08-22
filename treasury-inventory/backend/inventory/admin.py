from django.contrib import admin
from .models import (
    Item, Department, Location, Category, Vendor,
    CustodyRecord, ServiceRecord, Attachment, DisposalRecord,
)


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = [
        "name", "asset_tag", "serial_number", "ifmis_asset_code",
        "status", "condition", "current_custodian", "current_location",
    ]
    list_filter = ["status", "condition", "category"]
    search_fields = ["name", "asset_tag", "serial_number", "ifmis_asset_code"]


admin.site.register(Department)
admin.site.register(Location)
admin.site.register(Category)
admin.site.register(Vendor)
admin.site.register(CustodyRecord)
admin.site.register(ServiceRecord)
admin.site.register(Attachment)
admin.site.register(DisposalRecord)
