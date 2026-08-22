# Security checklist

This is a working checklist for whoever runs the security review before
go-live -- it is **not** a substitute for that review. Automated scanning
(Dependabot, pip-audit, npm audit, all wired into CI) catches known
vulnerable dependencies; it does not catch logic flaws, business-logic
authorization bugs, or misconfigurations, which is what a human reviewer or
penetration test is for.

## Already in place (verify, don't just trust the label)

- [ ] JWT auth with short-lived access tokens (30 min) and rotated,
      blacklisted refresh tokens -- confirm blacklisting actually works by
      inspecting `token_blacklist` table entries after a refresh
- [ ] RBAC enforced server-side (`inventory/permissions.py`) -- write a test
      that attempts every write action as every role and confirms only the
      intended roles succeed (the existing test suite covers a sample of
      this; extend it)
- [ ] `Item` rows cannot be hard-deleted via the API -- confirmed by
      `test_item_cannot_be_hard_deleted`
- [ ] File uploads validated for size (10MB) and MIME type
      (PDF/JPEG/PNG/WEBP) -- note this checks the client-supplied
      Content-Type header, which can be spoofed; consider adding
      server-side content sniffing (e.g. `python-magic`) before go-live if
      uploaded files will be served back to other users
- [ ] HTTPS enforced in production (`SECURE_SSL_REDIRECT`, HSTS)
- [ ] Rate limiting at both the Django (`DEFAULT_THROTTLE_RATES`) and nginx
      (`limit_req_zone`) layers
- [ ] Passwords: 12-char minimum, common-password check
- [ ] `django-auditlog` records who changed what, when, on every tracked model

## Needs a human, not just code

- [ ] **Authentication brute-force protection** -- there's no account
      lockout after repeated failed logins. Consider `django-axes` or
      equivalent before go-live.
- [ ] **Session/token theft scenarios** -- what happens if a refresh token
      is stolen? Currently nothing revokes a specific user's active
      sessions on demand (e.g. on suspected compromise or offboarding).
      Worth a documented incident-response procedure at minimum.
- [ ] **Admin panel exposure** -- `/admin/` is proxied through nginx with no
      additional access restriction (e.g. IP allowlist, VPN-only). Consider
      restricting it, since it's a full data-editing surface beyond the API.
- [ ] **CORS configuration** -- `CORS_ALLOWED_ORIGINS` must be set to the
      exact production frontend origin, never `*`, before go-live.
- [ ] **Secrets handling** -- `.env` files are adequate for a first
      deployment but hold long-lived plaintext secrets on disk. Consider a
      real secrets manager (Vault, AWS/GCP Secrets Manager, or equivalent
      in-country option) for the production `DJANGO_SECRET_KEY` and DB
      credentials.
- [ ] **Dependency scan results** -- CI runs `pip-audit` and `npm audit` on
      every push, but currently only warns rather than blocking the build.
      Decide whether findings should block merges once the baseline is clean.
- [ ] **Penetration test** -- automated scanning does not replace a human
      trying to break authorization boundaries, inject data, or abuse the
      file upload / CSV export endpoints. Commission this before real
      financial/asset data enters the system.
- [ ] **Data Protection Act, 2019 compliance review** -- covered at a policy
      level in the main README; needs sign-off from whoever handles ODPC
      registration for the Treasury.

## How to run the automated checks locally

```bash
cd backend && pip install pip-audit && pip-audit -r requirements.txt
cd frontend && npm audit --audit-level=high
```
