// Real health checks only. Every result comes from an actual probe at request time; nothing is simulated.
import fs from 'node:fs/promises'
import path from 'node:path'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { lastRevalidation } from '../lib/revalidate'

export type Status = 'operational' | 'degraded' | 'warning' | 'critical' | 'unknown' | 'not_configured'
export type Check = { key: string; label: string; status: Status; detail: string; checkedAt: string; hint?: string }
const now = () => new Date().toISOString()
const n = (v: number, d = 0) => v.toLocaleString('fa-IR', { maximumFractionDigits: d })

async function timed<T>(fn: () => Promise<T>) { const t = performance.now(); const v = await fn(); return { v, ms: Math.round(performance.now() - t) } }

export async function runChecks(payload: Payload): Promise<Check[]> {
  const out: Check[] = []
  // 1. database
  try {
    const { ms } = await timed(() => (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle.execute(sql`select 1`))
    out.push({ key: 'db', label: 'پایگاه داده (PostgreSQL)', status: ms > 500 ? 'degraded' : 'operational', detail: `پاسخ در ${n(ms)} میلی‌ثانیه`, checkedAt: now() })
  } catch (e) {
    out.push({ key: 'db', label: 'پایگاه داده (PostgreSQL)', status: 'critical', detail: (e as Error).message.slice(0, 200), checkedAt: now(), hint: 'وضعیت کانتینر postgres و متغیر DATABASE_URL را بررسی کنید.' })
  }
  // 2. public website
  const site = process.env.SITE_URL
  if (!site) out.push({ key: 'site', label: 'سایت عمومی', status: 'not_configured', detail: 'SITE_URL تنظیم نشده است.', checkedAt: now() })
  else {
    try {
      const { v: res, ms } = await timed(() => fetch(site, { method: 'GET', signal: AbortSignal.timeout(5000), redirect: 'manual' }))
      const ok = res.status < 400
      out.push({ key: 'site', label: 'سایت عمومی', status: !ok ? 'critical' : ms > 2000 ? 'degraded' : 'operational', detail: `HTTP ${res.status} در ${n(ms)} میلی‌ثانیه`, checkedAt: now(), hint: ok ? undefined : 'کانتینر fartash-web و تنظیمات Caddy را بررسی کنید.' })
    } catch (e) {
      out.push({ key: 'site', label: 'سایت عمومی', status: 'critical', detail: (e as Error).message.slice(0, 200), checkedAt: now(), hint: 'کانتینر fartash-web و شبکهٔ Docker را بررسی کنید.' })
    }
  }
  // 3. cache revalidation hook (site <- CMS)
  if (!process.env.SITE_REVALIDATE_URL) out.push({ key: 'revalidate', label: 'به‌روزرسانی حافظهٔ سایت', status: 'not_configured', detail: 'SITE_REVALIDATE_URL تنظیم نشده است؛ سایت فقط با انقضای خودکار حافظه به‌روز می‌شود.', checkedAt: now() })
  else out.push({
    key: 'revalidate', label: 'به‌روزرسانی حافظهٔ سایت',
    status: lastRevalidation.at == null ? 'unknown' : lastRevalidation.ok ? 'operational' : 'warning',
    detail: lastRevalidation.at == null ? 'از زمان راه‌اندازی هنوز درخواستی ارسال نشده است.' : lastRevalidation.ok ? `آخرین موفق: ${lastRevalidation.at}` : `آخرین خطا (${lastRevalidation.at}): ${lastRevalidation.error}`,
    checkedAt: now(), hint: lastRevalidation.ok === false ? 'از «ابزارها» دکمهٔ به‌روزرسانی حافظهٔ سایت را بزنید؛ اگر باز خطا داد، CONTENT_API_SECRET دو طرف را مقایسه کنید.' : undefined,
  })
  // 4. background jobs (scheduled publishing)
  try {
    const [pending, failed] = await Promise.all([
      payload.count({ collection: 'payload-jobs', where: { and: [{ completedAt: { exists: false } }, { hasError: { not_equals: true } }] }, overrideAccess: true }),
      payload.count({ collection: 'payload-jobs', where: { hasError: { equals: true } }, overrideAccess: true }),
    ])
    const late = await payload.count({ collection: 'payload-jobs', where: { and: [{ completedAt: { exists: false } }, { hasError: { not_equals: true } }, { waitUntil: { less_than: new Date(Date.now() - 5 * 60000).toISOString() } }] }, overrideAccess: true })
    out.push({
      key: 'jobs', label: 'صف کارها و انتشار زمان‌بندی‌شده',
      status: failed.totalDocs ? 'warning' : late.totalDocs ? 'degraded' : 'operational',
      detail: `${n(pending.totalDocs)} در صف • ${n(late.totalDocs)} با تأخیر بیش از ۵ دقیقه • ${n(failed.totalDocs)} ناموفق`, checkedAt: now(),
      hint: late.totalDocs ? 'اجرای خودکار صف (DISABLE_JOBS) را بررسی کنید.' : failed.totalDocs ? 'کارهای ناموفق را در «ابزارها» دوباره اجرا کنید.' : undefined,
    })
  } catch (e) {
    out.push({ key: 'jobs', label: 'صف کارها و انتشار زمان‌بندی‌شده', status: 'unknown', detail: (e as Error).message.slice(0, 200), checkedAt: now() })
  }
  // 5. media storage
  for (const [key, label, dir] of [['media', 'فضای رسانه‌ها', process.env.MEDIA_DIR || 'media'], ['private', 'فضای فایل‌های خصوصی', process.env.PRIVATE_FILES_DIR || 'private']] as const) {
    try {
      const p = path.resolve(/* turbopackIgnore: true */ dir)
      await fs.access(p, fs.constants.W_OK)
      const s = await fs.statfs(p)
      const freeGb = (s.bavail * s.bsize) / 1e9
      const freePct = (s.bavail / s.blocks) * 100
      out.push({ key, label, status: freePct < 5 ? 'critical' : freePct < 15 ? 'warning' : 'operational', detail: `${n(freeGb, 1)} گیگابایت آزاد (${n(freePct)}٪)`, checkedAt: now(), hint: freePct < 15 ? 'فضای دیسک سرور را افزایش دهید یا فایل‌های بلااستفاده را پاک کنید.' : undefined })
    } catch (e) {
      out.push({ key, label, status: 'critical', detail: `پوشه قابل نوشتن نیست: ${(e as Error).message.slice(0, 120)}`, checkedAt: now(), hint: 'mount شدن volume و دسترسی نوشتن را بررسی کنید.' })
    }
  }
  // 6. services that do not exist yet: reported honestly, never as "operational"
  for (const [key, label] of [['auth', 'احراز هویت مرکزی کاربران'], ['payments', 'درگاه پرداخت'], ['sms', 'سامانهٔ پیامک'], ['email', 'ارسال ایمیل']] as const) {
    out.push({ key, label, status: 'not_configured', detail: 'هنوز پیاده‌سازی نشده است (فاز آینده).', checkedAt: now() })
  }
  return out
}
