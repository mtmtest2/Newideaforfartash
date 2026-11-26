// Conversation view shared by both panels: thread list + message log + composer.
// The active thread lives in the URL (?t=…) so it survives reload and back/forward.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fa } from '../lib/fa'
import { formatDate, formatTime, relativeDay, sameDay } from '../lib/jalali'
import type { Message, Role } from '../school/db'
import { Empty, Icon, initials } from './ui'

export type Thread = { key: string; title: string; subtitle: string; messages: Message[] }

type Props = {
  threads: Thread[]
  me: Role
  now: Date
  onSend: (thread: Thread, text: string) => void
  onRead: (thread: Thread) => void
  emptyText: string
}

export default function Chat({ threads, me, now, onSend, onRead, emptyText }: Props) {
  const [params, setParams] = useSearchParams()
  const sorted = [...threads].sort((a, b) => lastAt(b) - lastAt(a))
  const active = sorted.find((t) => t.key === params.get('t')) ?? null
  const select = (key: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (key) n.set('t', key); else n.delete('t'); return n })

  // opening a thread marks the other side's messages as read (also when new ones arrive while open)
  const unreadInActive = active?.messages.filter((m) => m.from !== me && !m.read).length ?? 0
  useEffect(() => { if (active && unreadInActive) onRead(active) }, [active?.key, unreadInActive]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`p-chat p-card${active ? ' has-active' : ''}`}>
      <div className="p-chat-list" role="navigation" aria-label="گفت‌وگوها">
        {sorted.length ? (
          <ul>
            {sorted.map((t) => {
              const last = t.messages[t.messages.length - 1]
              const unread = t.messages.filter((m) => m.from !== me && !m.read).length
              return (
                <li key={t.key}>
                  <button type="button" className={t.key === active?.key ? 'on' : ''} aria-current={t.key === active?.key || undefined} onClick={() => select(t.key)}>
                    <span className="p-avatar p-avatar-sm" aria-hidden="true">{initials(t.title.replace(/^استاد\s+/, ''))}</span>
                    <span className="p-chat-li">
                      <span className="p-chat-li-top"><b>{t.title}</b>{last && <time>{relativeDay(new Date(last.at), now)}</time>}</span>
                      <small>{t.subtitle}</small>
                      <span className="p-chat-li-last">{last ? <>{last.from === me && 'شما: '}{last.text}</> : 'هنوز پیامی نیست'}</span>
                    </span>
                    {unread > 0 && <em aria-label={`${fa(unread)} پیام تازه`}>{fa(unread)}</em>}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : <p className="p-muted p-chat-none">{emptyText}</p>}
      </div>

      <section className="p-chat-main" aria-label={active ? `گفت‌وگو با ${active.title}` : 'گفت‌وگو'}>
        {active ? <Conversation key={active.key} thread={active} me={me} now={now} onSend={onSend} onBack={() => select(null)} /> :
          <Empty icon={Icon.chat(40)} title="یک گفت‌وگو را انتخاب کنید" text="پیام‌ها همین‌جا نشان داده می‌شوند." />}
      </section>
    </div>
  )
}

const lastAt = (t: Thread) => (t.messages.length ? new Date(t.messages[t.messages.length - 1].at).getTime() : 0)

function Conversation({ thread, me, now, onSend, onBack }: { thread: Thread; me: Role; now: Date; onSend: Props['onSend']; onBack: () => void }) {
  const [text, setText] = useState('')
  const log = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { const el = log.current; if (el) el.scrollTop = el.scrollHeight }, [thread.messages.length])

  const send = (e?: FormEvent) => {
    e?.preventDefault()
    const t = text.trim()
    if (!t) return input.current?.focus()
    onSend(thread, t)
    setText('')
    input.current?.focus()
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
  }

  return (
    <>
      <header className="p-chat-head">
        <button type="button" className="icon-btn p-chat-back" onClick={onBack} aria-label="بازگشت به فهرست گفت‌وگوها">{Icon.chevronRight(20)}</button>
        <span className="p-avatar p-avatar-sm" aria-hidden="true">{initials(thread.title.replace(/^استاد\s+/, ''))}</span>
        <span><b>{thread.title}</b><small>{thread.subtitle}</small></span>
      </header>
      <div className="p-chat-log" ref={log} role="log" aria-live="polite" aria-label="پیام‌ها" tabIndex={0}>
      <ol>
        {thread.messages.map((m, i) => {
          const d = new Date(m.at)
          const prev = thread.messages[i - 1]
          const newDay = !prev || !sameDay(new Date(prev.at), d)
          return (
            <li key={m.id} className={m.from === me ? 'mine' : 'theirs'}>
              {newDay && <span className="p-chat-day">{['امروز', 'دیروز'].includes(relativeDay(d, now)) ? relativeDay(d, now) : formatDate(d, false)}</span>}
              <p className="p-bubble">
                <span className="sr">{m.from === me ? 'شما:' : `${thread.title}:`}</span>
                {m.text}
                <time dateTime={m.at}>{formatTime(d)}{m.from === me && <span className="p-tick" aria-label={m.read ? 'خوانده شد' : 'ارسال شد'}>{m.read ? '✓✓' : '✓'}</span>}</time>
              </p>
            </li>
          )
        })}
      </ol>
      </div>
      <form className="p-composer" onSubmit={send}>
        <label className="sr" htmlFor="p-msg">پیام به {thread.title}</label>
        <textarea id="p-msg" ref={input} rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
          placeholder="پیام خود را بنویسید…" autoComplete="off" maxLength={1000} />
        <button type="submit" className="btn btn-primary p-send" aria-label="ارسال پیام" disabled={!text.trim()}>{Icon.send(20)}</button>
      </form>
    </>
  )
}
