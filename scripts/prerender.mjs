// Build step: render every route to static HTML so content (and the hero image) is in the page
// before any JavaScript runs. Run after `vite build` and `vite build --ssr`.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createPageBuilder } from './page.mjs'

const SITE = (process.env.SITE_URL || 'https://mrmdev.xyz').replace(/\/$/, '')
const dist = path.resolve('dist')
const { render, THEME_PRELOADS, CONTACT } = await import(pathToFileURL(path.resolve('dist-server/entry-server.js')).href)

const ROUTES = [
  { url: '/', title: 'فرتاش | آموزشگاه آنلاین زبان', description: 'کلاس‌های زنده و دوره‌های آفلاین زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با اساتید مجرب فرتاش. تعیین سطح رایگان.' },
  { url: '/teachers', title: 'همهٔ اساتید فرتاش', description: 'آشنایی با اساتید زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی در آموزشگاه آنلاین فرتاش.' },
  { url: '/magazine', title: 'همهٔ مقالات | فرتاش', description: 'مقالات کاربردی و به‌روز فرتاش برای یادگیری بهتر زبان: مکالمه، گرامر، ابزارها و عادت‌های یادگیری.' },
  { url: '/placement', title: 'تعیین سطح رایگان | فرتاش', description: 'پیش از شروع کلاس، سطح زبانتان را رایگان بسنجید تا در کلاس مناسب خودتان قرار بگیرید.' },
  { url: '/login', title: 'ورود | فرتاش', description: 'ورود به حساب کاربری در آموزشگاه آنلاین فرتاش.', noindex: true },
  { url: '/register', title: 'عضویت | فرتاش', description: 'ساخت حساب کاربری در آموزشگاه آنلاین فرتاش.', noindex: true },
  { url: '/staff/login', title: 'ورود کارکنان | فرتاش', description: 'ورود اساتید و کارکنان فرتاش.', noindex: true },
  ...[['teacher', 'ورود اساتید'], ['reception', 'ورود پذیرش'], ['supervisor', 'ورود سوپروایزر'], ['support', 'ورود پشتیبانی'], ['owner', 'ورود مالک']]
    .map(([r, t]) => ({ url: `/staff/login/${r}`, title: `${t} | فرتاش`, description: `${t} فرتاش.`, noindex: true })),
  // Student panel: private, so noindex and not in the sitemap. Prerendered as a skeleton (data is client-only).
  ...[['', 'داشبورد'], ['/courses', 'دوره‌های من'], ['/schedule', 'برنامهٔ کلاس‌ها'], ['/assignments', 'تکالیف و آزمون‌ها'], ['/messages', 'گروه‌های کلاس'],
    ['/recordings', 'جلسات ضبط‌شده'], ['/certificates', 'گواهی‌ها'], ['/payments', 'پرداخت‌ها'], ['/support', 'پشتیبانی'], ['/profile', 'پروفایل و تنظیمات']]
    .map(([p, t]) => ({ url: '/panel' + p, title: `${t} | پنل فرتاش`, description: 'پنل زبان‌آموزان فرتاش.', noindex: true })),
  // Teacher panel: same treatment.
  ...[['', 'پیشخوان'], ['/classes', 'کلاس‌های من'], ['/schedule', 'برنامهٔ تدریس'], ['/assignments', 'تکالیف و نمره‌دهی'],
    ['/attendance', 'حضور و غیاب'], ['/messages', 'گروه‌های کلاس'], ['/profile', 'پروفایل و تنظیمات']]
    .map(([p, t]) => ({ url: '/teacher' + p, title: `${t} | پنل استاد فرتاش`, description: 'پنل اساتید فرتاش.', noindex: true })),
  // Reception panel: same treatment.
  ...[['', 'پیشخوان'], ['/classes', 'همهٔ کلاس‌ها'], ['/groups', 'گروه‌های کلاس']]
    .map(([p, t]) => ({ url: '/reception' + p, title: `${t} | پنل پذیرش فرتاش`, description: 'پنل پذیرش فرتاش.', noindex: true })),
  // Owner / support / supervisor dashboards: skeletons only, the server checks the role before sending them.
  ...[['/owner', 'داشبورد مالک'], ['/support-desk', 'داشبورد پشتیبانی'], ['/supervisor', 'داشبورد سوپروایزر']]
    .map(([u, t]) => ({ url: u, title: `${t} | فرتاش`, description: `${t} فرتاش.`, noindex: true })),
]

// keep the untouched client template for the runtime server (server/index.mjs) before index.html is overwritten
if (!fs.existsSync(path.join(dist, 'index.template.html'))) fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, 'index.template.html'))
const buildPage = createPageBuilder({ dist, THEME_PRELOADS })
const orgLd = {
  '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'فرتاش', alternateName: 'آموزشگاه آنلاین زبان فرتاش', url: SITE + '/',
  telephone: '+98' + CONTACT.phone.replace(/^0/, ''),
  address: { '@type': 'PostalAddress', streetAddress: CONTACT.address.replace(/^مشهد، /, ''), addressLocality: 'مشهد', addressCountry: 'IR' },
}

for (const r of ROUTES) {
  // Static fallback pages carry no embedded content: the client then uses the built-in content (src/content/fallback.ts).
  const html = await buildPage({ url: r.url, route: r.url, app: await render(r.url), title: r.title, description: r.description,
    canonical: SITE + r.url, noindex: r.noindex, jsonLd: r.url === '/' ? [orgLd] : [], payload: null })
  const out = r.url === '/' ? path.join(dist, 'index.html') : path.join(dist, r.url.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
  console.log(`prerendered ${r.url} -> ${path.relative(dist, out)} (${Math.round(html.length / 1024)} KiB)`)
}
// robots.txt + sitemap.xml (without them the server's SPA fallback answered /robots.txt with HTML,
// which crawlers and Lighthouse reported as an invalid robots.txt)
const today = new Date().toISOString().slice(0, 10)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ROUTES.filter((r) => !r.noindex).map((r) => `  <url><loc>${SITE}${r.url}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n')
console.log('wrote robots.txt, sitemap.xml')

// dist-server/ is kept: the runtime content server (server/index.mjs) renders with it.
