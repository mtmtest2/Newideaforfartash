// Build step: render every route to static HTML so content (and the hero image) is in the page
// before any JavaScript runs. Run after `vite build` and `vite build --ssr`.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SITE = (process.env.SITE_URL || 'https://mrmdev.xyz').replace(/\/$/, '')
const dist = path.resolve('dist')
const { render, THEME_PRELOADS } = await import(pathToFileURL(path.resolve('dist-server/entry-server.js')).href)
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const ROUTES = [
  { url: '/', title: 'فرتاش | آموزشگاه آنلاین زبان', description: 'کلاس‌های زنده و دوره‌های آفلاین زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با اساتید مجرب فرتاش. تعیین سطح رایگان.' },
  { url: '/teachers', title: 'همهٔ اساتید فرتاش | فرتاش', description: 'آشنایی با اساتید زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی در آموزشگاه آنلاین فرتاش.' },
  { url: '/blog', title: 'همهٔ مقالات | فرتاش', description: 'مقالات کاربردی و به‌روز فرتاش برای یادگیری بهتر زبان: مکالمه، گرامر، ابزارها و عادت‌های یادگیری.' },
  { url: '/placement', title: 'تعیین سطح رایگان | فرتاش', description: 'پیش از شروع کلاس، سطح زبانتان را رایگان بسنجید تا در کلاس مناسب خودتان قرار بگیرید.' },
  { url: '/login', title: 'ورود / عضویت | فرتاش', description: 'ورود یا ساخت حساب کاربری در آموزشگاه آنلاین فرتاش.', noindex: true },
]

// Inline (in the theme script, which already knows the theme before first paint): preload the active
// theme's logo on every page and its hero on the home page, with the same srcset/sizes as the <img>.
const preloadJs = (isHome) => `var P=${JSON.stringify({ logo: THEME_PRELOADS.logo, hero: isHome ? THEME_PRELOADS.hero : null })};` +
  `var pl=function(o){var l=document.createElement('link');l.rel='preload';l.as='image';l.fetchPriority='high';` +
  `if(typeof o==='string'){l.href=o}else{l.setAttribute('imagesrcset',o.srcset);l.setAttribute('imagesizes',o.sizes)}document.head.appendChild(l)};` +
  `pl(P.logo[t]);if(P.hero)pl(P.hero[t]);`

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
  ].filter(Boolean).join('\n    ')
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('<!--head-->', head)
    .replace('/*__THEME_PRELOADS__*/', preloadJs(r.url === '/'))
    .replace('<div id="root"></div>', `<div id="root" data-route="${r.url}">${app}</div>`)
  if (!html.includes(app)) throw new Error('root placeholder not found in dist/index.html')
  const out = r.url === '/' ? path.join(dist, 'index.html') : path.join(dist, r.url.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
  console.log(`prerendered ${r.url} -> ${path.relative(dist, out)} (${Math.round(html.length / 1024)} KiB)`)
}
fs.rmSync('dist-server', { recursive: true, force: true })
