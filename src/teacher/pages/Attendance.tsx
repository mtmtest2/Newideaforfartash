import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fa } from '../../lib/fa'
import { addDays, formatDate, formatTime, relativeDay, startOfDay, WEEKDAYS, weekdayIndex } from '../../lib/jalali'
import { sessionsBetween } from '../../panel/data'
import { Chip, Empty, Icon } from '../../panel/ui'
import { saveAttendance, sessionKey, type Mark } from '../../school/db'
import { useTeacherPanel } from '../context'

const MARKS: [Mark, string][] = [['present', 'حاضر'], ['late', 'تأخیر'], ['absent', 'غایب']]

export default function Attendance() {
  const { db, courses, now, name } = useTeacherPanel()
  const [params, setParams] = useSearchParams()
  // sessions of the last three weeks up to the end of today, newest first
  const sessions = sessionsBetween(addDays(now, -21), addDays(startOfDay(now), 1), courses.filter((c) => c.type === 'live')).reverse()
  const started = sessions.filter((s) => s.start.getTime() - 15 * 60000 <= now.getTime())
  const current = sessions.find((s) => sessionKey(s.course.id, s.start) === params.get('s')) ?? started[0] ?? sessions[0]
  const key = current ? sessionKey(current.course.id, current.start) : ''
  const saved = db.attendance[key]
  const roster = current ? db.rosters[current.course.id] ?? [] : []
  const [draft, setDraft] = useState<{ key: string; marks: Record<string, Mark> } | null>(null)
  const marks = draft?.key === key ? draft.marks : saved ?? Object.fromEntries(roster.map((id) => [id, 'present' as Mark]))
  const dirty = draft?.key === key
  const [done, setDone] = useState(false)

  if (!current) return <div className="p-page"><Empty icon={Icon.checklist(40)} title="جلسه‌ای نیست" text="در سه هفتهٔ اخیر کلاس زنده‌ای نداشته‌اید." /></div>

  const set = (id: string, m: Mark) => { setDone(false); setDraft({ key, marks: { ...marks, [id]: m } }) }
  const save = () => { saveAttendance(key, marks); setDraft(null); setDone(true) }
  const count = (m: Mark) => roster.filter((id) => marks[id] === m).length
  const future = current.start.getTime() - 15 * 60000 > now.getTime()

  return (
    <div className="p-page">
      <div className="p-toolbar">
        <label className="p-field p-session-pick"><span>جلسه</span>
          <select value={key} onChange={(e) => { setDone(false); setParams({ s: e.target.value }, { replace: true }) }}>
            {sessions.map((s) => {
              const k = sessionKey(s.course.id, s.start)
              return <option key={k} value={k}>{s.course.title} {s.course.level} — {WEEKDAYS[weekdayIndex(s.start)]} {formatDate(s.start, false)}، {formatTime(s.start)}{db.attendance[k] ? ' ✓' : ''}</option>
            })}
          </select>
        </label>
      </div>

      <section className="p-card">
        <header className="p-card-head p-att-head">
          <div>
            <h2>{current.course.title} <bdi>{current.course.level}</bdi></h2>
            <p className="p-muted">{relativeDay(current.start, now)} • {current.topic}</p>
          </div>
          {saved && !dirty ? <Chip tone="ok">{Icon.check(14)} ثبت شده</Chip> : <Chip tone="warn">ثبت نشده</Chip>}
        </header>
        {future && <p className="p-form-note p-muted">این جلسه هنوز شروع نشده؛ حضور و غیاب را از ۱۵ دقیقه پیش از شروع ثبت کنید.</p>}

        <ul className="p-att">
          {roster.map((id) => (
            <li key={id}>
              <b id={`att-${id}`}>{name(id)}</b>
              <div className="p-seg" role="radiogroup" aria-labelledby={`att-${id}`}>
                {MARKS.map(([m, label]) => (
                  <label key={m} className={`p-seg-opt k-${m}`}>
                    <input type="radio" name={`att-${id}`} value={m} checked={marks[id] === m} onChange={() => set(id, m)} disabled={future} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <footer className="p-att-foot">
          <p className="p-muted" aria-live="polite">{fa(count('present'))} حاضر • {fa(count('late'))} تأخیر • {fa(count('absent'))} غایب</p>
          {done && <p className="ok" role="status">حضور و غیاب ثبت شد و در پنل زبان‌آموزان دیده می‌شود.</p>}
          <button type="button" className="btn btn-primary" onClick={save} disabled={future || (!!saved && !dirty)}>{saved ? 'ذخیرهٔ تغییرات' : 'ثبت حضور و غیاب'}</button>
        </footer>
      </section>
    </div>
  )
}
