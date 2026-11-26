import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fa, faDec } from '../../lib/fa'
import { addDays, formatDate, formatTime, relativeDay, WEEKDAYS } from '../../lib/jalali'
import { sessionsBetween, type Course } from '../../panel/data'
import { fieldError, useQueryState } from '../../panel/hooks'
import { Bar, Chip, Empty, Icon } from '../../panel/ui'
import { attendanceOf, avgScore, groupOf, postAnnouncement } from '../../school/db'
import { useTeacherPanel } from '../context'

export default function Classes() {
  const { courses } = useTeacherPanel()
  const [params] = useSearchParams()
  const open = courses.find((c) => c.id === params.get('id'))
  return open ? <ClassDetail c={open} /> : (
    <div className="p-page">
      <div className="p-course-grid">{courses.map((c) => <ClassCard key={c.id} c={c} />)}</div>
    </div>
  )
}

function useClassStats(c: Course) {
  const { db } = useTeacherPanel()
  const roster = db.rosters[c.id] ?? []
  const tasks = db.tasks.filter((t) => t.courseId === c.id)
  const subs = db.submissions.filter((s) => tasks.some((t) => t.id === s.taskId))
  const marks = Object.entries(db.attendance).filter(([k]) => k.startsWith(c.id + '|')).flatMap(([, v]) => Object.values(v))
  return {
    roster, tasks, subs,
    attendance: marks.length ? marks.filter((m) => m !== 'absent').length / marks.length : null,
    avg: avgScore(subs, tasks),
    toGrade: subs.filter((s) => s.score == null).length,
  }
}

function ClassCard({ c }: { c: Course }) {
  const { now, db } = useTeacherPanel()
  const st = useClassStats(c)
  const next = c.type === 'live' ? sessionsBetween(now, addDays(now, 8), [c]).find((s) => s.end > now) : undefined
  return (
    <article className="p-card p-course">
      <div className="p-course-img">
        <img src={c.img} alt="" width={c.imgW} height={c.imgH} loading="lazy" />
        <Chip tone={c.type === 'live' ? 'lime' : 'sky'}>{c.type === 'live' ? <>{Icon.live(14)} کلاس زنده</> : <>{Icon.video(14)} آفلاین</>}</Chip>
      </div>
      <div className="p-course-body">
        <h2>{c.title} <bdi>{c.level}</bdi></h2>
        <div className="p-course-progress"><span>{fa(c.done)} از {fa(c.sessions)} جلسه</span><b>{fa(Math.round((c.done / c.sessions) * 100))}٪</b></div>
        <Bar value={c.done / c.sessions} label={`پیشرفت ${c.title}`} />
        <p className="p-course-line">{Icon.users(18)} {fa(st.roster.length)} زبان‌آموز
          {st.attendance != null && <> • حضور {fa(Math.round(st.attendance * 100))}٪</>}
          {st.avg != null && <> • میانگین نمره {faDec(st.avg)}</>}</p>
        {c.type === 'live'
          ? <p className="p-course-line">{Icon.calendar(18)} {c.slots.map((s) => WEEKDAYS[s.weekday]).join('، ')}{next && <> • جلسهٔ بعد {relativeDay(next.start, now)} ساعت {formatTime(next.start)}</>}</p>
          : <p className="p-course-line">{Icon.video(18)} دورهٔ ضبط‌شده؛ پرسش‌ها از بخش پیام‌ها می‌رسد.</p>}
        {st.toGrade > 0 && <p className="p-course-line p-warn">{Icon.tasks(18)} {fa(st.toGrade)} پاسخ در انتظار نمره</p>}
        <div className="p-course-actions">
          <Link to={`/teacher/classes?id=${c.id}`} className="btn btn-primary btn-sm">{Icon.users(18)} زبان‌آموزان</Link>
          <Link to={`/teacher/classes?id=${c.id}&tab=news`} className="btn btn-ghost btn-sm">{Icon.megaphone(18)} اطلاعیه</Link>
          {groupOf(db, c.id) && <Link to={`/teacher/messages?t=${groupOf(db, c.id)!.id}`} className="btn btn-ghost btn-sm">{Icon.chat(18)} گروه کلاس</Link>}
        </div>
      </div>
    </article>
  )
}

function ClassDetail({ c }: { c: Course }) {
  const { db, now, name } = useTeacherPanel()
  const st = useClassStats(c)
  const [tab, setTab] = useQueryState('tab', ['students', 'news'] as const, 'students')
  const [err, setErr] = useState<{ field: 'title' | 'text'; msg: string } | null>(null)
  const [posted, setPosted] = useState(false)
  const news = db.announcements.filter((a) => a.courseId === c.id)

  const post = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const title = String(f.get('title') || '').trim(), text = String(f.get('text') || '').trim()
    const fail = (field: 'title' | 'text', msg: string) => { setErr({ field, msg }); fieldError(form, field) }
    if (!title) return fail('title', 'عنوان اطلاعیه را بنویسید؛ مثلاً «جلسهٔ جبرانی».')
    if (text.length < 10) return fail('text', 'متن اطلاعیه را کامل‌تر بنویسید؛ دست‌کم ۱۰ حرف.')
    setErr(null)
    postAnnouncement(c.id, title, text)
    form.reset(); setPosted(true); window.setTimeout(() => setPosted(false), 4000)
  }

  return (
    <div className="p-page">
      <Link to="/teacher/classes" className="p-back">{Icon.chevronRight(18)} همهٔ کلاس‌ها</Link>
      <header className="p-detail-head">
        <h2>{c.title} <bdi>{c.level}</bdi></h2>
        <p className="p-muted">{fa(st.roster.length)} زبان‌آموز • {c.type === 'live' ? 'کلاس زنده' : 'دورهٔ آفلاین'}</p>
      </header>
      <div className="p-tabs" role="group" aria-label="بخش کلاس">
        <button type="button" aria-pressed={tab === 'students'} className={tab === 'students' ? 'on' : ''} onClick={() => setTab('students')}>زبان‌آموزان</button>
        <button type="button" aria-pressed={tab === 'news'} className={tab === 'news' ? 'on' : ''} onClick={() => setTab('news')}>اطلاعیه‌ها <em>{fa(news.length)}</em></button>
      </div>

      {tab === 'students' ? (
        <section className="p-card">
          <div className="p-table-wrap">
            <table className="p-table">
              <caption className="sr">زبان‌آموزان {c.title}</caption>
              <thead><tr><th scope="col">نام</th><th scope="col">حضور</th><th scope="col">تکالیف ارسال‌شده</th><th scope="col">میانگین نمره</th></tr></thead>
              <tbody>
                {st.roster.map((id) => {
                  const a = attendanceOf(db, c.id, id)
                  const mine = st.subs.filter((s) => s.studentId === id)
                  const avg = avgScore(mine, st.tasks)
                  const due = st.tasks.filter((t) => new Date(t.due) < now).length
                  return (
                    <tr key={id}>
                      <td className="p-td-title">{name(id)}</td>
                      <td data-label="حضور">{a.total ? <>{fa(a.present)} از {fa(a.total)}{a.late > 0 && <span className="p-muted"> ({fa(a.late)} تأخیر)</span>}</> : '—'}</td>
                      <td data-label="تکالیف">{fa(mine.length)} از {fa(Math.max(due, mine.length))}</td>
                      <td className="p-td-status">{avg == null ? <Chip tone="muted">بدون نمره</Chip> : <Chip tone={avg >= 17 ? 'ok' : avg >= 14 ? 'lime' : 'warn'}>{faDec(avg)}</Chip>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="p-row p-row-news">
          <form className="p-card p-form" onSubmit={post} noValidate>
            <h2 className="p-section-title">اطلاعیهٔ تازه</h2>
            <p className="p-muted p-form-note">برای همهٔ {fa(st.roster.length)} زبان‌آموز این کلاس در پنلشان نشان داده می‌شود.</p>
            <label className="p-field"><span>عنوان</span><input name="title" autoComplete="off" placeholder="مثلاً جلسهٔ جبرانی…" aria-invalid={err?.field === 'title'} aria-describedby={err?.field === 'title' ? 'err-title' : undefined} />
              {err?.field === 'title' && <small className="err" id="err-title" role="alert">{err.msg}</small>}</label>
            <label className="p-field"><span>متن</span><textarea name="text" rows={4} placeholder="آنچه زبان‌آموزان باید بدانند…" aria-invalid={err?.field === 'text'} aria-describedby={err?.field === 'text' ? 'err-text' : undefined} />
              {err?.field === 'text' && <small className="err" id="err-text" role="alert">{err.msg}</small>}</label>
            {posted && <p className="ok" role="status">اطلاعیه برای زبان‌آموزان فرستاده شد.</p>}
            <button type="submit" className="btn btn-primary">{Icon.megaphone(18)} انتشار اطلاعیه</button>
          </form>
          <section className="p-card">
            <h2 className="p-section-title">اطلاعیه‌های این کلاس</h2>
            {news.length ? (
              <ul className="p-list">
                {news.map((n) => <li key={n.id}><div><b>{n.title}</b><small>{n.text}</small></div><time className="p-muted p-time">{relativeDay(new Date(n.at), now) === 'امروز' ? formatTime(new Date(n.at)) : formatDate(new Date(n.at), false)}</time></li>)}
              </ul>
            ) : <Empty icon={Icon.megaphone(36)} title="اطلاعیه‌ای نیست" text="اولین اطلاعیهٔ این کلاس را بنویسید." />}
          </section>
        </div>
      )}
    </div>
  )
}
