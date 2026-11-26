import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fa, toLatin, faDec } from '../../lib/fa'
import { addDays, formatDate, formatTime, relativeDay, startOfDay, WEEKDAYS, weekdayIndex } from '../../lib/jalali'
import { courseById } from '../../panel/data'
import { fieldError, useQueryState } from '../../panel/hooks'
import { Bar, Chip, Empty, Icon, Modal } from '../../panel/ui'
import { addTask, gradeSubmission, type Submission, type Task } from '../../school/db'
import { useTeacherPanel } from '../context'

export default function Tasks() {
  const { db, courses, now } = useTeacherPanel()
  const [params] = useSearchParams()
  const ids = courses.map((c) => c.id)
  const [course, setCourse] = useQueryState('course', ['all', ...ids], 'all')
  const [creating, setCreating] = useState(false)
  const open = db.tasks.find((t) => t.id === params.get('task') && ids.includes(t.courseId))
  if (open) return <TaskDetail task={open} />

  const list = db.tasks.filter((t) => ids.includes(t.courseId) && (course === 'all' || t.courseId === course))
    .sort((a, b) => {
      const ag = toGradeOf(db.submissions, a), bg = toGradeOf(db.submissions, b)
      return (bg > 0 ? 1 : 0) - (ag > 0 ? 1 : 0) || b.due.localeCompare(a.due)
    })

  return (
    <div className="p-page">
      <div className="p-toolbar">
        <div className="p-tabs" role="group" aria-label="کلاس">
          <button type="button" aria-pressed={course === 'all'} className={course === 'all' ? 'on' : ''} onClick={() => setCourse('all')}>همه</button>
          {courses.map((c) => <button key={c.id} type="button" aria-pressed={course === c.id} className={course === c.id ? 'on' : ''} onClick={() => setCourse(c.id)}>{c.title} <bdi>{c.level}</bdi></button>)}
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>{Icon.plus(18)} تکلیف تازه</button>
      </div>

      {list.length ? (
        <ul className="p-tasks">
          {list.map((t) => {
            const roster = db.rosters[t.courseId] ?? []
            const subs = db.submissions.filter((s) => s.taskId === t.id)
            const graded = subs.filter((s) => s.score != null).length
            const waiting = subs.length - graded
            const due = new Date(t.due)
            return (
              <li key={t.id} className="p-card p-task">
                <div className="p-task-body">
                  <div className="p-task-top"><Chip tone="muted">{t.kind}</Chip><small>{courseById(t.courseId).title} <bdi>{courseById(t.courseId).level}</bdi></small></div>
                  <h2>{t.title}</h2>
                  <small className="p-muted">مهلت: {due > now ? `${relativeDay(due, now)}، ` : ''}{formatDate(due, false)} ساعت {formatTime(due)}</small>
                  <div className="p-task-progress">
                    <Bar value={roster.length ? subs.length / roster.length : 0} label={`پاسخ‌های ${t.title}`} />
                    <small>{fa(subs.length)} از {fa(roster.length)} پاسخ • {fa(graded)} نمره‌داده</small>
                  </div>
                </div>
                <div className="p-task-side">
                  {waiting > 0 ? <Chip tone="warn">{fa(waiting)} در انتظار نمره</Chip> : subs.length ? <Chip tone="ok">همه نمره گرفتند</Chip> : <Chip tone="muted">بدون پاسخ</Chip>}
                  <Link className={`btn btn-sm ${waiting ? 'btn-primary' : 'btn-ghost'}`} to={`/teacher/assignments?task=${t.id}`}>{waiting ? 'نمره‌دهی' : 'پاسخ‌ها'}</Link>
                </div>
              </li>
            )
          })}
        </ul>
      ) : <Empty icon={Icon.tasks(40)} title="تکلیفی نیست" text="برای این کلاس هنوز تکلیفی نساخته‌اید." />}

      <NewTask open={creating} onClose={() => setCreating(false)} defaultCourse={course === 'all' ? ids[0] : course} />
    </div>
  )
}

const toGradeOf = (subs: Submission[], t: Task) => subs.filter((s) => s.taskId === t.id && s.score == null).length

function NewTask({ open, onClose, defaultCourse }: { open: boolean; onClose: () => void; defaultCourse: string }) {
  const { courses, now } = useTeacherPanel()
  const [err, setErr] = useState<{ field: string; msg: string } | null>(null)
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(now), i + 1))
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const title = String(f.get('title') || '').trim()
    const max = Number(toLatin(String(f.get('max') || '')))
    const fail = (field: string, msg: string) => { setErr({ field, msg }); fieldError(form, field) }
    if (title.length < 5) return fail('title', 'عنوان تکلیف را بنویسید؛ دست‌کم ۵ حرف.')
    if (!Number.isInteger(max) || max < 1 || max > 100) return fail('max', 'نمرهٔ کامل باید عددی بین ۱ و ۱۰۰ باشد.')
    setErr(null)
    const due = new Date(Number(f.get('day')))
    const [h, m] = String(f.get('time')).split(':').map(Number)
    due.setHours(h, m, 0, 0)
    addTask({ courseId: String(f.get('course')), kind: f.get('kind') === 'آزمونک' ? 'آزمونک' : 'تکلیف', title, desc: String(f.get('desc') || '').trim(), due: due.toISOString(), max })
    form.reset(); onClose()
  }
  const e = (field: string) => ({ 'aria-invalid': err?.field === field, 'aria-describedby': err?.field === field ? `err-${field}` : undefined })
  const msg = (field: string) => err?.field === field && <small className="err" id={`err-${field}`} role="alert">{err.msg}</small>
  return (
    <Modal open={open} onClose={() => { setErr(null); onClose() }} title="تکلیف تازه">
      <form className="p-form" onSubmit={submit} noValidate>
        <div className="p-form-grid">
          <label className="p-field"><span>کلاس</span>
            <select name="course" defaultValue={defaultCourse} key={defaultCourse}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title} {c.level}</option>)}</select></label>
          <label className="p-field"><span>نوع</span>
            <select name="kind" defaultValue="تکلیف"><option>تکلیف</option><option>آزمونک</option></select></label>
        </div>
        <label className="p-field"><span>عنوان</span><input name="title" autoComplete="off" placeholder="مثلاً نوشتن یک ایمیل رسمی…" {...e('title')} />{msg('title')}</label>
        <label className="p-field"><span>توضیح برای زبان‌آموزان</span><textarea name="desc" rows={3} placeholder="چه کاری، با چه منبعی، در چه حجمی…" /></label>
        <div className="p-form-grid p-form-grid-3">
          <label className="p-field"><span>مهلت</span>
            <select name="day" defaultValue={String(days[2].getTime())}>{days.map((d) => <option key={d.getTime()} value={d.getTime()}>{WEEKDAYS[weekdayIndex(d)]} {formatDate(d, false)}</option>)}</select></label>
          <label className="p-field"><span>ساعت</span>
            <select name="time" defaultValue="23:59">{['12:00', '18:00', '20:00', '23:59'].map((t) => <option key={t} value={t}>{fa(t)}</option>)}</select></label>
          <label className="p-field"><span>نمرهٔ کامل</span><input name="max" defaultValue="20" inputMode="numeric" dir="ltr" className="ltr-in" autoComplete="off" {...e('max')} />{msg('max')}</label>
        </div>
        <p className="p-muted p-form-note">تکلیف بلافاصله در پنل زبان‌آموزان این کلاس نشان داده می‌شود.</p>
        <button type="submit" className="btn btn-primary btn-block">ساخت تکلیف</button>
      </form>
    </Modal>
  )
}

function TaskDetail({ task }: { task: Task }) {
  const { db, now, name } = useTeacherPanel()
  const [params, setParams] = useSearchParams()
  const roster = db.rosters[task.courseId] ?? []
  const subs = db.submissions.filter((s) => s.taskId === task.id)
  const grading = subs.find((s) => s.id === params.get('sub')) ?? null
  const setGrading = (s: Submission | null) => setParams((p) => { const n = new URLSearchParams(p); if (s) n.set('sub', s.id); else n.delete('sub'); return n }, { replace: true })
  const c = courseById(task.courseId)
  const due = new Date(task.due)
  // waiting first, then graded, then not sent
  const rows = roster.map((id) => ({ id, sub: subs.find((s) => s.studentId === id) }))
    .sort((a, b) => rank(a.sub) - rank(b.sub))

  return (
    <div className="p-page">
      <Link to="/teacher/assignments" className="p-back">{Icon.chevronRight(18)} همهٔ تکالیف</Link>
      <header className="p-card p-task-head">
        <div className="p-task-top"><Chip tone="muted">{task.kind}</Chip><small>{c.title} <bdi>{c.level}</bdi></small></div>
        <h2>{task.title}</h2>
        {task.desc && <p>{task.desc}</p>}
        <small className="p-muted">مهلت: {formatDate(due, false)} ساعت {formatTime(due)} {due < now ? '• مهلت تمام شده' : `• ${relativeDay(due, now)}`} • نمرهٔ کامل {fa(task.max)}</small>
      </header>

      <section className="p-card">
        <header className="p-card-head"><h2>پاسخ‌ها</h2><span className="p-muted">{fa(subs.length)} از {fa(roster.length)} زبان‌آموز</span></header>
        <ul className="p-list p-subs">
          {rows.map(({ id, sub }) => (
            <li key={id}>
              <div><b>{name(id)}</b><small>{sub ? <>ارسال: {relativeDay(new Date(sub.at), now)} ساعت {formatTime(new Date(sub.at))}{sub.file && <> • <bdi dir="ltr">{sub.file}</bdi></>}</> : due < now ? 'پاسخی نفرستاد' : 'هنوز نفرستاده'}</small></div>
              {sub ? (
                <>
                  {sub.score != null ? <span className="p-score"><b>{faDec(sub.score, 2)}</b><small>از {fa(task.max)}</small></span> : <Chip tone="warn">در انتظار نمره</Chip>}
                  <button type="button" className={`btn btn-sm ${sub.score == null ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setGrading(sub)} aria-label={`${sub.score == null ? 'نمره‌دهی' : 'ویرایش نمرهٔ'} ${name(id)}`}>{sub.score == null ? 'نمره‌دهی' : 'ویرایش'}</button>
                </>
              ) : <Chip tone="muted">ارسال نشده</Chip>}
            </li>
          ))}
        </ul>
      </section>

      <Grade sub={grading} task={task} onClose={() => setGrading(null)} />
    </div>
  )
}
const rank = (s?: Submission) => (!s ? 2 : s.score == null ? 0 : 1)

function Grade({ sub, task, onClose }: { sub: Submission | null; task: Task; onClose: () => void }) {
  const { name, now } = useTeacherPanel()
  const [err, setErr] = useState('')
  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const raw = toLatin(String(f.get('score') || '')).replace('٫', '.').trim()
    const score = Number(raw)
    if (!raw || Number.isNaN(score) || score < 0 || score > task.max) { setErr(`نمره را عددی بین ۰ و ${fa(task.max)} بنویسید؛ مثلاً ${fa(Math.round(task.max * 0.85))}.`); return fieldError(form, 'score') }
    setErr('')
    gradeSubmission(sub!.id, Math.round(score * 4) / 4, String(f.get('feedback') || '').trim())
    onClose()
  }
  return (
    <Modal open={!!sub} onClose={() => { setErr(''); onClose() }} title={sub ? `پاسخ ${name(sub.studentId)}` : 'پاسخ'}>
      {sub && (
        <form className="p-form" onSubmit={save} noValidate key={sub.id}>
          <div className="p-answer">
            <small className="p-muted">{task.title} • {relativeDay(new Date(sub.at), now)} ساعت {formatTime(new Date(sub.at))}</small>
            <p>{sub.answer}</p>
            {sub.file && <span className="p-file">{Icon.upload(16)} <bdi dir="ltr">{sub.file}</bdi></span>}
          </div>
          <label className="p-field p-field-score"><span>نمره از {fa(task.max)}</span>
            <input name="score" defaultValue={sub.score != null ? String(sub.score) : ''} inputMode="decimal" dir="ltr" className="ltr-in" autoComplete="off" placeholder={`مثلاً ${Math.round(task.max * 0.85)}`} aria-invalid={!!err} aria-describedby={err ? 'err-score' : undefined} />
            {err && <small className="err" id="err-score" role="alert">{err}</small>}</label>
          <label className="p-field"><span>بازخورد برای زبان‌آموز</span><textarea name="feedback" rows={4} defaultValue={sub.feedback} placeholder="نکتهٔ خوب پاسخ و چیزی که باید بهتر شود…" /></label>
          <p className="p-muted p-form-note">نمره و بازخورد بلافاصله در پنل زبان‌آموز نشان داده می‌شود و برایش اعلان می‌رود.</p>
          <button type="submit" className="btn btn-primary btn-block">ثبت نمره</button>
        </form>
      )}
    </Modal>
  )
}
