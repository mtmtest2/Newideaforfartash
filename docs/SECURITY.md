# Security

## Implemented
- **Server-side authorization** on every CMS collection/global/endpoint (`cms/src/access`). Raw collections are
  staff-only; the public reads only `/api/public/*`, which requires a server key and returns published DTOs.
- **Sign-in for everyone:** see `docs/AUTH.md`.
  - Members sign up on `/register`; staff accounts are created only by owner/support through server-checked
    endpoints. The first owner comes from `npm run create-staff`.
  - Role, active, username and phone are field-locked for every API caller.
  - Only owner/support can enter the Content Hub.
- **Sessions:** Payload sessions, 8 h, httpOnly cookie, `Secure` in production, `SameSite=Lax`; lockout after 5 failed
  logins for 15 min; CSRF/CORS limited to `CMS_PUBLIC_URL` and `SITE_URL`.
- **Audit:** every content/settings/tool action is written in the same transaction; `audit_logs` is append-only via
  SQL triggers; secrets (password, hash, salt, tokens) are never stored in audit records.
- **Uploads:** MIME allow-list (JPEG/PNG/WebP/AVIF/GIF/PDF; no SVG, no executables), 20 MB limit, duplicate detection,
  alt text required, deletion blocked while used. Private files are a separate staff-only collection.
- **Rich text:** escaped by the Lexical HTML converters, then sanitized (no scripts, event handlers, `javascript:`
  URLs, or iframes other than YouTube-nocookie/Aparat embeds).
- **Hidden features:** offline-course routes return the same 404 as unknown URLs while disabled; not in sitemap,
  menus, home API, or any client bundle data; video asset ids and private files are never in public DTOs.
- **Previews:** HMAC-signed, document-scoped, 30-minute tokens; preview responses are `noindex` + `no-store`.
- **Web server:** path-traversal-safe static serving, `/__revalidate` requires the shared key, panel routes `noindex`.
- **Headers:** `nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN` and `X-Robots-Tag: noindex` on the CMS.

## Verified by tests (`cms/tests/integration.mjs`, 66 checks; `cms/tests/identity.mjs`, 81 checks)
Identity: cookie theft/tampering/slot swap, CSRF, open redirect, audience injection, role escalation by support and
teachers, last-owner protection, lockout, session revocation (logout, password change, deactivation), OTP attempt
limits and replay, rate limits, enumeration (message + timing), static-file bypass of page guards.

Content Hub:
Anonymous access to drafts/staff/audit/private files, public API without key, privilege escalation (role → owner),
staff creation, audit edit/delete, diagnostics without auth, revalidation without key, path traversal, SVG/EXE
uploads, forged preview tokens, private fields in DTOs.

## Operational requirements
- Strong random `PAYLOAD_SECRET`, `CONTENT_API_SECRET`, `POSTGRES_PASSWORD` (32+ bytes); never commit `.env`.
- Postgres only on the internal Docker network; `/api/public/*` blocked at the proxy (see Caddyfile snippet).
- Optionally restrict `/support` to office IPs at the proxy.
- Nightly backups (`deploy/platform/backup.sh`) and periodic restore tests.

## Not yet in scope
- SMS provider for one-time codes: the code path is ready; it needs a provider account.
- Two-factor sign-in for owner/support.
- Password reset by email or SMS: until then, owner/support set a new password from the dashboard.
- Payment security and server-side storage of panel data (classes, homework, chats) are later phases (contracts in
  `contracts/`).
