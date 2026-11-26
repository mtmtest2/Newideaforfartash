// Moderation history for the reception dashboard: every removed message (with its original text and who removed it)
// and every edit (before -> after). Filter lives in the URL (?log=delete|edit).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fa } from '../lib/fa'
import { formatDate, formatTime, relativeDay } from '../lib/jalali'
import { courseById, TEACHERS } from '../panel/data'
import { useQueryState } from '../panel/hooks'
import { Chip, Empty, Icon } from '../panel/ui'
import type { LogEntry, Role } from '../school/db'
import { useReceptionPanel } from './context'

const FILTERS = [['all', 'همه'], ['delete', 'حذف‌شده'], ['edit', 'ویرایش‌شده']] as const
const PAGE = 5

export default function History() {
  const { db, now, name } = useReceptionPanel()
  const [filter, setFilter] = useQueryState('log', FILTERS.map(([k]) => k), 'all')
  const [all, setAll] = useState(false)
  const list = db.log.filter((e) => filter === 'all' || e.action === filter).sort((a, b) => b.at.localeCompare(a.at))
  const shown = all ? list : list.slice(0, PAGE)
  const who = (p: { role: Role; id: string }) =>
    p.role === 'student' ? name(p.id) : p.role === 'teacher' ? `استاد ${TEACHERS.find((t) => t.id === p.id)?.name ?? ''}` : 'پذیرش'
  const when = (iso: string) => { const d = new Date(iso); return `${['امروز', 'دیروز'].includes(relativeDay(d, now)) ? relativeDay(d, now) : formatDate(d, false)}، ${formatTime(d)}` }
  const count = (k: string) => db.log.filter((e) => k === 'all' || e.action === k).length

  return (
    <section className="p-card p-history" aria-labelledby="hist-h">
      <header className="p-card-head p-history-head">
        <h2 id="hist-h">تاریخچهٔ پیام‌های حذف‌شده و ویرایش‌شده</h2>
        <div className="p-tabs" role="group" aria-label="نوع تغییر">
          {FILTERS.map(([k, l]) => <button key={k} type="button" aria-pressed={filter === k} className={filter === k ? 'on' : ''} onClick={() => { setFilter(k); setAll(false) }}>{l} <em>{fa(count(k))}</em></button>)}
        </div>
      </header>
      {shown.length ? (
        <ol className="p-log">
          {shown.map((e) => <Entry key={e.id} e={e} who={who} when={when} />)}
        </ol>
      ) : <Empty icon={Icon.checklist(36)} title="موردی نیست" text="هنوز پیامی حذف یا ویرایش نشده است." />}
      {list.length > PAGE && (
        <button type="button" className="btn btn-ghost btn-sm p-log-more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'نمایش کمتر' : `نمایش همه (${fa(list.length)})`}
        </button>
      )}
    </section>
  )
}

function Entry({ e, who, when }: { e: LogEntry; who: (p: { role: Role; id: string }) => string; when: (iso: string) => string }) {
  const { db } = useReceptionPanel()
  const g = db.groups.find((x) => x.id === e.groupId)
  const c = g && courseById(g.courseId)
  const self = e.by.role === e.author.role && e.by.id === e.author.id
  return (
    <li className={`p-log-item k-${e.action}`}>
      <span className="p-log-ico" aria-hidden="true">{e.action === 'delete' ? Icon.close(16) : Icon.pen(16)}</span>
      <div className="p-log-body">
        <p className="p-log-title">
          <span>{e.action === 'delete'
            ? <><b>{who(e.by)}</b> {self ? 'پیام خودش را حذف کرد' : <>پیام <b>{who(e.author)}</b> را حذف کرد</>}</>
            : <><b>{who(e.by)}</b> پیامش را ویرایش کرد</>}</span>
          {e.restoredAt && <Chip tone="ok">بازگردانده شد</Chip>}
        </p>
        <small className="p-muted">{c ? <>گروه {c.title} <bdi>{c.level}</bdi> • </> : null}{when(e.at)}</small>
        {e.action === 'delete' ? (
          <blockquote className="p-log-text"><span className="p-log-label">متن حذف‌شده</span>{e.before}</blockquote>
        ) : (
          <div className="p-log-diff">
            <blockquote className="p-log-text before"><span className="p-log-label">پیش از ویرایش</span>{e.before}</blockquote>
            <blockquote className="p-log-text after"><span className="p-log-label">پس از ویرایش</span>{e.after}</blockquote>
          </div>
        )}
      </div>
      {g && <Link className="btn btn-ghost btn-sm p-log-link" to={`/reception/groups?t=${g.id}`} aria-label={`دیدن گروه ${c?.title ?? ''}`}>دیدن گروه</Link>}
    </li>
  )
}
