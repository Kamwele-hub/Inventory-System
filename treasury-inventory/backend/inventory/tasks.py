import logging
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from celery import shared_task
from .models import Item

logger = logging.getLogger(__name__)


def build_service_due_report(horizon_days: int = 7):
    """
    Returns (overdue_items, upcoming_items) -- items whose next_service_due
    has already passed, and items due within `horizon_days`. Excludes
    disposed items, since a written-off asset doesn't need servicing.
    """
    today = timezone.localdate()
    qs = Item.objects.exclude(status=Item.Status.DISPOSED).select_related(
        "current_custodian", "current_location", "category"
    )
    overdue = list(qs.filter(next_service_due__lt=today).order_by("next_service_due"))
    upcoming = list(
        qs.filter(
            next_service_due__gte=today, next_service_due__lte=today + timedelta(days=horizon_days)
        ).order_by("next_service_due")
    )
    return overdue, upcoming


def _format_item_line(item: Item) -> str:
    custodian = item.current_custodian.username if item.current_custodian else "unassigned"
    location = item.current_location.name if item.current_location else "unknown location"
    return f"- {item.name} ({item.asset_tag}) -- due {item.next_service_due} -- {custodian} @ {location}"


@shared_task(name="inventory.tasks.send_service_due_reminders")
def send_service_due_reminders(horizon_days: int = 7):
    """
    Daily job (scheduled via CELERY_BEAT_SCHEDULE): emails a summary of
    overdue and soon-due items to SERVICE_REMINDER_ADMIN_EMAILS. Sends one
    digest email rather than one email per item, both to avoid spamming
    inboxes and to keep this cheap to run daily against a large register.

    Also callable directly as a management command
    (`python manage.py send_service_due_reminders`) for manual runs or a
    plain cron entry if you'd rather not run Celery Beat.
    """
    if not settings.SERVICE_REMINDER_ADMIN_EMAILS:
        logger.info("SERVICE_REMINDER_ADMIN_EMAILS is empty -- skipping service-due reminder email.")
        return {"sent": False, "reason": "no recipients configured"}

    overdue, upcoming = build_service_due_report(horizon_days)
    if not overdue and not upcoming:
        logger.info("No items overdue or due for service within %s days -- nothing to send.", horizon_days)
        return {"sent": False, "reason": "nothing due"}

    lines = ["National Treasury Asset Inventory -- service due report", ""]
    if overdue:
        lines.append(f"OVERDUE ({len(overdue)}):")
        lines.extend(_format_item_line(i) for i in overdue)
        lines.append("")
    if upcoming:
        lines.append(f"DUE WITHIN {horizon_days} DAYS ({len(upcoming)}):")
        lines.extend(_format_item_line(i) for i in upcoming)

    send_mail(
        subject=f"[Treasury Inventory] {len(overdue)} overdue, {len(upcoming)} due soon for service",
        message="\n".join(lines),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.SERVICE_REMINDER_ADMIN_EMAILS,
        fail_silently=False,
    )
    logger.info("Sent service-due reminder email: %s overdue, %s upcoming.", len(overdue), len(upcoming))
    return {"sent": True, "overdue": len(overdue), "upcoming": len(upcoming)}
