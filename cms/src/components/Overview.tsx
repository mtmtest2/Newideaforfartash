// Support Overview (top of the dashboard). Every number is a live database count; modules that need the future central
// auth/payment systems are listed as "not available yet" instead of showing placeholder figures.
import Link from 'next/link'
import type { Payload, Where } from 'payload'
import { offlineCoursesOn } from '../globals/FeatureFlags'

type Props = { payload?: Payload; user?: { name?: string } }
const fmt = new Intl.NumberFormat('fa-IR')
const pub: Where = { _status: { equals: 'published' } }
const draft: Where = { _status: { equals: 'draft' } }

export async function Overview(props: Props) {
  const payload = props.payload
  if (!payload) return null
  const c = (collection: Parameters<Payload['count']>[0]['collection'], where?: Where) => payload.count({ collection, where, overrideAccess: true }).then((r) => r.totalDocs)
  const nowIso = new Date().toISOString()
  const [aPub, aDraft, tActive, tHome, cAll, cPub, eUp, lPub, pPub, media, jobsPending, jobsFailed, flags, recent] = await Promise.all([
    c('articles', pub), c('articles', draft), c('teachers', { profileState: { equals: 'active' } }), c('teachers', { and: [pub, { showOnHome: { equals: true } }, { profileState: { equals: 'active' } }] }),
    c('courses'), c('courses', pub), c('events', { and: [pub, { endsAt: { greater_than: nowIso } }] }), c('languages', pub), c('pages', pub), c('media'),
    c('payload-jobs', { and: [{ completedAt: { exists: false } }, { hasError: { not_equals: true } }] }), c('payload-jobs', { hasError: { equals: true } }),
    payload.findGlobal({ slug: 'feature-flags', overrideAccess: true, depth: 0 }),
    payload.find({ collection: 'audit-logs', sort: '-createdAt', limit: 8, depth: 1, overrideAccess: true }),
  ])
  const coursesOn = offlineCoursesOn(flags)
  const cards: [string, string, string, string][] = [
    ['مجله', `${fmt.format(aPub)} منتشرشده`, `${fmt.format(aDraft)} پیش‌نویس`, '/support/collections/articles'],
    ['اساتید', `${fmt.format(tActive)} فعال`, `${fmt.format(tHome)} در کاروسل`, '/support/collections/teachers'],
    ['رویدادها', `${fmt.format(eUp)} پیش رو`, 'کارگاه و وبینار', '/support/collections/events'],
    ['زبان‌ها و صفحه‌ها', `${fmt.format(lPub)} زبان`, `${fmt.format(pPub)} صفحهٔ منتشرشده`, '/support/collections/languages'],
    ['دوره‌های آفلاین', `${fmt.format(cAll)} دوره (${fmt.format(cPub)} منتشرشده)`, coursesOn ? 'در سایت نمایش داده می‌شود' : 'در سایت پنهان است', '/support/collections/courses'],
    ['رسانه‌ها', `${fmt.format(media)} فایل`, 'کتابخانهٔ رسانه', '/support/collections/media'],
    ['انتشار زمان‌بندی‌شده', `${fmt.format(jobsPending)} در صف`, jobsFailed ? `${fmt.format(jobsFailed)} ناموفق` : 'بدون خطا', '/support/monitoring'],
  ]
  return (
    <section className="fx-overview" aria-labelledby="fx-ov-h">
      <header className="fx-ov-head">
        <h1 id="fx-ov-h">سلام{props.user?.name ? `، ${props.user.name}` : ''}</h1>
        <p>نمای کلی محتوای سایت فرتاش. همهٔ عددها مستقیم از پایگاه داده خوانده می‌شوند.</p>
      </header>
      <div className={`fx-flag ${coursesOn ? 'on' : 'off'}`}>
        <b>دوره‌های آفلاین: {coursesOn ? 'روشن' : 'خاموش'}</b>
        <span>{coursesOn ? 'دوره‌های منتشرشده و کاروسل تنظیم‌شده در سایت دیده می‌شوند.' : 'هیچ اثری از دوره‌های آفلاین در سایت عمومی نیست.'}</span>
        <Link href="/support/globals/feature-flags">تغییر در «قابلیت‌های سایت»</Link>
      </div>
      <ul className="fx-cards">
        {cards.map(([t, a, b, href]) => (
          <li key={t}><Link href={href}><span>{t}</span><b>{a}</b><small>{b}</small></Link></li>
        ))}
      </ul>
      <div className="fx-ov-cols">
        <section>
          <h2>آخرین رویدادهای ثبت‌شده</h2>
          {recent.docs.length ? (
            <ol className="fx-audit">
              {recent.docs.map((r) => (
                <li key={r.id}><b>{r.action}</b> <span>{r.entity}{r.entityId ? ` #${r.entityId}` : ''}</span>
                  <small>{typeof r.actor === 'object' && r.actor ? r.actor.name : r.actorLabel} • {new Date(r.createdAt).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })}</small></li>
              ))}
            </ol>
          ) : <p className="fx-muted">هنوز رویدادی ثبت نشده است.</p>}
          <Link href="/support/collections/audit-logs">همهٔ رویدادها</Link>
        </section>
        <section>
          <h2>بخش‌هایی که بعد از راه‌اندازی سامانهٔ مرکزی اضافه می‌شوند</h2>
          <p className="fx-muted">این بخش‌ها به حساب‌های واقعی کاربران و تراکنش‌ها نیاز دارند و تا ساخته شدن احراز هویت مرکزی و سامانهٔ پرداخت، عمداً نمایش داده نمی‌شوند تا هیچ عدد ساختگی‌ای در داشبورد نباشد:</p>
          <ul className="fx-later"><li>مدیریت اعضا و نقش‌ها</li><li>تراکنش‌ها و فاکتورها</li><li>ثبت‌نام‌ها و کلاس‌های زنده</li><li>وضعیت پیامک، ایمیل و درگاه پرداخت</li></ul>
        </section>
      </div>
    </section>
  )
}
