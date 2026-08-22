"""
Imports a legacy asset register from CSV into the Item model, creating
Category/Vendor/Location/Department reference rows as needed by name.

This doesn't know your legacy system's exact export format -- it defines
one reasonable CSV shape and documents it clearly so you (or whoever runs
the migration) can transform an export into this shape with a spreadsheet
or a short script, rather than requiring a bespoke importer per source
system. Adjust the COLUMN mapping below to match your actual export if it
differs.

Usage:
    python manage.py import_items_csv path/to/legacy_export.csv
    python manage.py import_items_csv path/to/legacy_export.csv --dry-run

Expected CSV columns (header row required, order doesn't matter):
    name, serial_number, asset_tag, category, department, location,
    unit_cost, date_acquired (YYYY-MM-DD), vendor (optional),
    ifmis_asset_code (optional), purchase_order_ref (optional),
    condition (optional: new/good/fair/poor/unusable, default "good")

Rows with a serial_number that already exists in the database are skipped
(reported, not overwritten) -- safe to re-run on a partially-imported file.
"""
import csv
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand, CommandError
from inventory.models import Item, Category, Department, Location, Vendor

REQUIRED_COLUMNS = {
    "name", "serial_number", "asset_tag", "category",
    "department", "location", "unit_cost", "date_acquired",
}


class Command(BaseCommand):
    help = "Import legacy asset register rows from a CSV file. See this file's module docstring for the expected format."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=str)
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Validate and report what would happen without writing to the database.",
        )

    def handle(self, *args, **options):
        path = options["csv_path"]
        dry_run = options["dry_run"]

        try:
            f = open(path, newline="", encoding="utf-8-sig")
        except OSError as e:
            raise CommandError(f"Could not open {path}: {e}")

        with f:
            reader = csv.DictReader(f)
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            if missing:
                raise CommandError(
                    f"CSV is missing required column(s): {', '.join(sorted(missing))}. "
                    f"Found columns: {reader.fieldnames}"
                )

            created, skipped, errors = 0, 0, []

            for i, row in enumerate(reader, start=2):  # start=2: row 1 is the header
                serial = (row.get("serial_number") or "").strip()
                if not serial:
                    errors.append(f"Row {i}: missing serial_number, skipped.")
                    continue

                if Item.objects.filter(serial_number=serial).exists():
                    skipped += 1
                    continue

                try:
                    unit_cost = Decimal(row["unit_cost"].strip())
                except (InvalidOperation, KeyError, AttributeError):
                    errors.append(f"Row {i} (serial {serial}): invalid unit_cost '{row.get('unit_cost')}', skipped.")
                    continue

                date_acquired = (row.get("date_acquired") or "").strip()
                if not date_acquired:
                    errors.append(f"Row {i} (serial {serial}): missing date_acquired, skipped.")
                    continue

                if dry_run:
                    created += 1
                    continue

                department, _ = Department.objects.get_or_create(
                    name=row["department"].strip(), defaults={"code": row["department"].strip()[:20].upper()}
                )
                location, _ = Location.objects.get_or_create(
                    name=row["location"].strip(), department=department
                )
                category, _ = Category.objects.get_or_create(name=row["category"].strip())
                vendor = None
                if row.get("vendor", "").strip():
                    vendor, _ = Vendor.objects.get_or_create(name=row["vendor"].strip())

                Item.objects.create(
                    name=row["name"].strip(),
                    serial_number=serial,
                    asset_tag=row["asset_tag"].strip(),
                    category=category,
                    vendor=vendor,
                    current_location=location,
                    unit_cost=unit_cost,
                    date_acquired=date_acquired,
                    ifmis_asset_code=(row.get("ifmis_asset_code") or "").strip(),
                    purchase_order_ref=(row.get("purchase_order_ref") or "").strip(),
                    condition=(row.get("condition") or "good").strip().lower(),
                    status=Item.Status.IN_STORE,
                )
                created += 1

            verb = "Would create" if dry_run else "Created"
            self.stdout.write(self.style.SUCCESS(f"{verb} {created} item(s). Skipped {skipped} existing serial number(s)."))
            if errors:
                self.stdout.write(self.style.WARNING(f"{len(errors)} row(s) had problems:"))
                for e in errors:
                    self.stdout.write(f"  {e}")
