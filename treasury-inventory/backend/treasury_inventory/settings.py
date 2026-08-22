"""
Django settings for the National Treasury Inventory System.
All secrets/config come from environment variables — never hardcode
credentials. See .env.example for the full list of variables.
"""
import environ
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django_prometheus",  # first: wraps everything below in request/db metrics
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "django_filters",
    "corsheaders",
    "auditlog",
    "drf_spectacular",
    "inventory",
]

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.gzip.GZipMiddleware",  # compress API/JSON responses
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "auditlog.middleware.AuditlogMiddleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "treasury_inventory.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "treasury_inventory.wsgi.application"

# --- Database ------------------------------------------------------------
# CONN_MAX_AGE keeps connections alive across requests (persistent
# connections) instead of reconnecting every request — a significant
# latency win under load. Use a real connection pooler (PgBouncer) in
# front of Postgres in production for high concurrency.
_db_config = env.db("DATABASE_URL", default="postgres://postgres:postgres@db:5432/treasury_inventory")
_db_config["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)
if _db_config.get("ENGINE") == "django.db.backends.postgresql":
    _db_config["OPTIONS"] = {"connect_timeout": 5}
DATABASES = {"default": _db_config}
DATABASES["default"]["ATOMIC_REQUESTS"] = True  # each request = one transaction; writes + audit log commit together

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Caching ---------------------------------------------------------
# Redis-backed cache for reference data (categories/vendors/locations/
# departments) and dashboard aggregates — these change rarely but are
# read on nearly every page load, so caching them cuts DB load
# substantially under concurrent traffic.
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://redis:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            # A Redis outage should degrade the app (slower, uncached), not
            # take it down -- cache reads/writes fail silently and fall
            # through to the database instead of raising.
            "IGNORE_EXCEPTIONS": True,
        },
        "TIMEOUT": 300,
    }
}
DJANGO_REDIS_IGNORE_EXCEPTIONS = True
DJANGO_REDIS_LOG_IGNORED_EXCEPTIONS = True
# Also use Redis for the session backend — faster than DB-backed sessions.
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_CACHE_ALIAS = "default"

# --- REST Framework ----------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    # Standard page-number pagination as the default (small reference-data
    # tables). High-volume tables (Item, CustodyRecord, ServiceRecord)
    # override this with cursor pagination — see inventory/pagination.py.
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"user": "600/minute", "anon": "20/minute"},
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),  # no BrowsableAPI overhead in prod
}
if DEBUG:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    )

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:5173"])

# HTTPS/security hardening
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=not DEBUG)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
X_FRAME_OPTIONS = "DENY"

SPECTACULAR_SETTINGS = {
    "TITLE": "National Treasury Inventory API",
    "VERSION": "1.0.0",
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
}

# --- Celery (background jobs: service-due reminder emails) --------------
# Uses the same Redis instance as the cache, on a separate logical DB (2)
# so job queue traffic doesn't collide with cached keys.
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://redis:6379/2")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://redis:6379/2")
CELERY_TASK_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULE = {
    "send-service-due-reminders-daily": {
        "task": "inventory.tasks.send_service_due_reminders",
        "schedule": env.int("SERVICE_REMINDER_INTERVAL_SECONDS", default=86400),  # once/day by default
    },
}

# --- Outbound email (service-due reminders) ------------------------------
# Defaults to the console backend so reminders print to logs in
# development instead of requiring real SMTP credentials. Set EMAIL_BACKEND
# to django.core.mail.backends.smtp.EmailBackend in production and fill in
# the EMAIL_HOST_* variables.
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="inventory-noreply@treasury.go.ke")
SERVICE_REMINDER_ADMIN_EMAILS = env.list("SERVICE_REMINDER_ADMIN_EMAILS", default=[])

# --- Optional LDAP/Active Directory authentication -----------------------
# UNTESTED SCAFFOLD: this block is written against django-auth-ldap's
# documented API but has not been exercised against a real directory
# server from this environment (no AD/LDAP instance was available to test
# against). Treat it as a documented starting point, not a verified
# integration -- test thoroughly against the Treasury's actual directory
# before relying on it, and expect to adjust AUTH_LDAP_USER_ATTR_MAP and
# the group mapping to match the real directory schema.
#
# To enable: pip install -r requirements-ldap.txt (needs system LDAP libs,
# see that file), set USE_LDAP_AUTH=True and the AUTH_LDAP_* variables
# below in your .env.
USE_LDAP_AUTH = env.bool("USE_LDAP_AUTH", default=False)
if USE_LDAP_AUTH:
    import ldap
    from django_auth_ldap.config import LDAPSearch, GroupOfNamesType

    AUTH_LDAP_SERVER_URI = env("AUTH_LDAP_SERVER_URI", default="ldap://ldap.treasury.go.ke")
    AUTH_LDAP_BIND_DN = env("AUTH_LDAP_BIND_DN", default="")
    AUTH_LDAP_BIND_PASSWORD = env("AUTH_LDAP_BIND_PASSWORD", default="")
    AUTH_LDAP_USER_SEARCH = LDAPSearch(
        env("AUTH_LDAP_USER_SEARCH_BASE", default="ou=users,dc=treasury,dc=go,dc=ke"),
        ldap.SCOPE_SUBTREE, "(uid=%(user)s)",
    )
    AUTH_LDAP_USER_ATTR_MAP = {
        "first_name": "givenName",
        "last_name": "sn",
        "email": "mail",
    }
    # Maps LDAP group membership onto the RBAC groups permissions.py checks
    # (admin / warehouse_officer / custodian / auditor). Adjust the DNs to
    # match the Treasury's real directory structure.
    AUTH_LDAP_GROUP_SEARCH = LDAPSearch(
        env("AUTH_LDAP_GROUP_SEARCH_BASE", default="ou=groups,dc=treasury,dc=go,dc=ke"),
        ldap.SCOPE_SUBTREE, "(objectClass=groupOfNames)",
    )
    AUTH_LDAP_GROUP_TYPE = GroupOfNamesType()
    AUTH_LDAP_FIND_GROUP_PERMS = True
    AUTH_LDAP_MIRROR_GROUPS = True  # syncs LDAP group membership onto Django Groups on each login

    AUTHENTICATION_BACKENDS = [
        "django_auth_ldap.backend.LDAPBackend",
        "django.contrib.auth.backends.ModelBackend",  # keeps local superuser login working
    ]
