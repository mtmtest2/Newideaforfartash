# System monitoring

Support Dashboard → «وضعیت سامانه و ابزارهای عیب‌یابی» (`/support/monitoring`). Every status is probed at request
time; nothing is estimated or simulated.

| Check | How | Status |
|---|---|---|
| PostgreSQL | `select 1` latency | operational / degraded (>500 ms) / critical |
| Public website | GET `SITE_URL` | operational / degraded (>2 s) / critical |
| Site cache revalidation | result of the last `POST /__revalidate` | operational / warning / unknown / not configured |
| Job queue & scheduled publishing | pending, late (>5 min), failed jobs | operational / degraded / warning |
| Media & private storage | writable + free space | operational / warning (<15 %) / critical (<5 %) |
| Central auth, payments, SMS, email | — | **not configured** (future phases; never shown as healthy) |

Tools (audited, report the real server result): «به‌روزرسانی حافظهٔ سایت» (clear the site cache),
«اجرای صف انتشار» (run due scheduled publications now).

Containers: `fartash-web` (`/healthz`), `fartash-cms` (`/health`), `fartash-postgres` (`pg_isready`) have Docker
health checks; logs via `docker logs <name>`.
