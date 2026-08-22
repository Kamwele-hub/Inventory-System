from django.core.cache import cache
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustodyRecord, ServiceRecord, Item, DisposalRecord

DASHBOARD_CACHE_KEY = "dashboard:summary:v1"


@receiver(post_save, sender=CustodyRecord)
def sync_item_custody(sender, instance: CustodyRecord, created, **kwargs):
    """Whenever a new custody record is written, mirror it onto the Item
    for fast lookups -- the CustodyRecord table remains the source of truth."""
    if created:
        Item.objects.filter(pk=instance.item_id).update(
            current_custodian=instance.custodian_id,
            current_location=instance.location_id,
            status=Item.Status.ISSUED,
            date_issued=instance.received_at.date(),
        )
        cache.delete(DASHBOARD_CACHE_KEY)


@receiver(post_save, sender=ServiceRecord)
def sync_item_service(sender, instance: ServiceRecord, created, **kwargs):
    if created and instance.next_service_due:
        Item.objects.filter(pk=instance.item_id).update(
            next_service_due=instance.next_service_due
        )
        cache.delete(DASHBOARD_CACHE_KEY)


@receiver(post_save, sender=Item)
def invalidate_dashboard_on_item_change(sender, **kwargs):
    cache.delete(DASHBOARD_CACHE_KEY)


@receiver(post_save, sender=DisposalRecord)
def invalidate_dashboard_on_disposal(sender, **kwargs):
    cache.delete(DASHBOARD_CACHE_KEY)
