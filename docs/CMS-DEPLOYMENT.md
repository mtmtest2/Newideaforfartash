# Deployment

The current production setup (`Dockerfile` + `docker-compose.yml`, static Caddy image) is **unchanged** and keeps
working; it shows the built-in content. The live platform is a separate stack: `deploy/platform/`.

## First installation (on the VPS, test it on a staging domain first)
```bash
git pull origin fartash-performance-caddy
cp deploy/platform/.env.example deploy/platform/.env      # fill every CHANGE_ME (openssl rand -hex 32)
docker compose -f deploy/platform/docker-compose.yml --env-file deploy/platform/.env up -d --build postgres cms-migrate cms
docker compose -f deploy/platform/docker-compose.yml --env-file deploy/platform/.env run --rm cms-migrate npx payload run scripts/seed.ts
# the first owner; every other staff account is then created from /owner on the website
docker compose -f deploy/platform/docker-compose.yml --env-file deploy/platform/.env run --rm \
  -e STAFF_ROLE=owner -e STAFF_USERNAME=owner.name -e STAFF_NAME="نام" -e STAFF_PASSWORD='a-long-password-123' \
  cms-migrate npx payload run scripts/create-staff.ts
docker compose -f deploy/platform/docker-compose.yml --env-file deploy/platform/.env up -d --build web
```
Then add `deploy/platform/Caddyfile.snippet` to your existing Caddy: first only the `cms.` block, check the dashboard,
then switch the main domain block from the static container to `fartash-web:3000`.

The seed imports what the site shows today (teachers, languages, article cards, menus, contact) and the current
images (mounted read-only from `src/assets/img`). It runs in one transaction and does nothing if content exists.

## Sign-in (since the identity migration)
- New required variable: `SESSION_SECRET` (32+ random chars). The web server refuses to start on https without it.
- Add `respond /api/identity/* 404` to the `cms.` Caddy block (already in `Caddyfile.snippet`).
- Migration `20261127_222909_identity` adds the account tables and roles. It is additive: existing support accounts
  get a username from their email (e.g. `support@x.ir` → `support`) and keep their password.
- Staff sign in at `/staff/login`; students at `/login`. Details: `docs/AUTH.md`.

## Updating
`git pull` → `docker compose … up -d --build` (migrations run automatically before the CMS starts).

## Backups & rollback
- `deploy/platform/backup.sh /var/backups/fartash` nightly (cron); test restores: `pg_restore -d fartash db-….dump`.
- Before each update: run the backup and keep the previous images (`IMAGE_TAG`).
- Rollback of the site: point the domain back to the static container (old Caddy block). Rollback of the CMS:
  previous image tag + database restore if a migration was involved.

## Resources
≈ 1.5–2 GB RAM for postgres + cms + web; media volume sized for images (videos are external).
