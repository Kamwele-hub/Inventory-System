import uuid
from datetime import date
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from auditlog.registry import auditlog


class Department(models.Model):
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name


class Location(models.Model):
    """Physical location an item can be stationed at (building/room/store)."""
    name = models.CharField(max_length=150)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="locations")
    address = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("name", "department")

    def __str__(self):
        return f"{self.name} ({self.department.code})"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    depreciation_rate_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Annual straight-line depreciation rate for this asset class."
    )

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Vendor(models.Model):
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return self.name


class Item(models.Model):
    """
    The core asset record. One row per physical/trackable item.
    Custody, service and disposal history live in their own tables so the
    full lifecycle is queryable and nothing gets overwritten in place.
    """

    class Status(models.TextChoices):
        IN_STORE = "in_store", "In store"
        ISSUED = "issued", "Issued"
        UNDER_REPAIR = "under_repair", "Under repair"
        LOST = "lost", "Lost / missing"
        DISPOSED = "disposed", "Disposed / written off"

    class Condition(models.TextChoices):
        NEW = "new", "New"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        POOR = "poor", "Poor"
        UNUSABLE = "unusable", "Unusable"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Identification
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    serial_number = models.CharField(max_length=100, unique=True, db_index=True)
    asset_tag = models.CharField(
        max_length=50, unique=True, db_index=True,
        help_text="Internal barcode/QR asset tag, distinct from manufacturer serial number."
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="items")

    # Provenance
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name="items")
    purchase_order_ref = models.CharField(max_length=100, blank=True, help_text="LPO / procurement reference number")
    funding_source = models.CharField(
        max_length=150, blank=True,
        help_text="Vote head / programme under the IFMIS budget classification, e.g. 'National Treasury -- Programme 0703'"
    )
    ifmis_asset_code = models.CharField(
        max_length=100, blank=True, db_index=True,
        help_text="Cross-reference to the asset's record in IFMIS, if applicable"
    )
    unit_cost = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))],
        help_text="In Kenya Shillings (KES)"
    )
    date_acquired = models.DateField()
    warranty_expiry = models.DateField(null=True, blank=True)

    # Issuance / current custody (denormalized for fast lookups; history in CustodyRecord)
    date_issued = models.DateField(null=True, blank=True)
    current_custodian = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="items_in_custody"
    )
    current_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="items"
    )

    # Lifecycle state
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_STORE, db_index=True)
    condition = models.CharField(max_length=20, choices=Condition.choices, default=Condition.NEW)
    next_service_due = models.DateField(null=True, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
            models.Index(fields=["status", "current_location"]),  # common dashboard filter combo
        ]

    def __str__(self):
        return f"{self.name} ({self.asset_tag})"

    def current_book_value(self, as_of: date | None = None) -> Decimal:
        """
        Straight-line depreciation: book value falls by
        `category.depreciation_rate_pct` of the original unit cost per full
        year since acquisition, floored at zero. Approximate by design --
        this supports at-a-glance reporting, not a substitute for the
        Treasury's formal IPSAS asset revaluation process.
        """
        as_of = as_of or timezone.localdate()
        if not self.date_acquired or not self.category:
            return self.unit_cost
        years_elapsed = (as_of - self.date_acquired).days / Decimal("365.25")
        rate = self.category.depreciation_rate_pct / Decimal("100")
        depreciated = self.unit_cost * rate * Decimal(years_elapsed)
        book_value = self.unit_cost - depreciated
        return max(book_value, Decimal("0"))


class CustodyRecord(models.Model):
    """Append-only log of who held an item, where, and when. Never edited or deleted."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="custody_history")
    custodian = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="custody_records")
    location = models.ForeignKey(Location, on_delete=models.PROTECT)
    received_at = models.DateTimeField(auto_now_add=True, db_index=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="custody_records_recorded"
    )

    class Meta:
        ordering = ["-received_at"]
        indexes = [models.Index(fields=["item", "-received_at"])]


class ServiceRecord(models.Model):
    """Maintenance / servicing history for an item."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="service_history")
    service_date = models.DateField(db_index=True)
    performed_by = models.CharField(max_length=200, help_text="Technician or vendor name")
    description = models.TextField()
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    next_service_due = models.DateField(null=True, blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="service_records")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-service_date"]
        indexes = [models.Index(fields=["item", "-service_date"])]


class Attachment(models.Model):
    """Receipts, photos, inspection reports -- files live in object storage, only the reference here."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="attachments/%Y/%m/")
    description = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class DisposalRecord(models.Model):
    """Write-off / disposal record -- final state of an item's lifecycle."""

    class Method(models.TextChoices):
        SOLD = "sold", "Sold"
        SCRAPPED = "scrapped", "Scrapped"
        DONATED = "donated", "Donated"
        LOST_WRITE_OFF = "lost_write_off", "Lost -- written off"

    item = models.OneToOneField(Item, on_delete=models.CASCADE, related_name="disposal")
    disposal_date = models.DateField()
    method = models.CharField(max_length=20, choices=Method.choices)
    reason = models.TextField()
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="approved_disposals")
    proceeds = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)


# Register models for automatic field-level change tracking (who/what/when)
# on top of the domain-specific CustodyRecord / ServiceRecord tables above.
auditlog.register(Item)
auditlog.register(CustodyRecord)
auditlog.register(ServiceRecord)
auditlog.register(DisposalRecord)
