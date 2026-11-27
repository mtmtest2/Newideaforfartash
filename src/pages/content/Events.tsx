import { Link } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import type { EventCardDTO, EventDTO } from '../../content/types'
import { EVENT_TYPES, faTime, faToman, faWeekdayDate, REGISTRATION } from '../../content/format'
import { Gate, Html, Img } from './Gate'

export function EventCard({ e }: { e: EventCardDTO }) {
  return (
    <article className="card post c-event">
      <div className="post-img"><Img img={e.poster} sizes="(max-width: 900px) 90vw, 420px" /><span className="pill pill-sm">{EVENT_TYPES[e.type] ?? 'رویداد'}</span></div>
      <h3><Link to={`/events/${e.slug}`} className="card-link">{e.title}</Link></h3>
      <p>{e.excerpt}</p>
      <div className="post-foot">
        <span><time dateTime={e.startsAt}>{faWeekdayDate(e.startsAt)}، ساعت {faTime(e.startsAt)}</time></span>
        <span className={`c-reg r-${e.registration}`}>{e.past ? 'برگزار شد' : REGISTRATION[e.registration]}</span>
      </div>
    </article>
  )
}

export default function Events() {
  return (
    <Gate<{ upcoming: EventCardDTO[]; past: EventCardDTO[] }>>{(d) => (
      <PageShell tag="فرتاش" title="کارگاه‌ها و رویدادها" text="کارگاه‌ها، وبینارها و جلسه‌های ویژهٔ آموزشگاه فرتاش.">
        {d.upcoming.length ? <div className="post-grid">{d.upcoming.map((e) => <EventCard key={e.slug} e={e} />)}</div>
          : <p className="center c-muted">فعلاً رویداد پیش رویی نداریم.</p>}
        {d.past.length > 0 && <section className="c-related" aria-labelledby="past-h"><h2 id="past-h">رویدادهای گذشته</h2>
          <div className="post-grid">{d.past.map((e) => <EventCard key={e.slug} e={e} />)}</div></section>}
      </PageShell>
    )}</Gate>
  )
}

export function EventPage() {
  return (
    <Gate<EventDTO>>{(e) => (
      <PageShell tag={EVENT_TYPES[e.type] ?? 'رویداد'} title={e.title} text={e.subtitle ?? e.excerpt} docTitle={e.seo.title}>
        <div className="c-profile">
          <div className="c-profile-photo"><Img img={e.poster} sizes="(max-width: 900px) 90vw, 420px" eager /></div>
          <div className="c-profile-body">
            <dl className="c-facts">
              <div><dt>زمان</dt><dd><time dateTime={e.startsAt}>{faWeekdayDate(e.startsAt)}، {faTime(e.startsAt)} تا {faTime(e.endsAt)}</time> (به وقت تهران)</dd></div>
              <div><dt>برگزاری</dt><dd>{e.format === 'online' ? 'آنلاین' : `حضوری${e.venue ? ` — ${e.venue}` : ''}`}</dd></div>
              {e.speaker && <div><dt>ارائه‌دهنده</dt><dd>{e.speaker.slug ? <Link to={`/teachers/${e.speaker.slug}`}>{e.speaker.name}</Link> : e.speaker.name}</dd></div>}
              <div><dt>هزینه</dt><dd>{e.price ? faToman(e.price) : 'رایگان'}</dd></div>
              {e.capacity != null && <div><dt>ظرفیت</dt><dd>{e.capacity.toLocaleString('fa-IR')} نفر</dd></div>}
              <div><dt>ثبت‌نام</dt><dd>{e.past ? 'این رویداد برگزار شده است.' : REGISTRATION[e.registration]}</dd></div>
            </dl>
            {!e.past && e.registration === 'open' && e.registrationUrl && <p><a className="btn btn-primary" href={e.registrationUrl}>ثبت‌نام در {EVENT_TYPES[e.type] ?? 'رویداد'}</a></p>}
            <Html html={e.description} />
            {e.audience && <><h2>مناسب برای</h2><p>{e.audience}</p></>}
            {e.requirements && <><h2>پیش‌نیازها</h2><p>{e.requirements}</p></>}
          </div>
        </div>
      </PageShell>
    )}</Gate>
  )
}
