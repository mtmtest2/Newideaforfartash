import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

/* Outline icons drawn on one grid (24px, 1.7 stroke, round caps) to match the app-style tab bar. */
const Ico = ({ children }: { children: ReactNode }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)
const HomeIco = () => (
  <Ico>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2.2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
  </Ico>
)
const PathIco = () => (
  <Ico><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></Ico>
)
const TeachersIco = () => (
  <Ico><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7h6" /></Ico>
)
const BlogIco = () => (
  <Ico><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></Ico>
)
const SupportIco = () => (
  <Ico><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z" /></Ico>
)

const ITEMS = [
  { id: 'home', to: '/#home', label: 'خانه', icon: <HomeIco /> },
  { id: 'steps', to: '/#steps', label: 'مسیر یادگیری', icon: <PathIco /> },
  { id: 'classes', to: '/teachers', label: 'اساتید', icon: <TeachersIco /> },
  { id: 'blog', to: '/blog', label: 'مقالات', icon: <BlogIco /> },
  { id: 'contact', to: '/#contact', label: 'پشتیبانی', icon: <SupportIco /> },
]
const PAGE_ACTIVE: Record<string, string> = { '/teachers': 'classes', '/blog': 'blog', '/placement': 'steps' }

/** App-style tab bar on phones: the top menu moves here, icon above label. */
export default function BottomNav() {
  const { pathname } = useLocation()
  const [spy, setSpy] = useState('home')
  const active = PAGE_ACTIVE[pathname] ?? spy

  // On the home page, highlight the section in view.
  useEffect(() => {
    if (pathname !== '/') return
    const ids = ['home', 'steps', 'intro', 'classes', 'blog', 'contact']
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setSpy(e.target.id === 'intro' ? 'steps' : e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])

  return (
    <nav className="bottom-nav" aria-label="منوی اصلی">
      {ITEMS.map((it) => (
        <Link key={it.id} to={it.to} className={active === it.id ? 'on' : ''} aria-current={active === it.id ? 'page' : undefined}>
          {it.icon}
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  )
}
