import { useState } from 'react'
import { fa } from '../../lib/fa'
import { formatDate } from '../../lib/jalali'
import { INTRO_VIDEO } from '../../assets'
import { COURSES, type Recording } from '../data'
import { usePanel } from '../context'
import { Bar, Chip, Icon, Modal } from '../ui'

export default function Recordings() {
  const { demo } = usePanel()
  const [course, setCourse] = useState('all')
  const [playing, setPlaying] = useState<Recording | null>(null)
  const list = demo.recordings.filter((r) => course === 'all' || r.course.id === course)
  const resume = demo.recordings.find((r) => r.watched > 0 && r.watched < 1)

  return (
    <div className="p-page">
      {resume && (
        <button type="button" className="p-card p-resume" onClick={() => setPlaying(resume)}>
          <img src={resume.thumb} alt="" loading="lazy" />
          <span><small>ادامهٔ تماشا</small><b>{resume.title}</b><Bar value={resume.watched} label="میزان تماشا" /></span>
          <span className="p-play" aria-hidden="true">{Icon.play(26)}</span>
        </button>
      )}

      <div className="p-toolbar">
        <div className="p-tabs" role="tablist" aria-label="دوره">
          <button role="tab" aria-selected={course === 'all'} className={course === 'all' ? 'on' : ''} onClick={() => setCourse('all')}>همه</button>
          {COURSES.map((c) => <button key={c.id} role="tab" aria-selected={course === c.id} className={course === c.id ? 'on' : ''} onClick={() => setCourse(c.id)}>{c.title} <bdi>{c.level}</bdi></button>)}
        </div>
      </div>

      <ul className="p-rec-grid">
        {list.map((r) => (
          <li key={r.id}>
            <button type="button" className="p-card p-rec" onClick={() => setPlaying(r)} aria-label={`پخش ${r.title}`}>
              <span className="p-rec-thumb">
                <img src={r.thumb} alt="" loading="lazy" />
                <span className="p-play" aria-hidden="true">{Icon.play(22)}</span>
                <span className="p-rec-len">{fa(r.minutes)} دقیقه</span>
                {r.watched >= 1 && <span className="p-rec-done">{Icon.check(16)} دیده‌شده</span>}
              </span>
              <span className="p-rec-body">
                <Chip tone={r.course.type === 'live' ? 'lime' : 'sky'}>{r.course.title} <bdi>{r.course.level}</bdi></Chip>
                <b>{r.title}</b>
                <small className="p-muted">{r.course.type === 'live' ? `ضبط جلسهٔ ${formatDate(r.date)}` : 'درس ویدیویی'}</small>
                <Bar value={r.watched} label={`میزان تماشای ${r.title}`} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal open={!!playing} onClose={() => setPlaying(null)} title={playing?.title ?? 'پخش ویدیو'} wide>
        {playing && (
          <>
            <video className="p-player" src={INTRO_VIDEO.small} poster={INTRO_VIDEO.posterSmall} controls autoPlay playsInline />
            <p className="p-muted p-demo-note">نسخهٔ نمایشی: به‌جای ضبط این جلسه، ویدیوی معرفی فرتاش پخش می‌شود.</p>
          </>
        )}
      </Modal>
    </div>
  )
}
