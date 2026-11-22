import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Close, Menu, Moon, Sun, User } from './Icons'
import { useTheme } from '../lib/hooks'

const NAV = [
  { href: '/#home', label: 'خانه' },
  { href: '/#classes', label: 'کلاس‌ها' },
  { href: '/#steps', label: 'مسیر یادگیری' },
  { href: '/#blog', label: 'مقالات' },
  { href: '/#contact', label: 'تماس با ما' },
]

export function Logo({ height = 44 }: { height?: number }) {
  return (
    <Link to="/" className="logo" aria-label="فرتاش، صفحهٔ اصلی">
      <img className="logo-day" src="/img/logo-day.png" alt="فرتاش" style={{ height }} />
      <img className="logo-night" src="/img/logo-night.png" alt="" aria-hidden="true" style={{ height }} />
    </Link>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      aria-pressed={dark}
      title={dark ? 'حالت روز' : 'حالت شب'}
    >
      <span className="tt-icon" data-on={!dark}><Moon /></span>
      <span className="tt-icon" data-on={dark}><Sun /></span>
    </button>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container header-in">
        <Logo />
        <nav className={`nav${open ? ' open' : ''}`} aria-label="منوی اصلی">
          {NAV.map((n, i) => (
            <a key={n.href} href={n.href} className={i === 0 ? 'active' : ''} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <Link to="/login" className="btn btn-primary btn-sm login-btn">
            <User width={18} height={18} />
            <span>ورود / عضویت</span>
          </Link>
          <ThemeToggle />
          <button type="button" className="icon-btn menu-btn" aria-label={open ? 'بستن منو' : 'باز کردن منو'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  )
}
