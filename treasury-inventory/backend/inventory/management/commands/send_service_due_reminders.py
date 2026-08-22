from django.core.management.base import BaseCommand
from inventory.tasks import send_service_due_reminders


class Command(BaseCommand):
    help = (
        "Send a digest email of overdue and soon-due service items to "
        "SERVICE_REMINDER_ADMIN_EMAILS. Runs automatically via Celery Beat "
        "if the celery_beat service is running; this command lets you "
        "trigger it manually or wire it to a plain cron entry instead."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--horizon-days", type=int, default=7,
            help="How many days ahead counts as 'due soon' (default: 7).",
        )

    def handle(self, *args, **options):
        result = send_service_due_reminders(horizon_days=options["horizon_days"])
        if result.get("sent"):
            self.stdout.write(self.style.SUCCESS(
                f"Sent reminder: {result['overdue']} overdue, {result['upcoming']} due soon."
            ))
        else:
            self.stdout.write(self.style.WARNING(f"Nothing sent: {result.get('reason')}"))
