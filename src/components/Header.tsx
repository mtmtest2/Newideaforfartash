import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, User } from './Icons'
import { useTheme } from '../lib/hooks'

const NAV = [
  { href: '/#home', label: 'خانه' },
  { href: '/#steps', label: 'مسیر یادگیری' },
  { href: '/teachers', label: 'اساتید' },
  { href: '/blog', label: 'مقالات' },
  { href: '/#contact', label: 'تماس با ما' },
]

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className={`logo${small ? ' logo-sm' : ''}`} aria-label="فرتاش، صفحهٔ اصلی">
      <img className="logo-day" src="/img/logo-day.png" alt="فرتاش" />
      <img className="logo-night" src="/img/logo-night.png" alt="" aria-hidden="true" />
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
  const [scrolled, setScrolled] = useState(false)
  const { pathname, hash } = useLocation()
  const current = pathname === '/' ? `/${hash || '#home'}` : pathname

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container header-in">
        <Logo />
        <nav className="nav" aria-label="منوی اصلی">
          {NAV.map((n) => (
            <Link key={n.href} to={n.href} className={n.href === current ? 'active' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link to="/login" className="btn btn-primary btn-sm login-btn">
            <User width={18} height={18} />
            <span>ورود / عضویت</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
