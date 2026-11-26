// Class group chat shared by the three panels (student, teacher, reception): group list + message log + composer.
// The open group lives in the URL (?t=groupId) so it survives reload and back/forward.
// Whoever moderates the group (its teacher, reception) can remove messages and close/reopen it;
// every author can edit their own messages. Removals and edits go to the reception history.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fa } from '../lib/fa'
import { formatDate, formatTime, relativeDay, sameDay } from '../lib/jalali'
import { reader, type Message, type Reader } from '../school/db'
import { Empty, Icon } from './ui'

export type ChatGroup = { id: string; title: string; subtitle: string; members: number; locked: boolean; unread: number; messages: Message[] }

type Props = {
  groups: ChatGroup[]
  me: Reader
  now: Date
  nameOf: (m: Message) => string
  onSend: (g: ChatGroup, text: string) => void
  onRead: (g: ChatGroup) => void
  onEdit: (m: Message, text: string) => void
  /** present when the viewer moderates the open group (class teacher or reception) */
  moderate?: {
    canRemove: (m: Message) => boolean
    remove: (m: Message) => void
    restore: (m: Message) => void
    lock: (g: ChatGroup, locked: boolean) => void
    /** groups this viewer moderates (a teacher only moderates their own classes) */
    groups?: string[]
  }
  emptyText: string
}

const ROLE_TAG = { teacher: 'استاد', reception: 'پذیرش', student: '' } as const

export default function Chat({ groups, me, now, nameOf, onSend, onEdit, onRead, moderate, emptyText }: Props) {
  const [params, setParams] = useSearchParams()
  const sorted = [...groups].sort((a, b) => lastAt(b) - lastAt(a))
  const active = sorted.find((g) => g.id === params.get('t')) ?? null
  const select = (id: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('t', id); else n.delete('t'); return n })

  // opening a group marks it read (also when new messages arrive while it is open)
  useEffect(() => { if (active && active.unread) onRead(active) }, [active?.id, active?.unread]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`p-chat p-card${active ? ' has-active' : ''}`}>
      <div className="p-chat-list" role="navigation" aria-label="گروه‌های کلاس">
        {sorted.length ? (
          <ul>
            {sorted.map((g) => {
              const last = g.messages.filter((m) => !m.deleted).at(-1)
              return (
                <li key={g.id}>
                  <button type="button" className={g.id === active?.id ? 'on' : ''} aria-current={g.id === active?.id || undefined} onClick={() => select(g.id)}>
                    <span className="p-group-ico" aria-hidden="true">{Icon.users(20)}</span>
                    <span className="p-chat-li">
                      <span className="p-chat-li-top"><b>{g.title}</b>{last && <time>{relativeDay(new Date(last.at), now)}</time>}</span>
                      <small>{g.subtitle}{g.locked && ' • بسته'}</small>
                      <span className="p-chat-li-last">{last ? <>{reader(last.role, last.authorId) === me ? 'شما' : nameOf(last)}: {last.text}</> : 'هنوز پیامی نیست'}</span>
                    </span>
                    {g.unread > 0 && <em aria-label={`${fa(g.unread)} پیام تازه`}>{fa(g.unread)}</em>}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : <p className="p-muted p-chat-none">{emptyText}</p>}
      </div>

      <section className="p-chat-main" aria-label={active ? `گروه ${active.title}` : 'گفت‌وگو'}>
        {active ? <Conversation key={active.id} g={active} me={me} now={now} nameOf={nameOf} onSend={onSend} onEdit={onEdit}
          moderate={moderate && (!moderate.groups || moderate.groups.includes(active.id)) ? moderate : undefined} onBack={() => select(null)} /> :
          <Empty icon={Icon.users(40)} title="یک گروه را انتخاب کنید" text="گفت‌وگوی هر کلاس با استاد، هم‌کلاسی‌ها و پذیرش در گروه همان کلاس است." />}
      </section>
    </div>
  )
}

const lastAt = (g: ChatGroup) => (g.messages.length ? new Date(g.messages[g.messages.length - 1].at).getTime() : 0)

const BY = { reception: 'پذیرش', teacher: 'استاد', student: 'نویسنده' } as const

function Conversation({ g, me, now, nameOf, onSend, onEdit, moderate, onBack }: Pick<Props, 'me' | 'now' | 'nameOf' | 'onSend' | 'onEdit' | 'moderate'> & { g: ChatGroup; onBack: () => void }) {
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<Message | null>(null)
  const [removed, setRemoved] = useState<Message | null>(null)
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { const el = log.current; if (el && !editing) el.scrollTop = el.scrollHeight }, [g.messages.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const canPost = !g.locked || !!moderate

  const startEdit = (m: Message) => { setEditing(m); setText(m.text); window.setTimeout(() => input.current?.focus(), 0) }
  const cancelEdit = () => { setEditing(null); setText('') }
  const send = (e?: FormEvent) => {
    e?.preventDefault()
    const t = text.trim()
    if (!t) return input.current?.focus()
    if (editing) { if (t !== editing.text) onEdit(editing, t); setEditing(null) } else onSend(g, t)
    setText('')
    input.current?.focus()
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && editing) { e.preventDefault(); cancelEdit() }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
  }
  const remove = (m: Message) => { moderate!.remove(m); setRemoved(m); if (editing?.id === m.id) cancelEdit() }

  return (
    <>
      <header className="p-chat-head">
        <button type="button" className="icon-btn p-chat-back" onClick={onBack} aria-label="بازگشت به فهرست گروه‌ها">{Icon.chevronRight(20)}</button>
        <span className="p-group-ico" aria-hidden="true">{Icon.users(20)}</span>
        <span className="p-chat-title"><b>{g.title}</b><small>{g.subtitle} • {fa(g.members)} عضو{g.locked && ' • بسته'}</small></span>
        {moderate && (
          <button type="button" className="btn btn-ghost btn-sm p-chat-lock" onClick={() => moderate.lock(g, !g.locked)} aria-label={g.locked ? 'باز کردن گروه' : 'بستن گروه'}>
            {g.locked ? Icon.chat(18) : Icon.lock(18)}<span aria-hidden="true">{g.locked ? 'باز کردن گروه' : 'بستن گروه'}</span>
          </button>
        )}
      </header>
      <div className="p-chat-log" ref={log} role="log" aria-live="polite" aria-label="پیام‌ها" tabIndex={0}>
        <ol>
          {g.messages.map((m, i) => {
            const d = new Date(m.at)
            const prev = g.messages[i - 1]
            const newDay = !prev || !sameDay(new Date(prev.at), d)
            const mine = reader(m.role, m.authorId) === me
            const sameAuthor = prev && !newDay && prev.role === m.role && prev.authorId === m.authorId
            return (
              <li key={m.id} className={`${mine ? 'mine' : 'theirs'} r-${m.role}${editing?.id === m.id ? ' is-editing' : ''}`}>
                {newDay && <span className="p-chat-day">{['امروز', 'دیروز'].includes(relativeDay(d, now)) ? relativeDay(d, now) : formatDate(d, false)}</span>}
                <div className={`p-bubble${m.deleted ? ' removed' : ''}`}>
                  {!mine && !sameAuthor && <b className="p-author">{nameOf(m)}{ROLE_TAG[m.role] && <span className="p-role-tag">{ROLE_TAG[m.role]}</span>}</b>}
                  {mine && <span className="sr">شما:</span>}
                  <p>{m.deleted ? `این پیام را ${BY[m.deletedBy?.role ?? 'reception']} حذف کرد.` : m.text}</p>
                  <span className="p-bubble-foot">
                    {mine && !m.deleted && canPost && <button type="button" className="p-msg-act" onClick={() => startEdit(m)} aria-label="ویرایش پیام">ویرایش</button>}
                    {moderate && moderate.canRemove(m) && <button type="button" className="p-msg-act p-remove" onClick={() => remove(m)} aria-label={`حذف پیام ${mine ? 'خودتان' : nameOf(m)}`}>حذف</button>}
                    {m.editedAt && !m.deleted && <span className="p-edited">ویرایش‌شده</span>}
                    <time dateTime={m.at}>{formatTime(d)}</time>
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
      {removed && (
        <p className="p-undo" role="status">پیام حذف شد؛ متن اصلی در تاریخچهٔ پذیرش می‌ماند.
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { moderate?.restore(removed); setRemoved(null) }}>بازگرداندن</button></p>
      )}
      {canPost ? (
        <form className={`p-composer${editing ? ' editing' : ''}`} onSubmit={send}>
          {editing && <p className="p-editing-bar"><span>{Icon.pen(16)} ویرایش پیام</span><button type="button" className="p-msg-act" onClick={cancelEdit}>انصراف</button></p>}
          <label className="sr" htmlFor="p-msg">{editing ? 'متن ویرایش‌شدهٔ پیام' : `پیام در گروه ${g.title}`}</label>
          <textarea id="p-msg" ref={input} rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
            placeholder={me.startsWith('reception') ? 'پیام به‌نام پذیرش فرتاش…' : 'پیام خود را بنویسید…'} autoComplete="off" maxLength={1000} />
          <button type="submit" className="btn btn-primary p-send" aria-label={editing ? 'ذخیرهٔ ویرایش' : 'ارسال پیام'} disabled={!text.trim()}>{editing ? Icon.check(20) : Icon.send(20)}</button>
        </form>
      ) : <p className="p-chat-locked">{Icon.lock(18)} این گروه موقتاً بسته است؛ پیام‌ها را می‌توانید بخوانید.</p>}
    </>
  )
}
