import { Link } from 'react-router-dom'
import { fa } from '../../lib/fa'
import { addDays, formatTime, startOfDay, WEEKDAYS, weekdayIndex } from '../../lib/jalali'
import { COURSES, courseById, sessionsBetween } from '../../panel/data'
import { Chip, Icon } from '../../panel/ui'
import { DESK, authorName, reader, sameDayIso, unreadIn } from '../../school/db'
import { useReceptionPanel } from '../context'
import { CreateGroup, JoinClass } from '../parts'

export default function Home() {
  const { session, db, now, name } = useReceptionPanel()
  const me = reader('reception', DESK)
  const today = sessionsBetween(startOfDay(now), addDays(startOfDay(now), 1), COURSES.filter((c) => c.type === 'live'))
  const live = today.filter((s) => now >= s.start && now < s.end)
  // no class today: show what comes next instead of an empty card
  const list = today.length ? today : sessionsBetween(now, addDays(now, 8), COURSES.filter((c) => c.type === 'live')).slice(0, 4)
  const missing = COURSES.filter((c) => !db.groups.some((g) => g.courseId === c.id))
  const unread = db.groups.flatMap((g) => unreadIn(db, g.id, me)).sort((a, b) => b.at.localeCompare(a.at))
  const todayMsgs = db.messages.filter((m) => !m.deleted && sameDayIso(m.at, now)).length
  const first = session.name.trim().split(/\s+/)[0]
  const who = (m: (typeof unread)[number]) => (m.role === 'student' ? name(m.authorId) : authorName(db, m))

  return (
    <div className="p-page p-dash">
      <h2 className="p-greet">سلام {first}</h2>

      <div className="p-row p-row-lead">
        <section className="p-card">
          <header className="p-card-head"><h2>{today.length ? 'کلاس‌های امروز' : 'کلاس‌های پیش رو'}</h2><Link to="/reception/classes">همهٔ کلاس‌ها {Icon.chevronLeft(16)}</Link></header>
          {list.length ? (
            <ul className="p-list p-sessions">
              {list.map((s) => {
                const running = now >= s.start && now < s.end
                return (
                  <li key={s.course.id + s.start.toISOString()}>
                    <span className="p-day-badge"><b>{today.length ? formatTime(s.start) : WEEKDAYS[weekdayIndex(s.start)]}</b><small>{today.length ? `تا ${formatTime(s.end)}` : formatTime(s.start)}</small></span>
                    <div><b>{s.course.title} <bdi>{s.course.level}</bdi></b><small>{s.course.teacher} • {fa(db.rosters[s.course.id]?.length ?? 0)} زبان‌آموز</small></div>
                    {running ? <Chip tone="warn"><span className="p-live-dot" /> در حال برگزاری</Chip> : s.end < now ? <Chip tone="muted">تمام شد</Chip> : null}
                    <JoinClass c={s.course} now={now} />
                  </li>
                )
              })}
            </ul>
          ) : <p className="p-muted">کلاس زنده‌ای در برنامه نیست.</p>}
        </section>

        <section className="p-card">
          <header className="p-card-head"><h2>کلاس‌های بدون گروه</h2><Link to="/reception/groups">گروه‌ها {Icon.chevronLeft(16)}</Link></header>
          {missing.length ? (
            <ul className="p-list">
              {missing.map((c) => (
                <li key={c.id}>
                  <span className={`p-dot c-${c.color}`} aria-hidden="true" />
                  <div><b>{c.title} <bdi>{c.level}</bdi></b><small>{c.teacher} • {fa(db.rosters[c.id]?.length ?? 0)} زبان‌آموز</small></div>
                  <CreateGroup c={c} />
                </li>
              ))}
            </ul>
          ) : <p className="p-muted">همهٔ کلاس‌ها گروه گفت‌وگو دارند.</p>}
        </section>
      </div>

      <section className="p-card p-summary" aria-labelledby="r-sum-h">
        <h2 id="r-sum-h" className="sr">خلاصهٔ آموزشگاه</h2>
        <dl>
          <div className="p-sum-main"><dt>کلاس‌های امروز</dt><dd><span><b>{fa(today.length)}</b> جلسه</span><small className="p-sum-sub">{live.length ? `${fa(live.length)} کلاس همین حالا در حال برگزاری است` : 'هیچ کلاسی همین حالا در حال برگزاری نیست'}</small></dd></div>
          <div><dt>همهٔ کلاس‌ها</dt><dd><b>{fa(COURSES.length)}</b> کلاس</dd></div>
          <div><dt>گروه‌های فعال</dt><dd><b>{fa(db.groups.filter((g) => !g.locked).length)}</b> از {fa(COURSES.length)}</dd></div>
          <div><dt>پیام‌های امروز</dt><dd><b>{fa(todayMsgs)}</b> پیام</dd></div>
          <div><dt>خوانده‌نشده</dt><dd><b>{fa(unread.length)}</b> پیام</dd></div>
        </dl>
      </section>

      <section className="p-card">
        <header className="p-card-head"><h2>پیام‌های تازهٔ گروه‌ها</h2><Link to="/reception/groups">بررسی گروه‌ها {Icon.chevronLeft(16)}</Link></header>
        {unread.length ? (
          <ul className="p-list">
            {unread.slice(0, 6).map((m) => {
              const c = courseById(db.groups.find((g) => g.id === m.groupId)!.courseId)
              return (
                <li key={m.id}>
                  <div><b>{who(m)} <span className="p-muted p-in">در {c.title} <bdi>{c.level}</bdi></span></b><small className="p-clamp">{m.text}</small></div>
                  <Link className="btn btn-ghost btn-sm" to={`/reception/groups?t=${m.groupId}`} aria-label={`بررسی گروه ${c.title}`}>بررسی</Link>
                </li>
              )
            })}
          </ul>
        ) : <p className="p-muted">پیام تازه‌ای در گروه‌ها نیست.</p>}
      </section>
    </div>
  )
}
