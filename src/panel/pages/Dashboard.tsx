import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fa, faDec } from '../../lib/fa'
import { formatDate, formatDuration, formatTime, relativeDay, WEEKDAYS, WEEKDAYS_SHORT, weekdayIndex } from '../../lib/jalali'
import { COURSES, courseById, type Session } from '../data'
import { ME } from '../../school/db'
import { usePanel } from '../context'
import { JOIN_EARLY_MS, useNow } from '../hooks'
import { Bar, Chip, Icon, Modal } from '../ui'

export function NextClassCard({ s, compact = false }: { s: Session; compact?: boolean }) {
  const now = useNow()
  const [joining, setJoining] = useState(false)
  const live = now >= s.start && now < s.end
  const canJoin = now.getTime() >= s.start.getTime() - JOIN_EARLY_MS && now < s.end
  return (
    <div className={`p-card p-next${compact ? ' compact' : ''}`}>
      <div className="p-next-head">
        <span className="p-label">{live ? <><span className="p-live-dot" /> در حال برگزاری</> : 'کلاس بعدی شما'}</span>
        <Chip tone={s.course.color === 'navy' ? 'navy' : 'lime'}>{s.course.lang} {s.course.level}</Chip>
      </div>
      <div className="p-next-body">
        <img src={s.course.img} alt="" width={s.course.imgW} height={s.course.imgH} loading="lazy" />
        <div>
          <h3>{s.course.title} <bdi>{s.course.level}</bdi></h3>
          <p className="p-muted">{s.course.teacher}</p>
          <p className="p-topic">موضوع جلسه: {s.topic}</p>
        </div>
      </div>
      <div className="p-next-meta">
        <span>{Icon.calendar(18)} {relativeDay(s.start, now)}، {WEEKDAYS[weekdayIndex(s.start)]}</span>
        <span>{Icon.clock(18)} {formatTime(s.start)} تا {formatTime(s.end)}</span>
      </div>
      <div className="p-next-foot">
        <span className="p-countdown" aria-live="polite">{live ? 'کلاس شروع شده است' : <>تا شروع: <b>{formatDuration(s.start.getTime() - now.getTime())}</b></>}</span>
        {canJoin
          ? <button type="button" className="btn btn-primary" onClick={() => setJoining(true)}>{Icon.live(20)} ورود به کلاس</button>
          : <button type="button" className="btn btn-ghost" disabled title="ورود به کلاس از ۱۵ دقیقه قبل از شروع فعال می‌شود">ورود از ۱۵ دقیقه قبل</button>}
      </div>
      <Modal open={joining} onClose={() => setJoining(false)} title="ورود به کلاس زنده">
        <p className="p-modal-text">در نسخهٔ نهایی، این دکمه شما را مستقیم به اتاق کلاس آنلاین می‌برد. این نسخه نمایشی است و هنوز به سامانهٔ کلاس آنلاین وصل نشده است.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => setJoining(false)}>متوجه شدم</button>
      </Modal>
    </div>
  )
}

export default function Dashboard() {
  const { session, demo, assignments, avgScore, db } = usePanel()
  const { stats, now } = demo
  const first = session.name.trim().split(/\s+/)[0]
  const pending = assignments.filter((a) => a.status === 'pending').sort((a, b) => a.due.getTime() - b.due.getTime())
  const upcoming = demo.upcoming.filter((s) => s.end > now).slice(0, 4)
  const max = Math.max(...demo.activity, 1)
  const total = demo.activity.reduce((a, b) => a + b, 0)
  const today = weekdayIndex(now)
  const progress = stats.sessionsDone / stats.sessionsTotal
  const pct = (v: number) => `${fa(Math.round(v * 100))}٪`

  return (
    <div className="p-page p-dash">
      <h2 className="p-greet">سلام {first}</h2>

      <div className="p-row p-row-lead">
        <NextClassCard s={demo.nextSession} />

        <section className="p-card">
          <header className="p-card-head"><h2>تکالیف پیش رو</h2><Link to="/panel/assignments">همهٔ تکالیف {Icon.chevronLeft(16)}</Link></header>
          {pending.length ? (
            <ul className="p-list">
              {pending.slice(0, 4).map((a) => {
                const rel = relativeDay(a.due, now)
                const soon = rel === 'امروز' || rel === 'فردا'
                return (
                  <li key={a.id}>
                    <span className={`p-dot c-${a.course.color}`} aria-hidden="true" />
                    <div><b>{a.title}</b><small>{a.kind} • {a.course.title} <bdi>{a.course.level}</bdi></small></div>
                    <span className={`p-due-at${soon ? ' soon' : ''}`}>{rel}<small>{formatTime(a.due)}</small></span>
                  </li>
                )
              })}
            </ul>
          ) : <p className="p-muted">تکلیف باز ندارید.</p>}
        </section>
      </div>

      <section className="p-card p-summary" aria-labelledby="sum-h">
        <h2 id="sum-h" className="sr">وضعیت یادگیری</h2>
        <dl>
          <div className="p-sum-main">
            <dt>پیشرفت کل دوره‌ها</dt>
            <dd><b>{pct(progress)}</b><Bar value={progress} label="پیشرفت کل دوره‌ها" /></dd>
          </div>
          <div><dt>جلسه‌های گذرانده</dt><dd><b>{fa(stats.sessionsDone)}</b> از {fa(stats.sessionsTotal)}</dd></div>
          <div><dt>یادگیری در این ماه</dt><dd><b>{fa(stats.hoursThisMonth)}</b> ساعت</dd></div>
          <div><dt>میانگین نمره</dt><dd><b>{avgScore == null ? '—' : faDec(avgScore)}</b> از ۲۰</dd></div>
          <div><dt>تمرین پیاپی</dt><dd><b>{fa(stats.streak)}</b> روز</dd></div>
        </dl>
      </section>

      <div className="p-row">
        <section className="p-card">
          <header className="p-card-head"><h2>دوره‌های من</h2><Link to="/panel/courses">جزئیات دوره‌ها {Icon.chevronLeft(16)}</Link></header>
          <ul className="p-progress-list">
            {COURSES.map((c) => (
              <li key={c.id}>
                <div className="p-progress-top">
                  <b>{c.title} <bdi>{c.level}</bdi></b>
                  <span className="p-num">{pct(c.done / c.sessions)}</span>
                </div>
                <Bar value={c.done / c.sessions} label={`پیشرفت ${c.title}`} />
                <small>{c.type === 'live' ? 'کلاس زنده' : 'دورهٔ آفلاین'} • {fa(c.done)} از {fa(c.sessions)} جلسه • {c.teacher}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-card p-card-fill">
          <header className="p-card-head"><h2>دقیقه‌های یادگیری این هفته</h2><span className="p-muted p-num">{formatDuration(total * 60000)}</span></header>
          <div className="p-activity" role="img" aria-label={`دقیقه‌های یادگیری این هفته: ${demo.activity.map((m, i) => `${WEEKDAYS[i]} ${fa(m)}`).join('، ')}`}>
            {demo.activity.map((m, i) => (
              <div key={i} className={i === today ? 'today' : i > today ? 'future' : ''}>
                <span className="p-activity-val">{i <= today ? fa(m) : ''}</span>
                <i style={{ height: `${Math.max(4, (m / max) * 100)}%` }} />
                <span className="p-activity-day">{WEEKDAYS_SHORT[i]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-row">
        <section className="p-card">
          <header className="p-card-head"><h2>کلاس‌های پیش رو</h2><Link to="/panel/schedule">برنامهٔ کامل {Icon.chevronLeft(16)}</Link></header>
          {upcoming.length ? (
            <ul className="p-list">
              {upcoming.map((s) => (
                <li key={s.start.toISOString() + s.course.id}>
                  <span className="p-day-badge"><b>{WEEKDAYS[weekdayIndex(s.start)]}</b><small>{formatDate(s.start, false)}</small></span>
                  <div><b>{s.course.title} <bdi>{s.course.level}</bdi></b><small>{s.topic}</small></div>
                  <span className="p-due-at">{formatTime(s.start)}<small>{relativeDay(s.start, now)}</small></span>
                </li>
              ))}
            </ul>
          ) : <p className="p-muted">کلاس زندهٔ دیگری در برنامه ندارید.</p>}
        </section>

        <section className="p-card">
          <header className="p-card-head"><h2>اطلاعیه‌ها</h2><Link to="/panel/messages">گروه‌های کلاس {Icon.chevronLeft(16)}</Link></header>
          <ul className="p-list">
            {[...db.announcements.filter((a) => db.rosters[a.courseId]?.includes(ME)).map((a) => ({ id: a.id, title: a.title, text: a.text, by: courseById(a.courseId).teacher, date: new Date(a.at) })),
              ...demo.notices.filter((n) => n.kind === 'news').map((n) => ({ ...n, by: 'آموزشگاه فرتاش' }))]
              .sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4).map((n) => (
              <li key={n.id}><div><b>{n.title}</b><small>{n.text}</small><small className="p-by">{n.by}</small></div><time className="p-muted p-time">{relativeDay(n.date, now)}</time></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
