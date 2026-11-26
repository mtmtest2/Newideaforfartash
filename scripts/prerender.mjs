// Build step: render every route to static HTML so content (and the hero image) is in the page
// before any JavaScript runs. Run after `vite build` and `vite build --ssr`.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import Beasties from 'beasties'

const SITE = (process.env.SITE_URL || 'https://mrmdev.xyz').replace(/\/$/, '')
const dist = path.resolve('dist')
const { render, THEME_PRELOADS, CONTACT } = await import(pathToFileURL(path.resolve('dist-server/entry-server.js')).href)
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const ROUTES = [
  { url: '/', title: 'فرتاش | آموزشگاه آنلاین زبان', description: 'کلاس‌های زنده و دوره‌های آفلاین زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با اساتید مجرب فرتاش. تعیین سطح رایگان.' },
  { url: '/teachers', title: 'همهٔ اساتید فرتاش', description: 'آشنایی با اساتید زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی در آموزشگاه آنلاین فرتاش.' },
  { url: '/blog', title: 'همهٔ مقالات | فرتاش', description: 'مقالات کاربردی و به‌روز فرتاش برای یادگیری بهتر زبان: مکالمه، گرامر، ابزارها و عادت‌های یادگیری.' },
  { url: '/placement', title: 'تعیین سطح رایگان | فرتاش', description: 'پیش از شروع کلاس، سطح زبانتان را رایگان بسنجید تا در کلاس مناسب خودتان قرار بگیرید.' },
  { url: '/login', title: 'ورود / عضویت | فرتاش', description: 'ورود یا ساخت حساب کاربری در آموزشگاه آنلاین فرتاش.', noindex: true },
  // Student panel: private, so noindex and not in the sitemap. Prerendered as a skeleton (data is client-only).
  ...[['', 'داشبورد'], ['/courses', 'دوره‌های من'], ['/schedule', 'برنامهٔ کلاس‌ها'], ['/assignments', 'تکالیف و آزمون‌ها'], ['/messages', 'پیام به استاد'],
    ['/recordings', 'جلسات ضبط‌شده'], ['/certificates', 'گواهی‌ها'], ['/payments', 'پرداخت‌ها'], ['/support', 'پشتیبانی'], ['/profile', 'پروفایل و تنظیمات']]
    .map(([p, t]) => ({ url: '/panel' + p, title: `${t} | پنل فرتاش`, description: 'پنل زبان‌آموزان فرتاش.', noindex: true })),
  // Teacher panel: same treatment.
  ...[['', 'پیشخوان'], ['/classes', 'کلاس‌های من'], ['/schedule', 'برنامهٔ تدریس'], ['/assignments', 'تکالیف و نمره‌دهی'],
    ['/attendance', 'حضور و غیاب'], ['/messages', 'پیام‌ها'], ['/profile', 'پروفایل و تنظیمات']]
    .map(([p, t]) => ({ url: '/teacher' + p, title: `${t} | پنل استاد فرتاش`, description: 'پنل اساتید فرتاش.', noindex: true })),
]

// Inline (in the theme script, which already knows the theme before first paint): preload the active
// theme's logo on every page and its hero on the home page, with the same srcset/sizes as the <img>.
const preloadJs = (isHome) => `var P=${JSON.stringify({ logo: THEME_PRELOADS.logo, hero: isHome ? THEME_PRELOADS.hero : null })};` +
  `var pl=function(o){var l=document.createElement('link');l.rel='preload';l.as='image';l.fetchPriority='high';` +
  `if(typeof o==='string'){l.href=o}else{l.setAttribute('imagesrcset',o.srcset);l.setAttribute('imagesizes',o.sizes)}document.head.appendChild(l)};` +
  `pl(P.logo[t]);if(P.hero)pl(P.hero[t]);`

// Preload the Vazirmatn subsets so they download alongside the CSS instead of after CSS + layout
// (HTML -> CSS -> font chain).
// Both subsets are needed for first paint: the Arabic-script subset has no space or basic punctuation, which
// come from the Latin subset. (latin-ext is only used for rare characters and stays on-demand.)
const assetFiles = fs.readdirSync(path.join(dist, 'assets'))
const fontFiles = ['arabic', 'latin'].map((sub) => assetFiles.find((f) => new RegExp(`^vazirmatn-${sub}-wght-normal-.*\\.woff2$`).test(f)))
if (fontFiles.some((f) => !f)) throw new Error('Vazirmatn woff2 files not found in dist/assets')
const fontPreload = fontFiles.map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`).join('\n    ')

// The font family is applied through var(--font), which beasties can't trace, so it would leave every
// @font-face in the async stylesheet and the first paint would use a fallback font. Inline them (unicode-range
// still makes the browser fetch only the subsets a page uses).
const cssFile = fs.readdirSync(path.join(dist, 'assets')).find((f) => /^index-.*\.css$/.test(f))
const fontFaces = (fs.readFileSync(path.join(dist, 'assets', cssFile), 'utf8').match(/@font-face\{[^}]*\}/g) || [])
  .map((r) => r.replace(/url\((['"]?)(?:\.\/|\/assets\/|assets\/)?([^)'"]+\.woff2)\1\)/g, 'url(/assets/$2)'))
  .join('')
if (!fontFaces.includes('vazirmatn-arabic')) throw new Error('could not extract @font-face rules')

// Critical CSS: inline the rules each prerendered page needs for first paint and load the full stylesheet
// without blocking render. Theme rules are always kept because data-theme is set at runtime.
const beasties = new Beasties({
  path: dist,
  publicPath: '/',
  preload: 'swap',
  noscriptFallback: true,
  inlineFonts: true,
  preloadFonts: false,
  keyframes: 'critical',
  allowRules: [/data-theme/, /theme-anim/, /prefers-reduced-motion/],
  logLevel: 'warn',
})

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

for (const r of ROUTES) {
  // React 19 hoists a <link rel=preload as=image> for every eager <img>, which would fetch both theme
  // variants (logos, hero people) at high priority. Drop them; the page declares its own preloads.
  const app = (await render(r.url)).replace(/<link rel="preload" as="image"[^>]*\/>/g, '')
  const canonical = SITE + r.url
  const head = [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    r.noindex ? '<meta name="robots" content="noindex" />' : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="fa_IR" />`,
    `<meta property="og:site_name" content="فرتاش" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    fontPreload,
    r.url === '/' ? `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'فرتاش',
      alternateName: 'آموزشگاه آنلاین زبان فرتاش',
      url: SITE + '/',
      telephone: '+98' + CONTACT.phone.replace(/^0/, ''),
      address: { '@type': 'PostalAddress', streetAddress: CONTACT.address.replace(/^مشهد، /, ''), addressLocality: 'مشهد', addressCountry: 'IR' },
    })}</script>` : '',
  ].filter(Boolean).join('\n    ')
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('<!--head-->', head)
    .replace('/*__THEME_PRELOADS__*/', preloadJs(r.url === '/'))
    .replace('<div id="root"></div>', `<div id="root" data-route="${r.url}">${app}</div>`)
  if (!html.includes(app)) throw new Error('root placeholder not found in dist/index.html')
  html = await beasties.process(html)
  // Added after beasties so it isn't merged with the critical <style> (noscript content is ignored with JS on).
  html = html.replace('</head>', `<style>${fontFaces}</style>\n</head>`)
  html = html.replace('</head>', '<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>\n</head>')
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

fs.rmSync('dist-server', { recursive: true, force: true })
