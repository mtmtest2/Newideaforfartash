import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fa } from '../../lib/fa'
import { addDays, formatDate, formatDuration, formatTime, relativeDay, startOfWeek, WEEKDAYS, weekdayIndex } from '../../lib/jalali'
import { courseById, sessionsBetween, type Session } from '../../panel/data'
import { JOIN_EARLY_MS, useNow } from '../../panel/hooks'
import { Bar, Chip, Icon, initials, Modal } from '../../panel/ui'
import { authorName, reader, sessionKey, unreadIn } from '../../school/db'
import { useTeacherPanel } from '../context'

export default function Home() {
  const { session, courses, db, now, name, teacher } = useTeacherPanel()
  const ids = courses.map((c) => c.id)
  const live = courses.filter((c) => c.type === 'live')
  const upcoming = sessionsBetween(new Date(now.getTime() - 90 * 60000), addDays(now, 14), live).filter((s) => s.end > now)
  const weekStart = startOfWeek(now)
  const thisWeek = sessionsBetween(weekStart, addDays(weekStart, 7), live)
  const tasks = db.tasks.filter((t) => ids.includes(t.courseId))
  const toGrade = db.submissions.filter((s) => s.score == null && tasks.some((t) => t.id === s.taskId)).sort((a, b) => a.at.localeCompare(b.at))
  const students = new Set(ids.flatMap((id) => db.rosters[id] ?? []))
  const marks = Object.entries(db.attendance).filter(([k]) => ids.includes(k.split('|')[0])).flatMap(([, v]) => Object.values(v))
  const attendance = marks.length ? marks.filter((m) => m !== 'absent').length / marks.length : null
  const unread = db.groups.filter((g) => ids.includes(g.courseId)).flatMap((g) => unreadIn(db, g.id, reader('teacher', teacher.id))).sort((a, b) => a.at.localeCompare(b.at))
  const lastName = session.name.trim().split(/\s+/).slice(-1)[0]

  return (
    <div className="p-page p-dash">
      <h2 className="p-greet">سلام استاد {lastName}</h2>

      <div className="p-row p-row-lead">
        {upcoming[0] ? <NextTeaching s={upcoming[0]} roster={(db.rosters[upcoming[0].course.id] ?? []).map(name)} /> :
          <section className="p-card"><h2 className="p-section-title">کلاس بعدی</h2><p className="p-muted">در دو هفتهٔ آینده کلاس زنده‌ای ندارید.</p></section>}

        <section className="p-card">
          <header className="p-card-head"><h2>در انتظار نمره</h2><Link to="/teacher/assignments">همهٔ تکالیف {Icon.chevronLeft(16)}</Link></header>
          {toGrade.length ? (
            <ul className="p-list">
              {toGrade.slice(0, 4).map((s) => {
                const t = tasks.find((x) => x.id === s.taskId)!
                return (
                  <li key={s.id}>
                    <span className={`p-dot c-${courseById(t.courseId).color}`} aria-hidden="true" />
                    <div><b>{name(s.studentId)}</b><small>{t.title}</small></div>
                    <Link className="btn btn-ghost btn-sm" to={`/teacher/assignments?task=${t.id}&sub=${s.id}`} aria-label={`نمره‌دهی به پاسخ ${name(s.studentId)}`}>نمره‌دهی</Link>
                  </li>
                )
              })}
            </ul>
          ) : <p className="p-muted">همهٔ پاسخ‌ها نمره گرفته‌اند.</p>}
          {toGrade.length > 4 && <p className="p-more">و {fa(toGrade.length - 4)} پاسخ دیگر</p>}
        </section>
      </div>

      <section className="p-card p-summary" aria-labelledby="t-sum-h">
        <h2 id="t-sum-h" className="sr">خلاصهٔ کلاس‌ها</h2>
        <dl>
          <div className="p-sum-main">
            <dt>میانگین حضور در سه هفتهٔ اخیر</dt>
            <dd><b>{attendance == null ? '—' : `${fa(Math.round(attendance * 100))}٪`}</b>{attendance != null && <Bar value={attendance} label="میانگین حضور" />}</dd>
          </div>
          <div><dt>زبان‌آموزان</dt><dd><b>{fa(students.size)}</b> نفر</dd></div>
          <div><dt>کلاس‌های این هفته</dt><dd><b>{fa(thisWeek.length)}</b> جلسه</dd></div>
          <div><dt>در انتظار نمره</dt><dd><b>{fa(toGrade.length)}</b> پاسخ</dd></div>
          <div><dt>پیام خوانده‌نشده</dt><dd><b>{fa(unread.length)}</b> پیام</dd></div>
        </dl>
      </section>

      <div className="p-row">
        <section className="p-card">
          <header className="p-card-head"><h2>پیام‌های تازهٔ گروه‌ها</h2><Link to="/teacher/messages">گروه‌های کلاس {Icon.chevronLeft(16)}</Link></header>
          {unread.length ? (
            <ul className="p-list">
              {unread.slice(-4).reverse().map((m) => {
                const c = courseById(db.groups.find((g) => g.id === m.groupId)!.courseId)
                const who = m.role === 'student' ? name(m.authorId) : authorName(db, m)
                return (
                  <li key={m.id}>
                    <div><b>{who} <span className="p-muted p-in">در {c.title} <bdi>{c.level}</bdi></span></b><small className="p-clamp">{m.text}</small></div>
                    <Link className="btn btn-ghost btn-sm" to={`/teacher/messages?t=${m.groupId}`} aria-label={`باز کردن گروه ${c.title}`}>پاسخ</Link>
                  </li>
                )
              })}
            </ul>
          ) : <p className="p-muted">پیام خوانده‌نشده‌ای ندارید.</p>}
        </section>

        <section className="p-card">
          <header className="p-card-head"><h2>کلاس‌های پیش رو</h2><Link to="/teacher/schedule">برنامهٔ کامل {Icon.chevronLeft(16)}</Link></header>
          <ul className="p-list">
            {upcoming.slice(0, 4).map((s) => (
              <li key={sessionKey(s.course.id, s.start)}>
                <span className="p-day-badge"><b>{WEEKDAYS[weekdayIndex(s.start)]}</b><small>{formatDate(s.start, false)}</small></span>
                <div><b>{s.course.title} <bdi>{s.course.level}</bdi></b><small>{s.topic}</small></div>
                <span className="p-due-at">{formatTime(s.start)}<small>{relativeDay(s.start, now)}</small></span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function NextTeaching({ s, roster }: { s: Session; roster: string[] }) {
  const now = useNow()
  const [starting, setStarting] = useState(false)
  const live = now >= s.start && now < s.end
  const canStart = now.getTime() >= s.start.getTime() - JOIN_EARLY_MS && now < s.end
  return (
    <div className="p-card p-next">
      <div className="p-next-head">
        <span className="p-label">{live ? <><span className="p-live-dot" /> در حال برگزاری</> : 'کلاس بعدی'}</span>
        <Chip tone={s.course.color === 'navy' ? 'navy' : 'lime'}>{s.course.lang} {s.course.level}</Chip>
      </div>
      <div>
        <h3 className="p-next-title">{s.course.title} <bdi>{s.course.level}</bdi></h3>
        <p className="p-topic">موضوع جلسه: {s.topic}</p>
      </div>
      <div className="p-roster">
        <span className="p-roster-faces" aria-hidden="true">{roster.slice(0, 5).map((n) => <span key={n} className="p-avatar p-avatar-sm">{initials(n)}</span>)}</span>
        <span>{roster.slice(0, 2).join('، ')}{roster.length > 2 && ` و ${fa(roster.length - 2)} نفر دیگر`}</span>
      </div>
      <div className="p-next-meta">
        <span>{Icon.calendar(18)} {relativeDay(s.start, now)}، {WEEKDAYS[weekdayIndex(s.start)]}</span>
        <span>{Icon.clock(18)} {formatTime(s.start)} تا {formatTime(s.end)}</span>
      </div>
      <div className="p-next-foot">
        <span className="p-countdown" aria-live="polite">{live ? 'کلاس شروع شده است' : <>تا شروع: <b>{formatDuration(s.start.getTime() - now.getTime())}</b></>}</span>
        <div className="p-btn-row">
          <Link className="btn btn-ghost btn-sm" to={`/teacher/attendance?s=${encodeURIComponent(sessionKey(s.course.id, s.start))}`}>{Icon.checklist(18)} حضور و غیاب</Link>
          {canStart
            ? <button type="button" className="btn btn-primary btn-sm" onClick={() => setStarting(true)}>{Icon.live(18)} شروع کلاس</button>
            : <button type="button" className="btn btn-ghost btn-sm" disabled title="شروع کلاس از ۱۵ دقیقه قبل فعال می‌شود">شروع از ۱۵ دقیقه قبل</button>}
        </div>
      </div>
      <Modal open={starting} onClose={() => setStarting(false)} title="شروع کلاس زنده">
        <p className="p-modal-text">در نسخهٔ نهایی، این دکمه اتاق کلاس آنلاین را باز می‌کند و به زبان‌آموزان پیامک می‌فرستد. این نسخه نمایشی است و هنوز به سامانهٔ کلاس آنلاین وصل نشده است.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => setStarting(false)}>متوجه شدم</button>
      </Modal>
    </div>
  )
}
