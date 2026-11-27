'use client'
import { describe, ENTITY } from '../lib/labels'
/* List cell: readable Persian sentence (also for rows written before `summary` existed). */
export function AuditCell({ rowData }: { rowData?: Record<string, unknown> }) {
  if (!rowData) return null
  return <span>{describe(rowData as never)}</span>
}

export function ActorCell({ rowData }: { rowData?: Record<string, unknown> }) {
  const name = rowData?.actorName as string | undefined
  const label = String(rowData?.actorLabel ?? '')
  return <span>{name || (label === 'server-cli' || label === 'system' ? 'سامانه' : label.startsWith('staff:') ? 'پشتیبانی' : '—')}</span>
}
const SECTION: Record<string, string> = { articles: 'مجله', teachers: 'اساتید', courses: 'دوره‌ها', events: 'رویدادها', languages: 'زبان‌ها', pages: 'صفحه‌ها',
  media: 'رسانه‌ها', 'private-files': 'فایل‌های خصوصی', redirects: 'تغییر مسیرها', authors: 'نویسندگان', categories: 'دسته‌بندی‌ها', tags: 'برچسب‌ها', staff: 'کارکنان', members: 'کاربران سایت', auth: 'ورود و امنیت' }
export function EntityCell({ cellData }: { cellData?: string }) {
  const k = String(cellData ?? '')
  return <span>{SECTION[k] ?? ENTITY[k] ?? k}</span>
}
