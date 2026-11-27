# Fartash architecture

Status: Content Hub implemented (Phases 0–5). Central authentication, payments and live-class operations are **not
implemented yet**; their integration contracts are in `contracts/` and `docs/AUTH-CONTRACT.md`, `docs/PAYMENTS-CONTRACT.md`.

## Components

```
                 ┌────────────────────────── existing reverse proxy (Caddy) ──────────────────────────┐
 visitors ──▶    │  mrmdev.xyz  ─────────────▶  fartash-web :3000          cms.mrmdev.xyz ─▶ fartash-cms :3001 │ ◀── Support staff
                 └──────────────────────────────────────────────────────────────────────────────────────┘
                              │  server-to-server (Docker network, shared key)        │
                              └──────────▶ GET /api/public/*  ◀───────────────────────┘
                              ◀────────── POST /__revalidate (after every change)
                                                                     │
                                                              PostgreSQL 16
                                                     schema cms (Payload) │ schema app (future platform API)
```

| Part | Tech | Path | Owns |
|---|---|---|---|
| Public website | Vite 8 + React 19 (unchanged components) + `server/index.mjs` (Node 22) | `src/`, `server/` | rendering, page cache, sitemap, redirects |
| Content Hub / Support Dashboard | Next.js 16.4 + Payload 3.94 (Node 22) | `cms/` | all public content, media, flags, staff accounts, audit log |
| Database | PostgreSQL 16 | `deploy/platform` | schema `cms` (Payload), schema `app` (reserved) |
| Future platform API | not built | — | users, roles, sessions, classes, enrollments, invoices, transactions |

## Rendering model
- `server/index.mjs` renders each public URL with the **same React components** used before, through the same page
  pipeline as the build-time prerender (`scripts/page.mjs`: head tags, critical CSS, fonts). Data comes from the CMS
  public API and is embedded in the page (`<script id="__content">`) for hydration.
- Pages are cached in memory; the CMS calls `POST /__revalidate` after every content/settings change, and entries
  also expire after `CACHE_TTL`. **No rebuild or redeploy is needed for any content change or feature activation.**
- Client-side navigation reads `/__data?path=…` from the web server (which holds the CMS key); the browser never
  talks to the CMS API.
- If the CMS is down: last good page (stale) → static build of the route (built-in content) → 503 page.
- The original static image (`Dockerfile` + Caddy) still builds and serves the site with the built-in content
  (`src/content/fallback.ts`), so the current production deployment keeps working until you switch.

## Identity model (today vs. future)
- **Today:** the only real accounts are CMS staff (`cms.staff`, role `support`), created from the server CLI.
  Student/teacher/reception "panels" in `src/panel`, `src/teacher`, `src/reception` are **front-end demos** with
  browser-only data; they must not hold real data and are not connected to the CMS.
- **Future:** one central identity (schema `app`) for every person and role; staff accounts link through
  `cms.staff.fartash_user_id`, then CMS sign-in moves to the central session (see `docs/AUTH-CONTRACT.md`).
  No second user system is created in the meantime.

## Content vs. operations
Content (articles, teacher profiles, events, offline-course catalogue, language pages, page blocks, media) lives in
schema `cms`. Operational data (accounts, enrollments, payments, attendance, live classes) will live in schema `app`.
They reference each other only by id (e.g. an enrollment stores `cmsCourseId`; a teacher profile stores
`fartashUserId`), never through cross-schema foreign keys, so either side can evolve independently.

## Decisions that differ from the original specification (approved in Phase 0)
| Spec assumption | Reality / decision |
|---|---|
| Existing Next.js app | Site stays Vite + React; Payload runs as a separate Next.js app |
| Existing auth, roles, dashboards | Only CMS staff auth exists; Owner/Supervisor/Applicant and real member management wait for the central auth phase |
| Existing payments/transactions | None; contracts only, no fake records |
| Prisma for everything | Payload owns schema `cms` (Drizzle migrations); Prisma reserved for schema `app` (future) |
| 3 languages | 5 languages kept (EN, DE, FR, AR, TR) by owner decision |
| `/magazine` | Implemented; `/blog` redirects permanently (CMS-managed redirect) |
