import { Link, useSearchParams } from 'react-router-dom'
import { fa } from '../../lib/fa'
import { addDays, formatDate, formatTime, relativeDay, WEEKDAYS, weekdayIndex } from '../../lib/jalali'
import { COURSES, sessionsBetween, type Course } from '../../panel/data'
import { useQueryState } from '../../panel/hooks'
import { Bar, Chip, Icon } from '../../panel/ui'
import { attendanceOf, groupOf } from '../../school/db'
import { useReceptionPanel } from '../context'
import { CreateGroup, JoinClass, StateChip } from '../parts'

const TYPES = [['all', 'همه'], ['live', 'کلاس‌های زنده'], ['offline', 'دوره‌های آفلاین']] as const

export default function Classes() {
  const { now } = useReceptionPanel()
  const [params] = useSearchParams()
  const [type, setType] = useQueryState('type', TYPES.map(([k]) => k), 'all')
  const open = COURSES.find((c) => c.id === params.get('id'))
  if (open) return <ClassDetail c={open} />
  const list = COURSES.filter((c) => type === 'all' || c.type === type)
  return (
    <div className="p-page">
      <div className="p-toolbar">
        <div className="p-tabs" role="group" aria-label="نوع کلاس">
          {TYPES.map(([k, l]) => <button key={k} type="button" aria-pressed={type === k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>{l}</button>)}
        </div>
      </div>
      <div className="p-course-grid">{list.map((c) => <ClassCard key={c.id} c={c} now={now} />)}</div>
    </div>
  )
}

function rate(db: ReturnType<typeof useReceptionPanel>['db'], c: Course) {
  const marks = Object.entries(db.attendance).filter(([k]) => k.startsWith(c.id + '|')).flatMap(([, v]) => Object.values(v))
  return marks.length ? marks.filter((m) => m !== 'absent').length / marks.length : null
}

function ClassCard({ c, now }: { c: Course; now: Date }) {
  const { db } = useReceptionPanel()
  const g = groupOf(db, c.id)
  const att = rate(db, c)
  return (
    <article className="p-card p-course">
      <div className="p-course-img">
        <img src={c.img} alt="" width={c.imgW} height={c.imgH} loading="lazy" />
        <StateChip c={c} now={now} />
      </div>
      <div className="p-course-body">
        <h2>{c.title} <bdi>{c.level}</bdi></h2>
        <p className="p-muted">{c.teacher}</p>
        <div className="p-course-progress"><span>{fa(c.done)} از {fa(c.sessions)} جلسه</span><b>{fa(Math.round((c.done / c.sessions) * 100))}٪</b></div>
        <Bar value={c.done / c.sessions} label={`پیشرفت ${c.title}`} />
        <p className="p-course-line">{Icon.users(18)} {fa(db.rosters[c.id]?.length ?? 0)} زبان‌آموز{att != null && <> • حضور {fa(Math.round(att * 100))}٪</>}</p>
        {c.type === 'live' && <p className="p-course-line">{Icon.calendar(18)} {c.slots.map((s) => WEEKDAYS[s.weekday]).join('، ')} • ساعت {formatTime(new Date(2000, 0, 1, c.slots[0].start[0], c.slots[0].start[1]))}</p>}
        <p className="p-course-line">{Icon.chat(18)} {g ? (g.locked ? 'گروه بسته است' : 'گروه فعال است') : 'گروه ساخته نشده'}</p>
        <div className="p-course-actions">
          <JoinClass c={c} now={now} />
          <Link to={`/reception/classes?id=${c.id}`} className="btn btn-ghost btn-sm">جزئیات کلاس</Link>
          {g ? <Link to={`/reception/groups?t=${g.id}`} className="btn btn-ghost btn-sm">{Icon.chat(18)} گروه</Link> : <CreateGroup c={c} />}
        </div>
      </div>
    </article>
  )
}

function ClassDetail({ c }: { c: Course }) {
  const { db, now, name } = useReceptionPanel()
  const roster = db.rosters[c.id] ?? []
  const g = groupOf(db, c.id)
  const att = rate(db, c)
  const upcoming = c.type === 'live' ? sessionsBetween(now, addDays(now, 15), [c]).filter((s) => s.end > now).slice(0, 5) : []
  return (
    <div className="p-page">
      <Link to="/reception/classes" className="p-back">{Icon.chevronRight(18)} همهٔ کلاس‌ها</Link>
      <header className="p-detail-head p-detail-row">
        <div>
          <h2>{c.title} <bdi>{c.level}</bdi></h2>
          <p className="p-muted">{c.teacher} • {fa(roster.length)} زبان‌آموز • {c.type === 'live' ? 'کلاس زنده' : 'دورهٔ آفلاین'}{att != null && <> • حضور {fa(Math.round(att * 100))}٪</>}</p>
        </div>
        <div className="p-btn-row">
          <JoinClass c={c} now={now} />
          {g ? <Link to={`/reception/groups?t=${g.id}`} className="btn btn-ghost btn-sm">{Icon.chat(18)} گروه کلاس</Link> : <CreateGroup c={c} />}
        </div>
      </header>

      <div className="p-row">
        <section className="p-card">
          <h2 className="p-section-title">زبان‌آموزان</h2>
          <div className="p-table-wrap">
            <table className="p-table">
              <caption className="sr">زبان‌آموزان {c.title}</caption>
              <thead><tr><th scope="col">نام</th><th scope="col">حضور</th><th scope="col">وضعیت</th></tr></thead>
              <tbody>
                {roster.map((id) => {
                  const a = attendanceOf(db, c.id, id)
                  const r = a.total ? a.present / a.total : null
                  return (
                    <tr key={id}>
                      <td className="p-td-title">{name(id)}</td>
                      <td data-label="حضور">{a.total ? <>{fa(a.present)} از {fa(a.total)}{a.late > 0 && <span className="p-muted"> ({fa(a.late)} تأخیر)</span>}</> : '—'}</td>
                      <td className="p-td-status">{r == null ? <Chip tone="muted">بدون جلسه</Chip> : r >= 0.85 ? <Chip tone="ok">منظم</Chip> : <Chip tone="warn">غیبت زیاد</Chip>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="p-card">
          <h2 className="p-section-title">جلسه‌های پیش رو</h2>
          {upcoming.length ? (
            <ul className="p-list">
              {upcoming.map((s) => (
                <li key={s.start.toISOString()}>
                  <span className="p-day-badge"><b>{WEEKDAYS[weekdayIndex(s.start)]}</b><small>{formatDate(s.start, false)}</small></span>
                  <div><b>{s.topic}</b><small>{formatTime(s.start)} تا {formatTime(s.end)}</small></div>
                  <span className="p-due-at">{relativeDay(s.start, now)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="p-muted">{c.type === 'live' ? 'جلسه‌ای در دو هفتهٔ آینده نیست.' : 'دورهٔ آفلاین جلسهٔ زنده ندارد.'}</p>}
        </section>
      </div>
    </div>
  )
}
