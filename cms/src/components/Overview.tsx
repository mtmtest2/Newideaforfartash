// Support Overview (top of the dashboard). Every number and list is read live from the database; modules that need the
// future central auth/payment systems are named as "later" instead of showing placeholder figures.
import Link from 'next/link'
import type { Payload, Where } from 'payload'
import { offlineCoursesOn } from '../globals/FeatureFlags'
import { describe, faDateTime } from '../lib/labels'

type Props = { payload?: Payload; user?: { name?: string } }
const fmt = (n: number) => n.toLocaleString('fa-IR')
const pub: Where = { _status: { equals: 'published' } }
const COLL: Record<string, string> = { articles: 'مقاله', events: 'رویداد', courses: 'دوره', pages: 'صفحه', teachers: 'استاد', languages: 'زبان' }

export async function Overview(props: Props) {
  const payload = props.payload
  if (!payload) return null
  const c = (collection: Parameters<Payload['count']>[0]['collection'], where?: Where) => payload.count({ collection, where, overrideAccess: true }).then((r) => r.totalDocs)
  const nowIso = new Date().toISOString()
  const [aPub, tActive, tHome, cAll, cPub, eUp, lPub, pPub, media, jobsFailed, flags, recent, noindex, noDesc, scheduled, ...drafts] = await Promise.all([
    c('articles', pub), c('teachers', { profileState: { equals: 'active' } }),
    c('teachers', { and: [pub, { showOnHome: { equals: true } }, { profileState: { equals: 'active' } }] }),
    c('courses'), c('courses', pub), c('events', { and: [pub, { endsAt: { greater_than: nowIso } }] }), c('languages', pub), c('pages', pub), c('media'),
    c('payload-jobs', { hasError: { equals: true } }),
    payload.findGlobal({ slug: 'feature-flags', overrideAccess: true, depth: 0 }),
    payload.find({ collection: 'audit-logs', sort: '-createdAt', limit: 7, depth: 0, overrideAccess: true }),
    c('articles', { and: [pub, { 'seo.noindex': { equals: true } }] }),
    c('articles', { and: [pub, { or: [{ 'seo.description': { exists: false } }, { 'seo.description': { equals: '' } }] }] }),
    payload.find({ collection: 'payload-jobs', overrideAccess: true, depth: 0, limit: 5, sort: 'waitUntil',
      where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { hasError: { not_equals: true } }] } }),
    ...(['articles', 'events', 'courses', 'pages'] as const).map((collection) => payload.find({ collection, draft: true, overrideAccess: true, depth: 0, limit: 3, sort: '-updatedAt',
      where: { and: [{ _status: { equals: 'draft' } }, { title: { exists: true } }] } }).then((r) => r.docs.map((d) => ({ collection, id: d.id, title: String((d as { title?: string }).title), at: d.updatedAt })))),
  ])
  const draftList = (drafts as { collection: string; id: number; title: string; at: string }[][]).flat().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)
  const coursesOn = offlineCoursesOn(flags)
  const cards: [string, string, string, string][] = [
    ['مجله', `${fmt(aPub)} مقاله`, 'منتشرشده', '/support/collections/articles'],
    ['اساتید', `${fmt(tActive)} فعال`, `${fmt(tHome)} در کاروسل صفحهٔ اصلی`, '/support/collections/teachers'],
    ['رویدادها', `${fmt(eUp)} پیش رو`, 'کارگاه، وبینار، جلسهٔ ویژه', '/support/collections/events'],
    ['دوره‌های آفلاین', `${fmt(cAll)} دوره`, `${fmt(cPub)} منتشرشده • ${coursesOn ? 'در سایت' : 'پنهان'}`, '/support/collections/courses'],
    ['زبان‌ها', `${fmt(lPub)} زبان`, 'صفحه‌های معرفی زبان', '/support/collections/languages'],
    ['صفحه‌ها', `${fmt(pPub)} صفحه`, 'درباره، تماس، قوانین', '/support/collections/pages'],
    ['رسانه‌ها', `${fmt(media)} فایل`, 'کتابخانهٔ رسانه', '/support/collections/media'],
    ['انتشار زمان‌بندی‌شده', `${fmt(scheduled.totalDocs)} در صف`, jobsFailed ? `${fmt(jobsFailed)} کار ناموفق` : 'بدون خطا', '/support/monitoring'],
  ]
  const QUICK: [string, string][] = [['مقالهٔ تازه', '/support/collections/articles/create'], ['استاد تازه', '/support/collections/teachers/create'],
    ['رویداد تازه', '/support/collections/events/create'], ['دورهٔ تازه', '/support/collections/courses/create'], ['بارگذاری رسانه', '/support/collections/media/create']]
  const site = (process.env.SITE_URL || '').replace(/\/$/, '')
  const attention = [
    noindex > 0 && { text: `${fmt(noindex)} مقالهٔ منتشرشده هنوز در گوگل نمایه نمی‌شود (تیک «نمایه نشود» در سئو).`, href: '/support/collections/articles?where[seo.noindex][equals]=true' },
    noDesc > 0 && { text: `${fmt(noDesc)} مقالهٔ منتشرشده توضیحات متای سئو ندارد.`, href: '/support/collections/articles' },
    jobsFailed > 0 && { text: `${fmt(jobsFailed)} کار انتشار ناموفق بوده است.`, href: '/support/monitoring' },
  ].filter(Boolean) as { text: string; href: string }[]

  return (
    <section className="fx-overview" aria-labelledby="fx-ov-h">
      <header className="fx-ov-head">
        <div>
          <h1 id="fx-ov-h">سلام{props.user?.name ? `، ${props.user.name}` : ''}</h1>
          <p>نمای کلی محتوای سایت فرتاش؛ همهٔ عددها مستقیم از پایگاه داده خوانده می‌شوند.</p>
        </div>
        <nav className="fx-quick" aria-label="کارهای سریع">
          {QUICK.map(([t, h]) => <Link key={h} href={h} className="fx-quick-btn">＋ {t}</Link>)}
          {site && <a href={site} target="_blank" rel="noopener" className="fx-quick-btn ghost">مشاهدهٔ سایت ↗</a>}
        </nav>
      </header>

      <div className={`fx-flag ${coursesOn ? 'on' : 'off'}`}>
        <span className="fx-dot" aria-hidden="true" />
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
          <h2>نیازمند توجه</h2>
          {attention.length === 0 && draftList.length === 0 && scheduled.docs.length === 0 ? <p className="fx-muted">موردی نیست؛ همه‌چیز مرتب است.</p> : null}
          {attention.length > 0 && <ul className="fx-attn">{attention.map((a) => <li key={a.text}><Link href={a.href}>{a.text}</Link></li>)}</ul>}
          {scheduled.docs.length > 0 && <>
            <h3>انتشارهای زمان‌بندی‌شده</h3>
            <ol className="fx-list">{scheduled.docs.map((j) => {
              const inp = (j.input ?? {}) as { type?: string; doc?: { relationTo?: string; value?: number } }
              return <li key={j.id}><Link href={`/support/collections/${inp.doc?.relationTo}/${inp.doc?.value}`}>{COLL[inp.doc?.relationTo ?? ''] ?? ''} #{inp.doc?.value} — {inp.type === 'unpublish' ? 'لغو انتشار' : 'انتشار'}</Link>
                {j.waitUntil && <small>{faDateTime(j.waitUntil)}</small>}</li>
            })}</ol>
          </>}
          {draftList.length > 0 && <>
            <h3>پیش‌نویس‌های اخیر</h3>
            <ol className="fx-list">{draftList.map((d) => (
              <li key={`${d.collection}-${d.id}`}><Link href={`/support/collections/${d.collection}/${d.id}`}><span className="fx-chip">{COLL[d.collection]}</span> {d.title}</Link><small>{faDateTime(d.at)}</small></li>
            ))}</ol>
          </>}
        </section>
        <section>
          <h2>آخرین فعالیت‌ها</h2>
          {recent.docs.length ? (
            <ol className="fx-list">{recent.docs.map((r) => <li key={r.id}><span>{describe(r as never)}</span><small>{faDateTime(r.createdAt)}</small></li>)}</ol>
          ) : <p className="fx-muted">هنوز فعالیتی ثبت نشده است.</p>}
          <Link href="/support/collections/audit-logs" className="fx-more">همهٔ فعالیت‌ها</Link>
          <p className="fx-later">مدیریت اعضا، نقش‌ها و تراکنش‌ها پس از راه‌اندازی سامانهٔ ورود مرکزی و درگاه پرداخت به همین داشبورد اضافه می‌شود؛ تا آن زمان عمداً عدد ساختگی نشان داده نمی‌شود.</p>
        </section>
      </div>
    </section>
  )
}
