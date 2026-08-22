import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "treasury_inventory.settings")

app = Celery("treasury_inventory")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
