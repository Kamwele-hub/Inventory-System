from datetime import date
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from inventory.models import Category, Department, Location, Vendor, Item, CustodyRecord

User = get_user_model()


def make_user(username, groups=None, superuser=False):
    user = User.objects.create_user(username=username, password="Str0ngPass!2345")
    if superuser:
        user.is_superuser = True
        user.is_staff = True
        user.save()
    for g in groups or []:
        group, _ = Group.objects.get_or_create(name=g)
        user.groups.add(group)
    return user


def make_reference_data():
    dept = Department.objects.create(name="ICT Directorate", code="ICT")
    location = Location.objects.create(name="Treasury Building - Store A", department=dept)
    category = Category.objects.create(name="Computers", depreciation_rate_pct=20)
    vendor = Vendor.objects.create(name="Simba Technologies Ltd")
    return dept, location, category, vendor


class ItemModelTests(TestCase):
    def test_item_created_with_defaults(self):
        _, _, category, _ = make_reference_data()
        item = Item.objects.create(
            name="Dell Latitude Laptop",
            serial_number="SN-0001",
            asset_tag="TNT-0001",
            category=category,
            unit_cost=95000,
            date_acquired=date(2026, 1, 15),
        )
        self.assertEqual(item.status, Item.Status.IN_STORE)
        self.assertEqual(item.condition, Item.Condition.NEW)

    def test_serial_number_must_be_unique(self):
        _, _, category, _ = make_reference_data()
        Item.objects.create(
            name="Laptop 1", serial_number="DUP-1", asset_tag="TAG-1",
            category=category, unit_cost=1000, date_acquired=date(2026, 1, 1),
        )
        with self.assertRaises(Exception):
            Item.objects.create(
                name="Laptop 2", serial_number="DUP-1", asset_tag="TAG-2",
                category=category, unit_cost=1000, date_acquired=date(2026, 1, 1),
            )


class CustodySyncTests(TestCase):
    def test_custody_record_updates_item_denormalized_fields(self):
        _, location, category, _ = make_reference_data()
        custodian = make_user("jkamau")
        recorder = make_user("recorder", groups=["admin"])
        item = Item.objects.create(
            name="Projector", serial_number="SN-100", asset_tag="TAG-100",
            category=category, unit_cost=50000, date_acquired=date(2026, 2, 1),
        )
        CustodyRecord.objects.create(
            item=item, custodian=custodian, location=location, recorded_by=recorder,
        )
        item.refresh_from_db()
        self.assertEqual(item.status, Item.Status.ISSUED)
        self.assertEqual(item.current_custodian_id, custodian.id)
        self.assertEqual(item.current_location_id, location.id)


class ItemAPIPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, _, self.category, _ = make_reference_data()
        self.auditor = make_user("auditor1", groups=["auditor"])
        self.custodian = make_user("custodian1", groups=["custodian"])
        self.admin = make_user("admin1", groups=["admin"])

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_unauthenticated_request_rejected(self):
        response = self.client.get("/api/v1/items/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auditor_can_list_but_not_create(self):
        self._auth(self.auditor)
        list_response = self.client.get("/api/v1/items/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)

        create_response = self.client.post("/api/v1/items/", {
            "name": "Chair", "serial_number": "SN-X", "asset_tag": "TAG-X",
            "category": self.category.id, "unit_cost": "5000.00", "date_acquired": "2026-01-01",
        })
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_custodian_can_create_item(self):
        self._auth(self.custodian)
        response = self.client.post("/api/v1/items/", {
            "name": "Office Chair", "serial_number": "SN-Y", "asset_tag": "TAG-Y",
            "category": self.category.id, "unit_cost": "5000.00", "date_acquired": "2026-01-01",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_item_cannot_be_hard_deleted(self):
        self._auth(self.admin)
        create_response = self.client.post("/api/v1/items/", {
            "name": "Safe", "serial_number": "SN-Z", "asset_tag": "TAG-Z",
            "category": self.category.id, "unit_cost": "150000.00", "date_acquired": "2026-01-01",
        })
        item_id = create_response.data["id"]
        with self.assertRaises(PermissionError):
            self.client.delete(f"/api/v1/items/{item_id}/")

    def test_search_filters_by_asset_tag(self):
        self._auth(self.admin)
        self.client.post("/api/v1/items/", {
            "name": "Findable Laptop", "serial_number": "SN-SEARCH", "asset_tag": "TAG-FINDME",
            "category": self.category.id, "unit_cost": "80000.00", "date_acquired": "2026-01-01",
        })
        response = self.client.get("/api/v1/items/", {"search": "FINDME"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)


class DashboardSummaryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, _, self.category, _ = make_reference_data()
        self.user = make_user("dashboarduser", groups=["auditor"])
        self.client.force_authenticate(user=self.user)

    def test_dashboard_returns_expected_shape(self):
        Item.objects.create(
            name="Server", serial_number="SN-D1", asset_tag="TAG-D1",
            category=self.category, unit_cost=300000, date_acquired=date(2026, 1, 1),
        )
        response = self.client.get("/api/v1/dashboard/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_items", response.data)
        self.assertIn("by_status", response.data)
        self.assertGreaterEqual(response.data["total_items"], 1)


class ItemExportAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, _, self.category, _ = make_reference_data()
        self.user = make_user("exportuser", groups=["auditor"])
        self.client.force_authenticate(user=self.user)
        Item.objects.create(
            name="Export Test Laptop", serial_number="SN-EXP1", asset_tag="TAG-EXP1",
            category=self.category, unit_cost=75000, date_acquired=date(2025, 1, 1),
        )

    def test_export_returns_csv_with_header_and_row(self):
        response = self.client.get("/api/v1/items-export/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn("attachment; filename=", response["Content-Disposition"])
        content = b"".join(response.streaming_content).decode()
        self.assertIn("Name,Serial number,Asset tag", content)
        self.assertIn("Export Test Laptop", content)
        self.assertIn("TAG-EXP1", content)

    def test_export_respects_status_filter(self):
        Item.objects.create(
            name="Disposed Chair", serial_number="SN-EXP2", asset_tag="TAG-EXP2",
            category=self.category, unit_cost=3000, date_acquired=date(2024, 1, 1),
            status=Item.Status.DISPOSED,
        )
        response = self.client.get("/api/v1/items-export/", {"status": "disposed"})
        content = b"".join(response.streaming_content).decode()
        self.assertIn("Disposed Chair", content)
        self.assertNotIn("Export Test Laptop", content)

    def test_export_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/items-export/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DepreciationTests(TestCase):
    def test_book_value_decreases_and_floors_at_zero(self):
        from decimal import Decimal
        category = Category.objects.create(name="Vehicles", depreciation_rate_pct=25)
        item = Item.objects.create(
            name="Fleet Vehicle", serial_number="SN-DEP-T1", asset_tag="TAG-DEP-T1",
            category=category, unit_cost=Decimal("5000000"), date_acquired=date(2024, 1, 1),
        )
        book_value_2_years = item.current_book_value(as_of=date(2026, 1, 1))
        book_value_10_years = item.current_book_value(as_of=date(2034, 1, 1))
        self.assertLess(book_value_2_years, item.unit_cost)
        self.assertGreater(book_value_2_years, 0)
        self.assertEqual(book_value_10_years, Decimal("0"))


class ServiceDueReminderTests(TestCase):
    """Covers the digest-email logic used by the Celery beat job / management command."""

    def setUp(self):
        _, _, self.category, _ = make_reference_data()

    def test_report_splits_overdue_and_upcoming(self):
        from datetime import date as date_cls, timedelta
        from inventory.tasks import build_service_due_report

        today = timezone.localdate()
        Item.objects.create(
            name="Overdue Printer", serial_number="SN-OD1", asset_tag="TAG-OD1",
            category=self.category, unit_cost=20000, date_acquired=date_cls(2024, 1, 1),
            next_service_due=today - timedelta(days=5),
        )
        Item.objects.create(
            name="Soon Due Scanner", serial_number="SN-SD1", asset_tag="TAG-SD1",
            category=self.category, unit_cost=15000, date_acquired=date_cls(2024, 1, 1),
            next_service_due=today + timedelta(days=3),
        )
        Item.objects.create(
            name="Far Future Laptop", serial_number="SN-FF1", asset_tag="TAG-FF1",
            category=self.category, unit_cost=90000, date_acquired=date_cls(2024, 1, 1),
            next_service_due=today + timedelta(days=90),
        )

        overdue, upcoming = build_service_due_report(horizon_days=7)
        self.assertEqual([i.asset_tag for i in overdue], ["TAG-OD1"])
        self.assertEqual([i.asset_tag for i in upcoming], ["TAG-SD1"])

    def test_no_recipients_configured_skips_send(self):
        from django.test import override_settings
        from inventory.tasks import send_service_due_reminders

        with override_settings(SERVICE_REMINDER_ADMIN_EMAILS=[]):
            result = send_service_due_reminders()
        self.assertFalse(result["sent"])

    def test_sends_digest_email_when_items_due(self):
        from datetime import date as date_cls, timedelta
        from django.core import mail
        from django.test import override_settings
        from inventory.tasks import send_service_due_reminders

        today = timezone.localdate()
        Item.objects.create(
            name="Overdue Router", serial_number="SN-OD2", asset_tag="TAG-OD2",
            category=self.category, unit_cost=8000, date_acquired=date_cls(2024, 1, 1),
            next_service_due=today - timedelta(days=1),
        )
        with override_settings(SERVICE_REMINDER_ADMIN_EMAILS=["assets@treasury.go.ke"]):
            result = send_service_due_reminders()

        self.assertTrue(result["sent"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("TAG-OD2", mail.outbox[0].body)


class UserSearchAPITests(TestCase):
    """Covers the staff-directory typeahead used by the custody-transfer picker."""

    def setUp(self):
        self.client = APIClient()
        make_reference_data()
        self.searcher = make_user("searcher1", groups=["custodian"])
        make_user("jkamau", groups=["custodian"])
        make_user("jkaranja", groups=["custodian"])
        self.client.force_authenticate(user=self.searcher)

    def test_unauthenticated_request_rejected(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/v1/users/", {"search": "jkam"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_short_query_returns_empty_without_dumping_staff_list(self):
        response = self.client.get("/api/v1/users/", {"search": "j"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_search_matches_only_relevant_username(self):
        response = self.client.get("/api/v1/users/", {"search": "jkam"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [u["username"] for u in response.data]
        self.assertIn("jkamau", usernames)
        self.assertNotIn("jkaranja", usernames)

    def test_results_never_expose_email_or_password_fields(self):
        response = self.client.get("/api/v1/users/", {"search": "jkam"})
        for user_data in response.data:
            self.assertNotIn("email", user_data)
            self.assertNotIn("password", user_data)
