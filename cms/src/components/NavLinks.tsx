import Link from 'next/link'
/* Extra nav entries: custom views and the public site. */
export function NavLinks() {
  const site = (process.env.SITE_URL || '').replace(/\/$/, '')
  return (
    <div className="fx-navlinks">
      <span className="fx-navlinks-title">پایش و ابزارها</span>
      <Link href="/support/monitoring" className="nav__link">وضعیت سامانه و عیب‌یابی</Link>
      {site && <a href={site} target="_blank" rel="noopener" className="nav__link">مشاهدهٔ سایت ↗</a>}
    </div>
  )
}
