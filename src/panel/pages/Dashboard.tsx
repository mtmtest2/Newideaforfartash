import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fa } from '../../lib/fa'
import { addDays, formatDuration, formatTime, relativeDay, WEEKDAYS, WEEKDAYS_SHORT, weekdayIndex } from '../../lib/jalali'
import { COURSES, type Session } from '../data'
import { usePanel } from '../context'
import { JOIN_EARLY_MS, useNow } from '../hooks'
import { Bar, Chip, Icon, Modal, Ring } from '../ui'

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
  const { session, demo, assignments } = usePanel()
  const { stats, now } = demo
  const first = session.name.trim().split(/\s+/)[0]
  const pending = assignments.filter((a) => a.status === 'pending').sort((a, b) => a.due.getTime() - b.due.getTime())
  const week = demo.upcoming.filter((s) => s.end > now && s.start < addDays(demo.weekStart, 7))
  const max = Math.max(...demo.activity, 1)
  const total = demo.activity.reduce((a, b) => a + b, 0)
  const today = weekdayIndex(now)

  return (
    <div className="p-page p-dash">
      <section className="p-hello">
        <div>
          <h2>سلام {first}، خوش آمدید 👋</h2>
          <p>{fa(stats.streak)} روز پشت سر هم تمرین کرده‌اید؛ همین‌طور ادامه بدهید.</p>
          <div className="p-hello-pills">
            <span>{Icon.fire(18)} {fa(stats.streak)} روز پیاپی</span>
            <span>{Icon.tasks(18)} {fa(pending.length)} تکلیف در انتظار</span>
          </div>
        </div>
        <Ring value={stats.sessionsDone / stats.sessionsTotal} size={104} stroke={10} label={<>{fa(Math.round((stats.sessionsDone / stats.sessionsTotal) * 100))}٪<small>کل پیشرفت</small></>} />
      </section>

      <section className="p-stats" aria-label="خلاصهٔ وضعیت">
        <div className="p-card p-stat"><span className="p-stat-ico">{Icon.courses()}</span><b>{fa(stats.activeCourses)}</b><small>دورهٔ فعال</small></div>
        <div className="p-card p-stat"><span className="p-stat-ico">{Icon.check()}</span><b>{fa(stats.sessionsDone)}<i> از {fa(stats.sessionsTotal)}</i></b><small>جلسهٔ گذرانده</small></div>
        <div className="p-card p-stat"><span className="p-stat-ico">{Icon.clock()}</span><b>{fa(stats.hoursThisMonth)}</b><small>ساعت یادگیری این ماه</small></div>
        <div className="p-card p-stat"><span className="p-stat-ico">{Icon.chart()}</span><b>{fa(stats.avgScore.toFixed(1).replace(/\.0$/, '')).replace('.', '٫')}<i> از ۲۰</i></b><small>میانگین نمره</small></div>
      </section>

      <div className="p-grid">
        <div className="p-col">
          <NextClassCard s={demo.nextSession} />

          <section className="p-card">
            <header className="p-card-head"><h2>پیشرفت دوره‌ها</h2><Link to="/panel/courses">همهٔ دوره‌ها {Icon.chevronLeft(16)}</Link></header>
            <ul className="p-progress-list">
              {COURSES.map((c) => (
                <li key={c.id}>
                  <Ring value={c.done / c.sessions} size={54} stroke={6} />
                  <div>
                    <b>{c.title} <bdi>{c.level}</bdi></b>
                    <small>{c.type === 'live' ? 'کلاس زنده' : 'دورهٔ آفلاین'} • {fa(c.done)} از {fa(c.sessions)} جلسه</small>
                    <Bar value={c.done / c.sessions} label={`پیشرفت ${c.title}`} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-card">
            <header className="p-card-head"><h2>فعالیت این هفته</h2><span className="p-muted">{formatDuration(total * 60000)}</span></header>
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

        <div className="p-col">
          <section className="p-card">
            <header className="p-card-head"><h2>تکالیف پیش رو</h2><Link to="/panel/assignments">همه {Icon.chevronLeft(16)}</Link></header>
            <ul className="p-list">
              {pending.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <span className={`p-dot c-${a.course.color}`} aria-hidden="true" />
                  <div><b>{a.title}</b><small>{a.kind} • {a.course.title} <bdi>{a.course.level}</bdi></small></div>
                  <Chip tone={relativeDay(a.due, now) === 'فردا' || relativeDay(a.due, now) === 'امروز' ? 'warn' : 'muted'}>مهلت: {relativeDay(a.due, now)}</Chip>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-card">
            <header className="p-card-head"><h2>کلاس‌های این هفته</h2><Link to="/panel/schedule">برنامهٔ کامل {Icon.chevronLeft(16)}</Link></header>
            {week.length ? (
              <ul className="p-list">
                {week.slice(0, 4).map((s) => (
                  <li key={s.start.toISOString() + s.course.id}>
                    <span className="p-day-badge"><b>{WEEKDAYS[weekdayIndex(s.start)]}</b><small>{formatTime(s.start)}</small></span>
                    <div><b>{s.course.title} <bdi>{s.course.level}</bdi></b><small>{s.topic}</small></div>
                  </li>
                ))}
              </ul>
            ) : <p className="p-muted">کلاس دیگری تا پایان این هفته ندارید.</p>}
          </section>

          <section className="p-card">
            <header className="p-card-head"><h2>اطلاعیه‌ها</h2></header>
            <ul className="p-list">
              {demo.notices.filter((n) => n.kind === 'news' || n.kind === 'payment').map((n) => (
                <li key={n.id}><span className="p-dot c-sky" aria-hidden="true" /><div><b>{n.title}</b><small>{n.text}</small></div></li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
