# Security

## Implemented
- **Server-side authorization** on every CMS collection/global/endpoint (`cms/src/access`). Raw collections are
  staff-only; the public reads only `/api/public/*`, which requires a server key and returns published DTOs.
- **No sign-up / no escalation:** staff accounts only via `npm run create-support-admin` on the server; role and
  active flags are field-locked; no `owner` option exists.
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

## Verified by tests (`cms/tests/integration.mjs`, 66 checks)
Anonymous access to drafts/staff/audit/private files, public API without key, privilege escalation (role → owner),
staff creation, audit edit/delete, diagnostics without auth, revalidation without key, path traversal, SVG/EXE
uploads, forged preview tokens, private fields in DTOs.

## Operational requirements
- Strong random `PAYLOAD_SECRET`, `CONTENT_API_SECRET`, `POSTGRES_PASSWORD` (32+ bytes); never commit `.env`.
- Postgres only on the internal Docker network; `/api/public/*` blocked at the proxy (see Caddyfile snippet).
- Optionally restrict `/support` to office IPs at the proxy.
- Nightly backups (`deploy/platform/backup.sh`) and periodic restore tests.

## Not yet in scope
Central authentication, rate limiting of public sign-in/OTP, payment security and member-data access policies belong
to the future phases (contracts in `contracts/`).
