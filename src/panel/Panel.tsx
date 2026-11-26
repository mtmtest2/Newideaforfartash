import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Logo, ThemeToggle } from '../components/Header'
import { fa } from '../lib/fa'
import { formatDay, relativeDay } from '../lib/jalali'
import { buildDemo, type Assignment, type Demo, type Ticket } from './data'
import { PanelContext, type PanelCtx } from './context'
import { getSession, signOut, useSession } from './session'
import { Icon, initials } from './ui'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Courses = lazy(() => import('./pages/Courses'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Recordings = lazy(() => import('./pages/Recordings'))
const Certificates = lazy(() => import('./pages/Certificates'))
const Payments = lazy(() => import('./pages/Payments'))
const Support = lazy(() => import('./pages/Support'))
const Profile = lazy(() => import('./pages/Profile'))

export const NAV = [
  { to: '/panel', label: 'داشبورد', icon: Icon.dashboard, end: true },
  { to: '/panel/courses', label: 'دوره‌های من', icon: Icon.courses },
  { to: '/panel/schedule', label: 'برنامهٔ کلاس‌ها', icon: Icon.calendar },
  { to: '/panel/assignments', label: 'تکالیف و آزمون‌ها', icon: Icon.tasks, badge: 'assignments' as const },
  { to: '/panel/recordings', label: 'جلسات ضبط‌شده', icon: Icon.video },
  { to: '/panel/certificates', label: 'گواهی‌ها', icon: Icon.award },
  { to: '/panel/payments', label: 'پرداخت‌ها', icon: Icon.wallet },
  { to: '/panel/support', label: 'پشتیبانی', icon: Icon.support },
  { to: '/panel/profile', label: 'پروفایل و تنظیمات', icon: Icon.user },
]
const TABS = ['/panel', '/panel/courses', '/panel/schedule', '/panel/assignments']

/** Skeleton shown while the session/data load (and in the prerendered HTML). */
const Skeleton = () => (
  <div className="p-skel" aria-busy="true" aria-label="در حال بارگذاری پنل">
    <div className="p-skel-hero" />
    <div className="p-skel-row"><div /><div /><div /><div /></div>
    <div className="p-skel-row p-skel-2"><div /><div /></div>
  </div>
)

export default function Panel() {
  const session = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [demo, setDemo] = useState<Demo | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [noticesRead, setNoticesRead] = useState(false)
  const [sheet, setSheet] = useState(false)

  // Client only: data depends on "now" and the session lives in localStorage.
  useEffect(() => {
    if (!getSession()) {
      navigate(`/login?next=${encodeURIComponent(pathname)}`, { replace: true })
      return
    }
    const d = buildDemo()
    setDemo(d); setAssignments(d.assignments); setTickets(d.tickets)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (demo && !session) navigate('/login', { replace: true }) }, [session, demo, navigate])
  useEffect(() => { setSheet(false); window.scrollTo({ top: 0 }) }, [pathname])

  const ctx = useMemo<PanelCtx | null>(() => (session && demo ? {
    session, demo, assignments, tickets,
    submitAssignment: (id) => setAssignments((as) => as.map((a) => (a.id === id ? { ...a, status: 'submitted' } : a))),
    addTicket: (t) => setTickets((ts) => [{ ...t, id: `T-${1040 + ts.length}`, date: new Date(), status: 'open' }, ...ts]),
    markNoticesRead: () => setNoticesRead(true),
  } : null), [session, demo, assignments, tickets])

  const pending = assignments.filter((a) => a.status === 'pending').length
  const current = NAV.find((n) => (n.end ? pathname.replace(/\/$/, '') === n.to : pathname.startsWith(n.to))) ?? NAV[0]

  useEffect(() => { document.title = `${current.label} | پنل فرتاش` }, [current.label])

  const logout = () => { signOut(); navigate('/', { replace: true }) }

  return (
    <div className="panel">
      <aside className="p-side" aria-label="منوی پنل">
        <div className="p-side-logo"><Logo small /></div>
        <div className="p-user">
          <span className="p-avatar" aria-hidden="true">{session ? initials(session.name) : ''}</span>
          <span><b>{session?.name ?? ' '}</b><small>زبان‌آموز</small></span>
        </div>
        <nav className="p-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
              {n.icon()}<span>{n.label}</span>
              {n.badge === 'assignments' && pending > 0 && <em aria-label={`${fa(pending)} مورد در انتظار`}>{fa(pending)}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="p-side-foot">
          <Link to="/">{Icon.home(20)}<span>بازگشت به سایت</span></Link>
          <button type="button" onClick={logout}>{Icon.logout(20)}<span>خروج از حساب</span></button>
        </div>
      </aside>

      <div className="p-main">
        <header className="p-top">
          <div className="p-top-logo"><Logo small /></div>
          <div className="p-top-title">
            <h1>{current.label}</h1>
            {demo && <p>{formatDay(demo.now)}</p>}
          </div>
          <div className="p-top-actions">
            {ctx && <Notifications ctx={ctx} read={noticesRead} />}
            <ThemeToggle />
            <Link to="/panel/profile" className="p-avatar p-avatar-sm" aria-label="پروفایل">{session ? initials(session.name) : ''}</Link>
          </div>
        </header>

        <main className="p-content" id="panel-content">
          {ctx ? (
            <PanelContext.Provider value={ctx}>
              <Suspense fallback={<Skeleton />}>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="assignments" element={<Assignments />} />
                  <Route path="recordings" element={<Recordings />} />
                  <Route path="certificates" element={<Certificates />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="support" element={<Support />} />
                  <Route path="profile" element={<Profile onLogout={logout} />} />
                  <Route path="*" element={<Navigate to="/panel" replace />} />
                </Routes>
              </Suspense>
            </PanelContext.Provider>
          ) : <Skeleton />}
        </main>
      </div>

      {/* phones: app-style tab bar + "more" sheet */}
      <nav className="p-tabbar" aria-label="منوی پنل">
        {NAV.filter((n) => TABS.includes(n.to)).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            {n.icon(24)}<span>{n.label.replace('برنامهٔ کلاس‌ها', 'برنامه').replace('تکالیف و آزمون‌ها', 'تکالیف').replace('دوره‌های من', 'دوره‌ها')}</span>
            {n.badge === 'assignments' && pending > 0 && <em aria-hidden="true">{fa(pending)}</em>}
          </NavLink>
        ))}
        <button type="button" className={!TABS.includes(current.to) ? 'on' : ''} onClick={() => setSheet(true)} aria-expanded={sheet} aria-controls="p-sheet">
          {Icon.more(24)}<span>بیشتر</span>
        </button>
      </nav>
      {sheet && (
        <div className="p-sheet-wrap" onClick={() => setSheet(false)}>
          <div className="p-sheet" id="p-sheet" role="dialog" aria-modal="true" aria-label="بخش‌های دیگر پنل" onClick={(e) => e.stopPropagation()}>
            <span className="p-sheet-grip" aria-hidden="true" />
            {NAV.filter((n) => !TABS.includes(n.to)).map((n) => <NavLink key={n.to} to={n.to}>{n.icon()}<span>{n.label}</span></NavLink>)}
            <Link to="/">{Icon.home()}<span>بازگشت به سایت</span></Link>
            <button type="button" onClick={logout}>{Icon.logout()}<span>خروج از حساب</span></button>
          </div>
        </div>
      )}
    </div>
  )
}

function Notifications({ ctx, read }: { ctx: PanelCtx; read: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = read ? 0 : ctx.demo.notices.filter((n) => n.unread).length
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  const icons = { class: Icon.live(18), assignment: Icon.tasks(18), payment: Icon.wallet(18), news: Icon.news(18) }
  return (
    <div className="p-notif" ref={ref}>
      <button type="button" className="icon-btn" aria-label={unread ? `اعلان‌ها، ${fa(unread)} اعلان خوانده‌نشده` : 'اعلان‌ها'} aria-expanded={open}
        onClick={() => { setOpen((o) => !o); ctx.markNoticesRead() }}>
        {Icon.bell(20)}{unread > 0 && <em aria-hidden="true">{fa(unread)}</em>}
      </button>
      {open && (
        <div className="p-notif-menu" role="region" aria-label="اعلان‌ها">
          <b className="p-notif-title">اعلان‌ها</b>
          <ul>
            {ctx.demo.notices.map((n) => (
              <li key={n.id} className={n.unread && !read ? 'unread' : ''}>
                <span className={`p-notif-ico k-${n.kind}`}>{icons[n.kind]}</span>
                <span><b>{n.title}</b><small>{n.text}</small><time>{relativeDay(n.date, ctx.demo.now)}</time></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
