import { Link } from 'react-router-dom'
import { fa } from '../../lib/fa'
import { formatTime, relativeDay, WEEKDAYS } from '../../lib/jalali'
import { COURSES } from '../data'
import { usePanel } from '../context'
import { ME, attendanceOf, groupOf } from '../../school/db'
import { useQueryState } from '../hooks'
import { Bar, Chip, Icon } from '../ui'

export default function Courses() {
  const { demo, db } = usePanel()
  const [filter, setFilter] = useQueryState('type', ['all', 'live', 'offline'] as const, 'all')
  const list = COURSES.filter((c) => filter === 'all' || c.type === filter)
  return (
    <div className="p-page">
      <div className="p-toolbar">
        <div className="p-tabs" role="group" aria-label="نوع دوره">
          {([['all', 'همه'], ['live', 'کلاس‌های زنده'], ['offline', 'دوره‌های آفلاین']] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <Link to="/teachers" className="btn btn-ghost btn-sm">{Icon.plus(18)} ثبت‌نام در دورهٔ جدید</Link>
      </div>

      <div className="p-course-grid">
        {list.map((c) => {
          const next = demo.upcoming.find((s) => s.course.id === c.id && s.end > demo.now)
          return (
            <article key={c.id} className="p-card p-course">
              <div className="p-course-img">
                <img src={c.img} alt="" width={c.imgW} height={c.imgH} loading="lazy" />
                <Chip tone={c.type === 'live' ? 'lime' : 'sky'}>{c.type === 'live' ? <>{Icon.live(14)} کلاس زنده</> : <>{Icon.video(14)} آفلاین</>}</Chip>
              </div>
              <div className="p-course-body">
                <h2>{c.title} <bdi>{c.level}</bdi></h2>
                <p className="p-muted">{c.teacher}</p>
                <div className="p-course-progress">
                  <span>{fa(c.done)} از {fa(c.sessions)} جلسه</span>
                  <b>{fa(Math.round((c.done / c.sessions) * 100))}٪</b>
                </div>
                <Bar value={c.done / c.sessions} label={`پیشرفت ${c.title}`} />
                {c.type === 'live' ? (
                  <>
                    <p className="p-course-line">{Icon.calendar(18)} {c.slots.map((s) => WEEKDAYS[s.weekday]).join('، ')} • ساعت {formatTime(new Date(2000, 0, 1, c.slots[0].start[0], c.slots[0].start[1]))}</p>
                    {next && <p className="p-course-line">{Icon.clock(18)} جلسهٔ بعد: {relativeDay(next.start, demo.now)} ساعت {formatTime(next.start)}</p>}
                    {(() => { const a = attendanceOf(db, c.id, ME); return a.total > 0 && (
                      <p className="p-course-line">{Icon.checklist(18)} حضور: {fa(a.present)} از {fa(a.total)} جلسهٔ ثبت‌شده{a.late > 0 && <> • {fa(a.late)} تأخیر</>}</p>) })()}
                  </>
                ) : (
                  <p className="p-course-line">{Icon.video(18)} {fa(c.sessions - c.done)} درس دیده‌نشده؛ هر زمان که خواستید ادامه دهید.</p>
                )}
                <div className="p-course-actions">
                  {c.type === 'live'
                    ? <Link to="/panel" className="btn btn-primary btn-sm">{Icon.live(18)} کلاس بعدی</Link>
                    : <Link to="/panel/recordings" className="btn btn-primary btn-sm">{Icon.play(18)} ادامهٔ یادگیری</Link>}
                  {groupOf(db, c.id) && <Link to={`/panel/messages?t=${groupOf(db, c.id)!.id}`} className="btn btn-ghost btn-sm">{Icon.chat(18)} گروه کلاس</Link>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
