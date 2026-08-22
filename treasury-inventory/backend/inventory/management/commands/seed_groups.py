from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = "Create the default RBAC groups used by permissions.py"

    def handle(self, *args, **options):
        for name in ["admin", "warehouse_officer", "custodian", "auditor"]:
            group, created = Group.objects.get_or_create(name=name)
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Exists'}: {name}"))
