# Phase 0 — Architecture Audit (Content Hub & Support Control Center)

Audit date: 2026-11-27 · Branch audited: `fartash-performance-caddy` @ `58c5ef1` (also compared with `origin/main`)
Scope: read-only. No code, dependency, database or deployment change was made in this phase.

## 1. Verdict

The specification describes a platform that **does not exist in this repository**. Fartash today is a
**static, prerendered React SPA** with **no server, no database, no authentication and no payments**.
All "dashboards" built so far are **front-end demos** whose data lives in the visitor's browser (localStorage).

So the spec cannot be implemented as an *extension* of an existing Next.js/PostgreSQL/Prisma backend: that backend
has to be **built first**. This is a major architectural change (new runtime, database, auth, deployment topology)
and, as the spec requires, it is reported here for a decision **before** any risky change.

## 2. What the repository actually contains (verified)

| Item | Spec assumes | Repository reality |
|---|---|---|
| Framework | Next.js | **Vite 8.3.8** + React **19.3.1** + react-router-dom **7.18.6** (SPA) |
| Rendering | SSR/ISR | Build-time prerender (`scripts/prerender.mjs`, `react-dom/static`) of 25 routes → static HTML |
| Language/tooling | TypeScript | TypeScript **7.0.2**, Node **22.23.5** (build image `node:22-bookworm-slim`) |
| Database | PostgreSQL | **None** (no DB, no ORM, no migrations) |
| ORM | Prisma | **None** |
| Server / API | APIs, server actions | **None** — no `fetch` to any API anywhere in `src/` |
| Authentication | Existing auth system | **None.** Login is a demo: any phone + any 5‑digit code; "session" is a JSON object in localStorage |
| Roles | Owner, Support, Reception, Supervisor, Teacher, Student, Applicant | Demo only: **student, teacher, reception** (client-side). **Owner, Support, Supervisor, Applicant do not exist** |
| Dashboards | Owner, Support, Reception, Supervisor, Teacher | Demo `/panel` (student), `/teacher`, `/reception`. **No Owner, Support or Supervisor dashboard** |
| Payments / transactions | Existing implementation | **None.** Invoices in the student panel are generated demo data; no gateway integration |
| Teachers model | DB model + carousel | Static array `PROFS` in `src/data.ts` (5 teachers, placeholder names/numbers) feeding the home carousel and `/teachers` |
| Magazine | `/magazine/[slug]` | `/blog` listing of 5 static posts (`POSTS` in `src/data.ts`); **no article pages** |
| Languages | English, German, French | Site advertises **5**: English, German, French, Arabic, Turkish. **No language pages** exist |
| Offline courses | — | Only as a demo course inside the student panel |
| SMS / email | Gateways to monitor | **None** (skills for Kavenegar OTP and Zarinpal exist in `.claude/skills`, not integrated) |
| Deployment | Existing production | Docker multi-stage: Node builds → **Caddy 2.11 serves static files** (`deploy/caddy/Caddyfile`). Behind an existing Caddy proxy (network `caddy`) or standalone. No app server, no DB container, no volumes |
| Other repos | — | No other Fartash repository is accessible to this session |

### Current demo layer (important for security)
`src/school/db.ts` + `src/panel/session.ts` simulate a backend in localStorage. Consequences:
- Anyone can open DevTools, write `fartash-teacher` / `fartash-reception` into localStorage and "be" staff.
- All demo data ships inside the public JS bundle.
- Nothing is shared between devices or users.
This layer is fine for UX prototyping and **must never hold real student, teacher or financial data**.
It was written with a single swap point (`src/school/db.ts`) so it can be replaced by API calls.

## 3. Audit items 1–11

1. **Repository** — 1 app; `src/pages` (Home, Teachers, Blog, Placement, Login), `src/components`, `src/panel` (student),
   `src/teacher`, `src/reception`, `src/school` (demo data store), scripts for prerender, e2e (Playwright), axe, Lighthouse.
2. **Versions** — see table. Node 22 locally and in Docker.
3. **PostgreSQL / Prisma** — absent.
4. **Authentication** — absent (demo only).
5. **Roles / permissions** — client-side demo checks only (e.g. `canModerate` in `src/school/db.ts`); nothing is enforced server-side because there is no server.
6. **Dashboards** — student, teacher, reception exist as UI demos with real interactions against the local store; Owner/Support/Supervisor absent.
7. **Transactions / payments / user management** — absent.
8. **Teacher models & carousel** — `PROFS` static array; carousel in `src/components/Cards.tsx`/`Classes.tsx` with `useAutoplay` + `useCarouselPause`. This is the component the offline-course carousel must mirror.
9. **Magazine & language pages** — `/blog` list only; no article route; no language pages.
10. **Docker / proxy / production** — static Caddy image; healthcheck on loopback :8081; caching policy tuned for static assets. Adding a CMS/API requires a **Node runtime container, a PostgreSQL container, persistent volumes (DB + media) and backups**, plus proxy routes.
11. **APIs / services / DB relationships** — none.

## 4. Payload CMS compatibility

Per Payload's current docs (v4 line): requires **Next.js ≥ 16.4**, **Node ≥ 24.15**, **TypeScript ≥ 6.0.3**; the Postgres adapter is
`@payloadcms/db-postgres` (Drizzle-based); Lexical editor; Persian (`fa`) admin translation with automatic RTL.

Compatibility with this repo:
- **Not compatible as-is.** Payload must be hosted inside a Next.js app; this repo has no Next.js. Using Payload means either
  migrating the site to Next.js 16 or running Payload as a **separate** Next.js service.
- Node 22 → **24** upgrade required (local, CI, Docker).
- TypeScript 7.0.2 is newer than the minimum; needs verification that Payload's type generation works with TS 7 (native compiler).
- Payload's Postgres adapter uses **Drizzle**, not Prisma. Using Prisma as well means **two ORMs on one database**; this is workable only with strict
  schema ownership (e.g. Postgres schema `cms` owned by Payload, schema `app` owned by Prisma) and no cross-ORM migrations.
- Payload brings its own auth/users collection. The spec says "use existing identities" — there are none, so one identity system must be **designed**, not reused.
- The spec wants the CMS **inside the Support Dashboard**, not Payload's `/admin`. Payload's admin can be restricted to staff and visually themed,
  or the Support Dashboard can be a custom UI over Payload's Local/REST API (more work; full design control).

## 5. The "no redeploy" requirement vs. the current rendering model

Publishing an article, adding a teacher or enabling offline courses "without deployment" is **impossible with build-time prerendering**:
every page is baked into static HTML at `docker build`. Any of the options below therefore replaces static serving of public pages with
**runtime rendering + cache/revalidation** (Next.js ISR/on-demand revalidation, or a Node SSR server with an HTML cache).
The performance work done earlier (critical CSS, font preloads, image strategy) must be re-applied in the new model.

## 6. Options

| | A. Next.js 16 + Payload (one app) | B. Keep Vite UI, add backend services | C. Keep Vite UI, custom backend (no Payload) |
|---|---|---|---|
| Public site | Migrated to Next.js App Router (components reused; routing/prerender rewritten) | Vite SSR server (Express/Hono) using existing `entry-server.tsx` | Same as B |
| CMS | Payload in the same app; Support Dashboard = Payload admin (restricted, themed, Persian RTL) + custom Support views | Payload as a separate Next.js service, headless | Custom modules (drafts, versions, scheduling, media) written by us; Lexical editor in our UI |
| Operational data (users, roles, classes, transactions, audit) | Prisma schema `app` (or Payload collections) | Prisma API service | Prisma API service |
| Matches the spec | Closest | Partially (two runtimes) | Ignores the Payload preference |
| Effort / risk | High one-time migration; least custom CMS code | Highest ops complexity (3 services) | Highest custom code; most control |
| Production footprint | Node app + Postgres | Node SSR + Payload + API + Postgres | Node SSR/API + Postgres |

**Recommendation: A**, executed in small, reversible steps on a new branch, keeping the current static site deployable until the new stack passes the same e2e/a11y/performance gates.

## 7. Conflicts that need an owner decision

1. **Stack** — A / B / C above (major dependency and deployment change).
2. **Languages** — spec lists 3 (EN/DE/FR); the live site shows 5 (adds Arabic, Turkish). Keep 5, or remove Arabic/Turkish everywhere?
3. **Missing roles/dashboards** — Owner, Support, Supervisor, Applicant must be created, not extended. Proposed: Support (full Control Center) + a minimal Owner console (privileged approvals) now; Supervisor and Applicant flows later.
4. **Payments** — no gateway exists, so "Transactions" can only show records once a gateway (e.g. Zarinpal) and invoices are built. Refunds stay out of scope.
5. **Authentication** — phone + SMS OTP (e.g. Kavenegar) for all roles, staff accounts created by Owner/Support only. Needs an SMS provider account and API key.
6. **`/blog` vs `/magazine`** — spec route is `/magazine/[slug]`; propose `/magazine` with a permanent redirect from `/blog`.
7. **Hosting** — the VPS must run Node + PostgreSQL (≈2 GB RAM recommended), persistent volumes for DB and media, and nightly DB backups; large course videos need object storage (S3-compatible) with signed URLs.
8. **Demo dashboards** — student/teacher/reception demos are rewired to the real API in their own phase; until then they stay demo-only and must not receive real data.

## 8. Security findings (current state)

- No server-side authorization exists anywhere; every role check is client-side and bypassable (demo only).
- No secrets are present in the repo (`.env.example` holds only site URL / network names).
- Static Caddy config is safe for static content (no directory listing; `/.well-known` blocked from SPA fallback).
- The new backend must add: server-enforced RBAC, httpOnly secure session cookies, CSRF protection for cookie-auth mutations, rate limiting (OTP, login, uploads),
  IDOR checks on every record read, file-type/size validation, private media with signed URLs, audit log append-only at the DB level, secrets only in env.

## 9. Proposed migration strategy (for option A)

0. New branch `fartash-platform` from `fartash-performance-caddy`. Current branch stays deployable.
1. Next.js 16 + Node 24 skeleton; port public pages/components 1:1; reproduce prerender quality (SSG + on-demand revalidation); keep e2e/axe/Lighthouse green.
2. PostgreSQL (Docker), Prisma schema `app`: users, roles, permissions, sessions, audit_log (append-only), feature_flags.
3. Auth (phone OTP), server RBAC, Support + Owner consoles.
4. Payload in schema `cms`: media, authors, categories/tags, magazine, teachers, languages, events, offline courses (flag-gated), pages/blocks, SEO, redirects; Persian admin.
5. Wire the public site to the content services (teacher carousel from CMS, magazine, events, languages, hidden-by-default offline courses + carousel).
6. Support Control Center: overview from real data, members, roles, audit, monitoring/health checks, diagnostics.
7. Deployment: `app` + `postgres` containers, volumes, backups, rollback, proxy routes; documented in `CMS-DEPLOYMENT.md`.

Each phase ends with: tests, production build, logical commits, report of files/DB/security changes, and remaining work.
