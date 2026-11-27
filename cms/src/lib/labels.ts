// Persian labels for audit entries (dashboard overview + audit log). Works for old rows too (computed on read).
export const ENTITY: Record<string, string> = {
  articles: 'مقالهٔ', teachers: 'استادِ', courses: 'دورهٔ', events: 'رویدادِ', languages: 'صفحهٔ زبانِ', pages: 'صفحهٔ',
  authors: 'نویسندهٔ', categories: 'دسته‌بندیِ', tags: 'برچسبِ', media: 'رسانهٔ', 'private-files': 'فایل خصوصیِ', redirects: 'تغییر مسیرِ',
  staff: 'حساب کارمندِ', members: 'حساب کاربرِ', auth: 'ورود', 'global:home-layout': 'تنظیمات صفحهٔ اصلی', 'global:navigation': 'منوی سایت', 'global:site-settings': 'اطلاعات آموزشگاه',
  'global:feature-flags': 'قابلیت‌های سایت', 'site-cache': 'حافظهٔ سایت', jobs: 'صف انتشار', content: 'محتوای اولیه',
}
const VERB: Record<string, string> = {
  create: 'ساخت', update: 'ویرایش کرد', publish: 'منتشر کرد', unpublish: 'از انتشار خارج کرد', delete: 'حذف کرد',
  'tool.revalidate': 'به‌روزرسانی کرد', 'tool.run-jobs': 'اجرا کرد', seed: 'وارد کرد', 'staff.create': 'ساخت', cleanup: 'پاک‌سازی کرد',
}
type Entry = { action: string; entity: string; entityId?: string | null; after?: unknown; before?: unknown; summary?: string | null; actorName?: string | null; actorLabel?: string | null }
const titleOf = (v: unknown) => {
  if (!v || typeof v !== 'object') return ''
  const o = v as Record<string, unknown>
  return String(o.title ?? o.name ?? (o.firstName ? `${o.firstName} ${o.lastName ?? ''}` : null) ?? o.filename ?? '').trim()
}
export function describe(e: Entry): string {
  if (e.summary) return e.summary
  const who = e.actorName || (e.actorLabel === 'server-cli' || e.actorLabel === 'system' ? 'سامانه' : 'پشتیبانی')
  const ent = ENTITY[e.entity] ?? e.entity
  const t = titleOf(e.after) || titleOf(e.before)
  const what = e.entity.startsWith('global:') || ['site-cache', 'jobs', 'content'].includes(e.entity) ? ent : `${ent} ${t ? `«${t}»` : `#${e.entityId ?? ''}`}`
  if (e.entity === 'global:feature-flags' && e.after && typeof e.after === 'object') {
    const on = (e.after as { offlineCoursesEnabled?: boolean }).offlineCoursesEnabled
    if (typeof on === 'boolean') return `${who} نمایش دوره‌های آفلاین را ${on ? 'روشن' : 'خاموش'} کرد`
  }
  if (e.action === 'create') return `${who} ${what} را ساخت`
  return `${who} ${what} را ${VERB[e.action] ?? e.action}`
}
export const faDateTime = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
