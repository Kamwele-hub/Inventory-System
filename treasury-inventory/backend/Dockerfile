FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN adduser --disabled-password --no-create-home appuser \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R appuser:appuser /app
USER appuser

RUN python manage.py collectstatic --noinput --skip-checks || true

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:8000/api/v1/schema/ || exit 1

# --workers: (2 x CPU cores) + 1 is the standard gunicorn baseline; tune via
# GUNICORN_WORKERS for the actual host. --worker-class gthread with threads
# lets each worker handle several concurrent I/O-bound requests (DB/Redis
# calls) instead of blocking one request per worker.
CMD ["sh", "-c", "gunicorn treasury_inventory.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS:-3} \
    --worker-class gthread \
    --threads ${GUNICORN_THREADS:-4} \
    --timeout 60 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile -"]
