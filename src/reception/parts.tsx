import { useState } from 'react'
import { addDays, formatTime, relativeDay } from '../lib/jalali'
import { sessionsBetween, type Course, type Session } from '../panel/data'
import { JOIN_EARLY_MS } from '../panel/hooks'
import { Chip, Icon, Modal } from '../panel/ui'
import { createGroup } from '../school/db'

/** Where a live class stands right now: running, about to start, or its next session. */
export function classState(c: Course, now: Date): { live: boolean; joinable: boolean; next?: Session } {
  if (c.type !== 'live') return { live: false, joinable: false }
  const next = sessionsBetween(new Date(now.getTime() - 3 * 3600000), addDays(now, 8), [c]).find((s) => s.end > now)
  if (!next) return { live: false, joinable: false }
  return { live: now >= next.start && now < next.end, joinable: now.getTime() >= next.start.getTime() - JOIN_EARLY_MS && now < next.end, next }
}

export function StateChip({ c, now }: { c: Course; now: Date }) {
  const st = classState(c, now)
  if (c.type !== 'live') return <Chip tone="sky">دورهٔ آفلاین</Chip>
  if (st.live) return <Chip tone="warn"><span className="p-live-dot" /> در حال برگزاری</Chip>
  return st.next ? <Chip tone="muted">جلسهٔ بعد: {relativeDay(st.next.start, now)} {formatTime(st.next.start)}</Chip> : <Chip tone="muted">جلسه‌ای در برنامه نیست</Chip>
}

/** Reception joins a live class as an observer (enabled from 15 minutes before the start until the end). */
export function JoinClass({ c, now, small = true }: { c: Course; now: Date; small?: boolean }) {
  const [open, setOpen] = useState(false)
  if (c.type !== 'live') return null
  const st = classState(c, now)
  return (
    <>
      {st.joinable
        ? <button type="button" className={`btn btn-primary${small ? ' btn-sm' : ''}`} onClick={() => setOpen(true)}>{Icon.live(18)} ورود به کلاس</button>
        : <button type="button" className={`btn btn-ghost${small ? ' btn-sm' : ''}`} disabled title="ورود از ۱۵ دقیقه پیش از شروع جلسه فعال می‌شود">ورود به کلاس</button>}
      <Modal open={open} onClose={() => setOpen(false)} title={`ورود به کلاس ${c.title} ${c.level}`}>
        <p className="p-modal-text">پذیرش به‌عنوان ناظر وارد کلاس می‌شود: میکروفون و دوربین خاموش است و نامتان در فهرست شرکت‌کنندگان «پذیرش فرتاش» نشان داده می‌شود. این نسخه نمایشی است و هنوز به سامانهٔ کلاس آنلاین وصل نشده است.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>متوجه شدم</button>
      </Modal>
    </>
  )
}

export function CreateGroup({ c, small = true }: { c: Course; small?: boolean }) {
  return <button type="button" className={`btn btn-primary${small ? ' btn-sm' : ''}`} onClick={() => createGroup(c.id)} aria-label={`ساخت گروه ${c.title} ${c.level}`}>{Icon.plus(18)} ساخت گروه</button>
}
