import { useState } from 'react'
import { fa } from '../../lib/fa'
import { addDays, formatDate, formatTime, jDate, MONTHS, sameDay, WEEKDAYS } from '../../lib/jalali'
import { sessionsBetween } from '../data'
import { usePanel } from '../context'
import { Icon } from '../ui'

const HOURS = [8, 10, 12, 14, 16, 18, 20]

export default function Schedule() {
  const { demo } = usePanel()
  const [offset, setOffset] = useState(0)
  const start = addDays(demo.weekStart, offset * 7)
  const end = addDays(start, 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const sessions = sessionsBetween(start, end)
  const a = jDate(start), b = jDate(addDays(end, -1))
  const range = a.m === b.m ? `${fa(a.d)} تا ${fa(b.d)} ${MONTHS[a.m - 1]} ${fa(a.y)}` : `${formatDate(start, false)} تا ${formatDate(addDays(end, -1))}`
  const fromH = 8, toH = 22
  const pos = (d: Date) => ((d.getHours() + d.getMinutes() / 60 - fromH) / (toH - fromH)) * 100

  return (
    <div className="p-page">
      <div className="p-toolbar">
        <div className="p-week-nav">
          <button type="button" className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="هفتهٔ قبل">{Icon.chevronRight(20)}</button>
          <b aria-live="polite">{range}</b>
          <button type="button" className="icon-btn" onClick={() => setOffset((o) => o + 1)} aria-label="هفتهٔ بعد">{Icon.chevronLeft(20)}</button>
        </div>
        {offset !== 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOffset(0)}>این هفته</button>}
        <p className="p-muted p-tz">ساعت‌ها به وقت تهران</p>
      </div>

      {/* desktop: week grid */}
      <div className="p-card p-week" aria-label={`برنامهٔ کلاس‌های هفتهٔ ${range}`} role="region">
        <div className="p-week-hours" aria-hidden="true">
          {HOURS.map((h) => <span key={h} style={{ top: `${((h - fromH) / (toH - fromH)) * 100}%` }}>{fa(`${h}:۰۰`)}</span>)}
        </div>
        {days.map((d, i) => (
          <div key={i} className={`p-week-day${sameDay(d, demo.now) ? ' today' : ''}${i === 6 ? ' off' : ''}`}>
            <div className="p-week-head"><b>{WEEKDAYS[i]}</b><small>{fa(jDate(d).d)}</small></div>
            <div className="p-week-col">
              {HOURS.map((h) => <i key={h} className="p-week-line" style={{ top: `${((h - fromH) / (toH - fromH)) * 100}%` }} />)}
              {sameDay(d, demo.now) && <i className="p-now" style={{ top: `${pos(demo.now)}%` }} aria-hidden="true" />}
              {sessions.filter((s) => sameDay(s.start, d)).map((s) => (
                <div key={s.course.id} className={`p-event c-${s.course.color}${s.end < demo.now ? ' past' : ''}`} style={{ top: `${pos(s.start)}%`, height: `${pos(s.end) - pos(s.start)}%` }}>
                  <b>{s.course.title} <bdi>{s.course.level}</bdi></b>
                  <small>{formatTime(s.start)} تا {formatTime(s.end)}</small>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* phones: agenda list */}
      <ol className="p-agenda">
        {days.map((d, i) => {
          const ss = sessions.filter((s) => sameDay(s.start, d))
          return (
            <li key={i} className={sameDay(d, demo.now) ? 'today' : ''}>
              <span className="p-agenda-day"><b>{WEEKDAYS[i]}</b><small>{formatDate(d, false)}</small></span>
              <div>
                {ss.length ? ss.map((s) => (
                  <div key={s.course.id} className={`p-agenda-item c-${s.course.color}${s.end < demo.now ? ' past' : ''}`}>
                    <b>{s.course.title} <bdi>{s.course.level}</bdi></b>
                    <small>{formatTime(s.start)} تا {formatTime(s.end)} • {s.topic}</small>
                  </div>
                )) : <small className="p-muted">{i === 6 ? 'تعطیل' : 'کلاسی ندارید'}</small>}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
