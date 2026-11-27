# CMS database

## Ownership
| Schema | Owner | Migrations | Contents |
|---|---|---|---|
| `cms` | Payload (Content Hub) | `cms/src/migrations` (Payload/Drizzle), applied by `npx payload migrate` | content collections, versions, media metadata, globals, staff accounts, sessions, audit log, job queue |
| `app` | future platform API (Prisma) | future `app/prisma/migrations` | users, roles, sessions, enrollments, invoices, transactions, classes, attendance |
| `public` | nobody | — | left empty |

Rules: no tool migrates a schema it does not own; no cross-schema foreign keys; Payload runs with `push: false`, so
schema changes happen only through reviewed migration files; one database role per app in production
(`fartash_cms` with rights on `cms` only, `fartash_app` on `app` only) is recommended when `app` is created.

## Migrations (in order)
1. `20261127_165733_initial` — all content tables, versions (`_*_v`), relations, enums, jobs queue.
2. `20261127_165910_home_section_tags` — section label fields on the homepage global.
3. `20261127_170000_audit_append_only` — triggers that reject `UPDATE`, `DELETE` and `TRUNCATE` on `cms.audit_logs`.

Create a new one after changing a collection: `cd cms && npx payload migrate:create <name>`, review the SQL, commit,
deploy (the `cms-migrate` container applies it before the CMS starts).

## Main tables (schema cms)
articles · teachers · courses (+ modules/chapters/lessons rows) · events · languages · pages (+ block tables) ·
authors · categories · tags · media · private_files · redirects · staff · audit_logs · payload_jobs ·
home_layout · navigation · site_settings · feature_flags · `_<collection>_v` version tables · payload_preferences ·
payload_locked_documents · payload_migrations.

## Data integrity
- Teachers are archived/deactivated (`profile_state`), never deleted, so historical references stay valid.
- Media used by content cannot be deleted (checked across all referencing fields).
- Staff accounts cannot be deleted (deactivate instead) so audit history keeps its actor.
- `audit_logs` is append-only at the SQL level.
- Lesson rows keep stable ids (`courses_modules_chapters_lessons.id`) for future progress tracking.
