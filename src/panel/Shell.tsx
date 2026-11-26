// Layout shared by the student panel (/panel) and the teacher panel (/teacher): sidebar on desktop,
// app-style tab bar + "more" sheet on phones, sticky top bar with notifications and theme toggle.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo, ThemeToggle } from '../components/Header'
import { fa } from '../lib/fa'
import { formatDay, relativeDay } from '../lib/jalali'
import { Icon, initials } from './ui'

export type NavItem = { to: string; label: string; short?: string; icon: (s?: number) => ReactNode; end?: boolean; badge?: number }
export type NoticeItem = { id: string; kind: 'class' | 'assignment' | 'payment' | 'news' | 'message'; title: string; text: string; date: Date; href?: string }

/** Skeleton shown while the session/data load (and in the prerendered HTML). */
export const Skeleton = () => (
  <div className="p-skel" aria-busy="true" aria-label="در حال بارگذاری پنل">
    <div className="p-skel-hero" />
    <div className="p-skel-row"><div /><div /><div /><div /></div>
    <div className="p-skel-row p-skel-2"><div /><div /></div>
  </div>
)

type Props = {
  nav: NavItem[]
  /** paths shown in the phone tab bar (the rest go into the "more" sheet) */
  tabs: string[]
  user: { name: string; role: string } | null
  profileHref: string
  appName: string
  notices: NoticeItem[] | null
  noticeKey: string
  now: Date | null
  onLogout: () => void
  children: ReactNode
}

export default function Shell({ nav, tabs, user, profileHref, appName, notices, noticeKey, now, onLogout, children }: Props) {
  const { pathname } = useLocation()
  const [sheet, setSheet] = useState(false)
  const moreBtn = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const current = nav.find((n) => (n.end ? pathname.replace(/\/$/, '') === n.to : pathname.startsWith(n.to))) ?? nav[0]
  const tabItems = nav.filter((n) => tabs.includes(n.to))
  const moreItems = nav.filter((n) => !tabs.includes(n.to))
  const moreBadge = moreItems.some((n) => n.badge)

  useEffect(() => { document.title = `${current.label} | ${appName}` }, [current.label, appName])
  useEffect(() => { setSheet(false); window.scrollTo({ top: 0 }) }, [pathname])
  useEffect(() => {
    if (!sheet) return
    sheetRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSheet(false); moreBtn.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheet])

  const badge = (n?: number, hidden = false) => (n ? <em aria-hidden={hidden || undefined} aria-label={hidden ? undefined : `${fa(n)} مورد تازه`}>{fa(n)}</em> : null)

  return (
    <div className="panel">
      <aside className="p-side" aria-label="منوی پنل">
        <div className="p-side-logo"><Logo small /></div>
        <div className="p-user">
          <span className="p-avatar" aria-hidden="true">{user ? initials(user.name) : ''}</span>
          <span><b>{user?.name ?? ' '}</b><small>{user?.role ?? ' '}</small></span>
        </div>
        <nav className="p-nav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
              {n.icon()}<span>{n.label}</span>{badge(n.badge)}
            </NavLink>
          ))}
        </nav>
        <div className="p-side-foot">
          <Link to="/">{Icon.home(20)}<span>بازگشت به سایت</span></Link>
          <button type="button" onClick={onLogout}>{Icon.logout(20)}<span>خروج از حساب</span></button>
        </div>
      </aside>

      <div className="p-main">
        <header className="p-top">
          <div className="p-top-logo"><Logo small /></div>
          <div className="p-top-title">
            <h1>{current.label}</h1>
            {now && <p>{formatDay(now)}</p>}
          </div>
          <div className="p-top-actions">
            {notices && now && <Notifications items={notices} storageKey={noticeKey} now={now} />}
            <ThemeToggle />
            <Link to={profileHref} className="p-avatar p-avatar-sm" aria-label="پروفایل">{user ? initials(user.name) : ''}</Link>
          </div>
        </header>
        <main className="p-content" id="panel-content">{children}</main>
      </div>

      <nav className="p-tabbar" aria-label="منوی پنل">
        {tabItems.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            {n.icon(24)}<span>{n.short ?? n.label}</span>{badge(n.badge, true)}
          </NavLink>
        ))}
        <button ref={moreBtn} type="button" className={!tabs.includes(current.to) ? 'on' : ''} onClick={() => setSheet(true)} aria-expanded={sheet} aria-controls="p-sheet">
          {Icon.more(24)}<span>بیشتر</span>{moreBadge && <i className="p-tab-dot" aria-hidden="true" />}
        </button>
      </nav>
      {sheet && (
        <div className="p-sheet-wrap" onClick={() => setSheet(false)}>
          <div ref={sheetRef} className="p-sheet" id="p-sheet" role="dialog" aria-modal="true" aria-label="بخش‌های دیگر پنل" onClick={(e) => e.stopPropagation()}>
            <span className="p-sheet-grip" aria-hidden="true" />
            {moreItems.map((n) => <NavLink key={n.to} to={n.to}>{n.icon()}<span>{n.label}</span>{badge(n.badge)}</NavLink>)}
            <Link to="/">{Icon.home()}<span>بازگشت به سایت</span></Link>
            <button type="button" onClick={onLogout}>{Icon.logout()}<span>خروج از حساب</span></button>
          </div>
        </div>
      )}
    </div>
  )
}

const KIND_ICON = { class: Icon.live, assignment: Icon.tasks, payment: Icon.wallet, news: Icon.news, message: Icon.chat }

/** Bell + dropdown. An item is unread when it is newer than the last time the list was opened. */
function Notifications({ items, storageKey, now }: { items: NoticeItem[]; storageKey: string; now: Date }) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(() => { try { return Number(localStorage.getItem(storageKey)) || 0 } catch { return 0 } })
  const ref = useRef<HTMLDivElement>(null)
  const sorted = [...items].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8)
  const unread = sorted.filter((n) => n.date.getTime() > seen).length
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  const toggle = () => {
    setOpen((o) => !o)
    if (!open) {
      const t = Date.now()
      window.setTimeout(() => { setSeen(t); try { localStorage.setItem(storageKey, String(t)) } catch { /* ignore */ } }, 1500)
    }
  }
  return (
    <div className="p-notif" ref={ref}>
      <button type="button" className="icon-btn" aria-label={unread ? `اعلان‌ها، ${fa(unread)} اعلان تازه` : 'اعلان‌ها'} aria-expanded={open} onClick={toggle}>
        {Icon.bell(20)}{unread > 0 && <em aria-hidden="true">{fa(unread)}</em>}
      </button>
      {open && (
        <div className="p-notif-menu" role="region" aria-label="اعلان‌ها">
          <b className="p-notif-title">اعلان‌ها</b>
          {sorted.length ? (
            <ul>
              {sorted.map((n) => {
                const body = <><span className={`p-notif-ico k-${n.kind}`}>{KIND_ICON[n.kind](18)}</span>
                  <span><b>{n.title}</b><small>{n.text}</small><time>{relativeDay(n.date, now)}</time></span></>
                return (
                  <li key={n.id} className={n.date.getTime() > seen ? 'unread' : ''}>
                    {n.href ? <Link to={n.href} onClick={() => setOpen(false)}>{body}</Link> : <div>{body}</div>}
                  </li>
                )
              })}
            </ul>
          ) : <p className="p-muted">اعلان تازه‌ای ندارید.</p>}
        </div>
      )}
    </div>
  )
}
