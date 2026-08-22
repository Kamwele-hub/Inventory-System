# National Treasury Inventory System (Kenya)

An asset register and custody-tracking system for the National Treasury:
items, serial numbers, issue dates, service history, custody transfers, and
disposal -- with a full audit trail suitable for OAG (Office of the
Auditor-General) review.

Currency throughout is Kenya Shillings (KES). Timezone is `Africa/Nairobi`.
Each item carries an optional `ifmis_asset_code` field to cross-reference the
Treasury's own IFMIS asset register, and `purchase_order_ref` is intended
for the LPO/procurement reference generated under the Public Procurement
and Asset Disposal Act, 2015.

**Design:** the UI uses a colour palette built from Kenya's national colours
(flag black/red/green/white, plus the gold of the coat of arms) as they
appear across the Treasury's public branding. These are *not* pixel-sampled
from treasury.go.ke's live stylesheet -- if you have the Treasury's official
brand hex codes, swap them into `frontend/tailwind.config.js`
(`theme.extend.colors.treasury`) directly.

## Getting this into GitHub

This project isn't a Git repository yet -- you're starting from a plain
folder. From inside the unzipped `treasury-inventory/` folder:

```bash
git init
git add .
git commit -m "Initial commit: Treasury inventory system"
```

Then create an empty repository on GitHub (via the web UI, or `gh repo create`
if you have the GitHub CLI) -- **do not** initialize it with a README, since
this folder already has one and that would create a merge conflict on push.
Then:

```bash
git remote add origin https://github.com/<your-org>/<your-repo>.git
git branch -M main
git push -u origin main
```

This step matters beyond just backup: `.github/workflows/ci-cd.yml` only
runs once the code is on GitHub, and the automated deploy step later in this
README depends on it too.

If you want a clean working copy on a different machine afterwards (rather
than just opening the folder you already unzipped), clone it normally:

```bash
git clone https://github.com/<your-org>/<your-repo>.git
code treasury-inventory   # opens it in VS Code, if the `code` command is installed
```

## Architecture

```
 Staff / auditors
        |
        v
 React + TypeScript SPA  (frontend/) -- code-split, cached reference data
        | HTTPS / REST + JWT
        v
 Django + DRF API  (backend/)
   - auth (JWT, RBAC groups)
   - inventory (items, custody, service, disposal, dashboard)
   - auditlog (field-level change history)
        |
        +---------------------+
        v                     v
 PostgreSQL              Redis
 (system of record)      (reference-data cache, dashboard cache, sessions)
```

Modular monolith, not microservices: one deployable backend unit, split into
clear internal modules, backed by one PostgreSQL database. This keeps
transactions simple (an item update and its audit log entry commit
together, `ATOMIC_REQUESTS = True`) and ops overhead low, appropriate for a
single-team system of this size. See `docs/ERD.md` for the full data model.

## Repository layout

```
backend/            Django + DRF API
  inventory/         Models, serializers, views, permissions, signals, pagination, tests
  treasury_inventory/ Project settings, urls
frontend/            React + TypeScript SPA (Vite)
  src/layout/          App shell (sidebar nav, topbar)
  src/pages/           Route-level pages
  src/components/      Shared UI (badges, form fields)
  src/hooks/           Cached reference-data hooks
nginx/               Production reverse-proxy config (TLS termination)
.github/workflows/   CI/CD pipeline
docs/                ERD and design notes
docker-compose.yml       Local development (Postgres + Redis + backend + frontend)
docker-compose.prod.yml  Production deployment (adds TLS proxy, resource limits)
```

## Features

- **Dashboard** -- total assets, acquisition value and current (depreciated)
  book value in KES, items by status/condition (charts), items due/overdue
  for service, YTD disposals
- **Asset register** -- searchable, filterable (status/category), cursor-
  paginated list; full item detail with lifecycle history
- **Item registration** -- category/vendor pickers wired to live reference
  data, IFMIS code, LPO reference, funding source
- **Custody transfer, service logging, and disposal/write-off** -- each a
  dedicated form, backed by append-only history tables. Custody transfer
  uses a debounced, searchable staff picker (search by name or username)
  rather than a raw user ID field.
- **Depreciation** -- straight-line book value calculated per item from its
  category's depreciation rate, shown on the item detail page and totalled
  on the dashboard
- **QR/barcode scan-to-lookup** -- camera-based scanning (`@zxing/browser`)
  jumps straight to an item's record by asset tag, with a manual-entry
  fallback
- **Server-side CSV export** -- streamed directly from the database cursor,
  so memory use stays flat regardless of register size, with the same
  status/category/location filters as the list view
- **Service-due email reminders** -- a daily Celery Beat job (or a plain
  management command if you'd rather use cron) emails a digest of overdue
  and soon-due items
- **Legacy data import** -- a CSV import command for migrating an existing
  inventory spreadsheet, creating reference data as needed and skipping
  already-imported serial numbers
- **Reference data management** -- admin-only screen for departments,
  locations, categories, vendors
- **RBAC** -- auditor / custodian / warehouse_officer / admin groups,
  enforced server-side on every request
- **Dependency vulnerability scanning** -- Dependabot plus `pip-audit`/
  `npm audit` on every CI run

## Local development

Prerequisites: Docker and Docker Compose.

```bash
cp backend/.env.example backend/.env
# edit backend/.env -- for local dev the defaults are fine except DJANGO_SECRET_KEY

docker compose up --build
```

This starts:
- `db` -- PostgreSQL on `localhost:5432`
- `redis` -- Redis on `localhost:6379`
- `backend` -- Django API on `http://localhost:8000/api/v1/` (docs at `/api/v1/docs/`)
- `frontend` -- React app on `http://localhost:5173`
- `celery_worker` / `celery_beat` -- background jobs (currently just the
  daily service-due reminder email); safe to `docker compose stop
  celery_worker celery_beat` if you don't want them running locally

First-time setup (run once, after the containers are up):

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_groups
docker compose exec backend python manage.py createsuperuser
```

Log into `http://localhost:8000/admin/` with the superuser to create
`Department`, `Location`, `Category`, and `Vendor` reference data (or use
the in-app **Reference data** screen once logged in as an admin), and to
assign staff accounts to the `admin` / `warehouse_officer` / `custodian` /
`auditor` groups created by `seed_groups`.

### Migrating legacy inventory data

If you have an existing spreadsheet or export of the current inventory,
shape it into the CSV format documented at the top of
`backend/inventory/management/commands/import_items_csv.py`, then:

```bash
docker compose exec backend python manage.py import_items_csv /path/to/file.csv --dry-run
# review the output, then run for real:
docker compose exec backend python manage.py import_items_csv /path/to/file.csv
```

Safe to re-run -- rows whose serial number already exists are skipped, not duplicated.

### Service-due reminder emails

Runs automatically once a day via `celery_beat` (interval configurable via
`SERVICE_REMINDER_INTERVAL_SECONDS`), emailing
`SERVICE_REMINDER_ADMIN_EMAILS`. In development this prints to the console
by default (`EMAIL_BACKEND` defaults to the console backend) rather than
requiring real SMTP credentials. To trigger it manually instead of waiting
for the schedule:

```bash
docker compose exec backend python manage.py send_service_due_reminders
```

### Running the test suite

```bash
docker compose exec backend python manage.py test inventory
```

Covers: model constraints, the custody-record-to-item sync signal, RBAC
permission boundaries per role, search filtering, the "items can't be
hard-deleted" rule, the dashboard aggregate endpoint, the streaming CSV
export, depreciation calculation, the staff-search endpoint, and the
service-due reminder digest logic. 20 tests total.

### Running without Docker

Backend:
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # point DATABASE_URL/REDIS_URL at local instances, or use sqlite:///db.sqlite3 for a quick spin
python manage.py migrate
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Roles (RBAC)

| Group | Can do |
|---|---|
| `auditor` | Read everything, write nothing |
| `custodian` / `warehouse_officer` | Create/update items, custody records, service records |
| `admin` | Everything above, plus reference data (categories, vendors, locations, departments) and disposal/write-off |

Enforced in `backend/inventory/permissions.py`, checked against Django
`Group` membership on every request -- the frontend hides buttons the
signed-in user can't use, but that's a UX convenience, not the security
boundary; the API re-checks independently.

## Performance

- **Redis caching** -- reference data is cached client-side (`staleTime` in
  the react-query hooks) on top of the dashboard endpoint being cached
  server-side for 5 minutes and explicitly invalidated on every write via
  Django signals, so it never serves stale data past the next change
- **Cursor pagination** on `Item`, `CustodyRecord`, and `ServiceRecord` --
  avoids the expensive `COUNT(*)`/`OFFSET` scan that page-number pagination
  does on large, frequently-written tables
- **Query optimization** -- `select_related`/`prefetch_related` tuned per
  action (list vs. retrieve) to avoid N+1 queries without over-fetching
  history on list views
- **Database** -- persistent connections (`CONN_MAX_AGE`), composite and
  covering indexes on the fields the dashboard and list filters actually
  use
- **API** -- gzip compression, per-user and per-IP rate limiting, JSON-only
  rendering in production (no BrowsableAPI overhead)
- **Application server** -- Gunicorn with `gthread` workers (handles several
  concurrent I/O-bound requests per worker instead of blocking one request
  per worker), worker recycling (`--max-requests`) to bound memory growth
- **Frontend** -- code-split bundles (charts and the QR scanner load only
  when their pages are visited), immutable long-lived caching on hashed
  static assets, gzip at the nginx layer

None of this replaces a real load test before go-live -- tune
`GUNICORN_WORKERS`/`GUNICORN_THREADS` and Postgres `max_connections` (or add
PgBouncer) against your actual concurrency needs.

## Security posture

- JWT auth (30 min access / 1 day refresh, rotated and blacklisted on refresh)
- RBAC enforced at the API layer, independent of frontend UI
- `Item` rows are never hard-deleted; disposal is a recorded event
- `CustodyRecord` / `ServiceRecord` block `DELETE` at the API layer
- `django-auditlog` records field-level before/after diffs with actor and timestamp
- File uploads validated for size (10MB) and type (PDF/JPEG/PNG/WEBP) at the API layer
- HTTPS enforced in production (`SECURE_SSL_REDIRECT`, HSTS), plus nginx-level rate limiting on `/api/`
- Passwords: 12-character minimum, checked against common-password lists
- Dependency vulnerability scanning on every CI run (`pip-audit`, `npm audit`) plus Dependabot

**See `docs/SECURITY_CHECKLIST.md` for the full pre-go-live checklist** --
it separates what's already handled in code from what genuinely needs a
human reviewer (penetration testing, brute-force login protection, admin
panel exposure, secrets management). Automated scanning catches known
vulnerable dependencies; it does not catch logic flaws or misconfigurations.

**LDAP/Active Directory:** `backend/treasury_inventory/settings.py` has a
feature-flagged (`USE_LDAP_AUTH`, off by default) LDAP authentication
scaffold using `django-auth-ldap`. It's written against that library's
documented API but has **not been tested against a real directory server**
-- there wasn't one available to verify against while building this. Treat
it as a documented starting point and test thoroughly against the
Treasury's actual directory before relying on it.

Before go-live, review data-residency and compliance requirements:

- **Data Protection Act, 2019 (Kenya)** -- custodian names, national ID/staff
  numbers, and similar personal data held in this system are "personal data"
  under the Act. Register with the Office of the Data Protection
  Commissioner (ODPC) as a data controller/processor if not already covered
  under an existing Treasury registration, and apply the Act's principles
  (purpose limitation, minimal retention, security safeguards) to this data.
- **Data residency** -- host PostgreSQL, Redis, and file storage on Treasury
  or government-approved infrastructure (e.g. the Government Common Core
  Network / National Data Centre, or a locally licensed cloud provider)
  rather than a foreign public cloud region, unless explicitly authorized.
- **Public Procurement and Asset Disposal Act, 2015** -- the `DisposalRecord`
  workflow (admin-only, requires `approved_by` and a `reason`) should be
  mapped to your internal asset-disposal committee approval process before
  go-live, so the system reflects actual sign-off rather than just a status flag.
- **Auditability for OAG review** -- the append-only history tables and
  `django-auditlog` change trail are designed so the Office of the
  Auditor-General can reconcile the register against physical stocktakes;
  keep at least the current financial year plus prior year fully queryable
  in the live database rather than archived off.

## Deployment (production)

1. Provision a host (on-prem or in-country cloud) with Docker installed.
2. Clone the repo to `/opt/treasury-inventory` on that host.
3. Fill in `backend/.env` from `backend/.env.example` with production values --
   long random `DJANGO_SECRET_KEY`, real DB credentials, real `ALLOWED_HOSTS`.
4. Obtain a TLS certificate (e.g. via certbot) and place `fullchain.pem` /
   `privkey.pem` in `nginx/certs/`.
5. Update `server_name` in `nginx/nginx.conf` to your real domain.
6. Bring the stack up:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
   docker compose -f docker-compose.prod.yml exec backend python manage.py seed_groups
   docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```
7. Set up automated PostgreSQL backups (nightly `pg_dump` + WAL archiving for
   point-in-time recovery) writing to the mounted `./backups` volume, and
   test a restore before go-live -- an untested backup is not a backup.

### CI/CD

`.github/workflows/ci-cd.yml` runs on every push:
- Backend: Django checks, migration-drift check, full test suite (against
  real Postgres and Redis service containers)
- Frontend: TypeScript type-check, production build
- On `main`: builds and pushes Docker images to GHCR, then deploys over SSH
  and runs migrations on the target host

Required repo secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.

### Monitoring (recommended, not yet wired up)

- Metrics: `django-prometheus` is already installed and exposes `/metrics`;
  point a Prometheus + Grafana stack at it, and add `postgres_exporter` /
  `redis_exporter` for the data layer
- Logs: ship container logs to Loki or an ELK stack -- correlate with the
  `auditlog` table for a full picture of "who did what, when"
- Alerting: disk usage, failed backup jobs, and error-rate spikes at minimum

## API overview

All endpoints are under `/api/v1/`, JWT-authenticated (`Authorization: Bearer <token>`).
Interactive docs (Swagger UI) at `/api/v1/docs/`. Prometheus metrics at `/metrics`.

| Endpoint | Purpose |
|---|---|
| `POST /auth/login/` | Obtain access + refresh token |
| `POST /auth/refresh/` | Refresh an access token |
| `GET/POST /items/` | List (cursor-paginated) / register assets |
| `GET/PATCH /items/{id}/` | Full item detail incl. history, or update |
| `GET/POST /custody-records/` | Custody history, or transfer an item |
| `GET/POST /service-records/` | Maintenance history, or log a service event |
| `GET/POST /disposals/` | Write-off records (admin only) |
| `GET /dashboard/summary/` | Cached aggregate counts, including register-wide book value |
| `GET /items-export/` | Server-side streamed CSV export (filterable) |
| `GET /users/?search=` | Staff directory typeahead (min. 2 chars, capped at 10 results) -- used by the custody-transfer picker |
| `GET/POST /departments/`, `/locations/`, `/categories/`, `/vendors/` | Reference data |

## What's built vs what still needs a human

Built and verified (Django checks pass, migrations generate cleanly, 20-test
suite passes -- including with Redis deliberately taken down mid-run --
frontend type-checks and production-builds with code splitting):
- Full data model with custody/service/disposal history, audit logging, and
  Kenya-specific fields (KES, IFMIS code, LPO ref)
- Straight-line depreciation, computed per item and totalled on the dashboard
- RBAC-protected, cached, cursor-paginated REST API with a dashboard
  aggregate endpoint, a rate-limited staff-search endpoint, and a
  server-side streaming CSV export
- JWT auth with refresh
- Background jobs (Celery + Celery Beat on the existing Redis instance):
  a daily service-due reminder email digest, also runnable manually
- A CSV import command for migrating a legacy inventory export
- React SPA with Treasury-inspired branding covering the full workflow:
  dashboard, asset register, item detail, registration, custody transfer
  (with staff picker), service logging, disposal, QR scanning, CSV export,
  reference-data management
- Docker Compose for dev and production (Postgres + Redis + Celery worker/
  beat), TLS-terminating reverse proxy with rate limiting, CI/CD with
  dependency vulnerability scanning (Dependabot, pip-audit, npm audit)
- Cache layer degrades gracefully if Redis is unreachable -- verified, not
  just assumed

Genuinely still needs a human, not more code:
- **Independent security review / penetration test** -- automated scanning
  (now wired in) catches known vulnerable dependencies, not logic flaws or
  authorization bugs. See `docs/SECURITY_CHECKLIST.md` for the specific
  items (brute-force login protection, admin panel exposure, secrets
  management) that need a person's judgment, not a script.
- **User acceptance testing** with real custodians and auditors -- nothing
  in a codebase substitutes for people who'll actually use it clicking
  through it.
- **LDAP/SSO** -- the scaffold in `settings.py` is written against
  `django-auth-ldap`'s documented API but has not been tested against a
  real directory server. Needs the Treasury's actual AD/LDAP connection
  details and someone to verify it end-to-end.
- **Running the legacy data import for real** -- the tool exists
  (`import_items_csv`); someone still needs to locate the current
  inventory records and shape them into its expected CSV format.
- **A decision on SMS reminders** alongside the email digest already built,
  if that's genuinely needed -- and real SMTP credentials to replace the
  console email backend currently used in development.

