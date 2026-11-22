import { useEffect, useState } from 'react'
import { Clipboard, Phone, Users } from './Icons'

const Home = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
)
const Book = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7" />
  </svg>
)

const ITEMS = [
  { id: 'home', label: 'خانه', icon: <Home /> },
  { id: 'steps', label: 'مسیر', icon: <Clipboard width={22} height={22} /> },
  { id: 'classes', label: 'کلاس‌ها', icon: <Users width={22} height={22} /> },
  { id: 'blog', label: 'مقالات', icon: <Book /> },
  { id: 'contact', label: 'تماس', icon: <Phone width={22} height={22} /> },
]

/** App-style tab bar shown on phones in place of the top menu. */
export default function BottomNav() {
  const [active, setActive] = useState('home')

  useEffect(() => {
    const els = [...ITEMS.map((i) => document.getElementById(i.id)), document.getElementById('intro')].filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const id = e.target.id === 'intro' ? 'classes' : e.target.id
          setActive(id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <nav className="bottom-nav" aria-label="منوی پایین">
      {ITEMS.map((it) => (
        <a key={it.id} href={`#${it.id}`} className={active === it.id ? 'on' : ''} aria-current={active === it.id ? 'true' : undefined}>
          <span className="bn-ico">{it.icon}</span>
          <span className="bn-label">{it.label}</span>
        </a>
      ))}
    </nav>
  )
}
