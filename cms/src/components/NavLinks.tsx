import Link from 'next/link'
/* Extra nav entries for custom views (System Monitoring). */
export function NavLinks() {
  return (
    <div className="fx-navlinks">
      <span className="fx-navlinks-title">پایش و ابزارها</span>
      <Link href="/support/monitoring" className="nav__link">وضعیت سامانه و ابزارهای عیب‌یابی</Link>
    </div>
  )
}
