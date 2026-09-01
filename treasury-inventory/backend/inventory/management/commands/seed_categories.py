from django.core.management.base import BaseCommand
from inventory.models import Category

# Depreciation rates are reasonable IT-hardware defaults (straight-line,
# %/year) -- adjust per the Treasury's actual asset management policy if
# it specifies different rates per class.
HARDWARE_CATEGORIES = [
    ("Laptop", 33.33),       # ~3-year useful life
    ("Desktop", 25.00),      # ~4-year useful life
    ("Monitor", 20.00),
    ("Printer", 20.00),
    ("Scanner", 20.00),
    ("TV / Display Screen", 12.50),
    ("UPS", 20.00),
    ("Router", 20.00),
    ("Switch", 20.00),
    ("Server", 14.29),       # ~7-year useful life
    ("Projector", 20.00),
    ("Networking Cable / Accessory", 33.33),
]


class Command(BaseCommand):
    help = "Seed standard IT hardware asset categories (Laptop, Desktop, Printer, etc.)"

    def handle(self, *args, **options):
        for name, rate in HARDWARE_CATEGORIES:
            category, created = Category.objects.get_or_create(
                name=name, defaults={"depreciation_rate_pct": rate}
            )
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Exists'}: {name}"))