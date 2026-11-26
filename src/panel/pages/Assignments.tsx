import { useState, type FormEvent } from 'react'
import { fa } from '../../lib/fa'
import { formatDate, formatTime, relativeDay } from '../../lib/jalali'
import type { Assignment } from '../data'
import { usePanel } from '../context'
import { fieldError, useQueryState } from '../hooks'
import { Chip, Empty, Icon, Modal } from '../ui'

const TABS = [['all', 'همه'], ['pending', 'در انتظار'], ['submitted', 'ارسال‌شده'], ['graded', 'نمره‌گرفته']] as const

export default function Assignments() {
  const { demo, assignments, submitAssignment } = usePanel()
  const [tab, setTab] = useQueryState('status', TABS.map(([k]) => k), 'all')
  const [active, setActive] = useState<Assignment | null>(null)
  const [view, setView] = useState<Assignment | null>(null)
  const [err, setErr] = useState('')
  const list = assignments.filter((a) => tab === 'all' || a.status === tab).sort((a, b) =>
    a.status === 'pending' && b.status !== 'pending' ? -1 : b.status === 'pending' && a.status !== 'pending' ? 1 : a.status === 'pending' ? a.due.getTime() - b.due.getTime() : b.due.getTime() - a.due.getTime())
  const count = (k: string) => assignments.filter((a) => k === 'all' || a.status === k).length

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const file = f.get('file') as File | null
    if (!String(f.get('answer') || '').trim() && !(file && file.size)) { setErr('پاسخ را بنویسید یا فایل آن را پیوست کنید.'); return fieldError(e.currentTarget, 'answer') }
    setErr('')
    if (active) submitAssignment(active.id)
    setActive(null)
  }

  return (
    <div className="p-page">
      <div className="p-toolbar">
        <div className="p-tabs" role="group" aria-label="وضعیت تکالیف">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l} <em>{fa(count(k))}</em></button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={Icon.check(40)} title="موردی نیست" text="در این دسته تکلیف یا آزمونکی ندارید." />
      ) : (
        <ul className="p-tasks">
          {list.map((a) => {
            const rel = relativeDay(a.due, demo.now)
            const urgent = a.status === 'pending' && (rel === 'امروز' || rel === 'فردا')
            return (
              <li key={a.id} className="p-card p-task">
                <span className={`p-task-ico c-${a.course.color}`}>{a.kind === 'آزمونک' ? Icon.chart() : Icon.tasks()}</span>
                <div className="p-task-body">
                  <div className="p-task-top"><Chip tone="muted">{a.kind}</Chip><small>{a.course.title} <bdi>{a.course.level}</bdi></small></div>
                  <h2>{a.title}</h2>
                  <small className={urgent ? 'p-warn' : 'p-muted'}>
                    {a.status === 'pending' ? <>مهلت: {rel}، {formatDate(a.due, false)} ساعت {formatTime(a.due)}</> : <>مهلت: {formatDate(a.due)}</>}
                  </small>
                </div>
                <div className="p-task-side">
                  {a.status === 'pending' && <><Chip tone={urgent ? 'warn' : 'navy'}>در انتظار</Chip><button type="button" className="btn btn-primary btn-sm" onClick={() => setActive(a)}>{Icon.upload(18)} {a.kind === 'آزمونک' ? 'شروع آزمونک' : 'ارسال پاسخ'}</button></>}
                  {a.status === 'submitted' && <><Chip tone="sky">ارسال شد</Chip><small className="p-muted">در انتظار بررسی استاد</small></>}
                  {a.status === 'graded' && <><span className="p-score"><b>{fa(a.score!)}</b><small>از {fa(a.max!)}</small></span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setView(a)}>بازخورد استاد</button></>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={!!active} onClose={() => { setActive(null); setErr('') }} title={active?.kind === 'آزمونک' ? 'آزمونک' : 'ارسال پاسخ تکلیف'}>
        {active && (
          <form className="p-form" onSubmit={submit} noValidate>
            <p className="p-modal-text"><b>{active.title}</b><br />{active.course.title} <bdi>{active.course.level}</bdi> • مهلت: {relativeDay(active.due, demo.now)}</p>
            <label className="p-field"><span>پاسخ شما</span><textarea name="answer" rows={5} placeholder="پاسخ را اینجا بنویسید…" aria-invalid={!!err} aria-describedby={err ? 'err-answer' : undefined} />
              {err && <small className="err" id="err-answer" role="alert">{err}</small>}</label>
            <label className="p-field"><span>پیوست (اختیاری)</span><input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.png,.mp3,.m4a" /><small className="p-muted">PDF، Word، تصویر یا فایل صوتی؛ حداکثر ۱۰ مگابایت</small></label>
            <button type="submit" className="btn btn-primary btn-block">ارسال برای استاد</button>
          </form>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title="بازخورد استاد">
        {view && (
          <div className="p-feedback">
            <span className="p-score big"><b>{fa(view.score!)}</b><small>از {fa(view.max!)}</small></span>
            <p><b>{view.title}</b></p>
            <blockquote>{view.feedback}</blockquote>
            <small className="p-muted">{view.course.teacher}</small>
          </div>
        )}
      </Modal>
    </div>
  )
}
