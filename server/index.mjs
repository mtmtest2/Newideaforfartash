// Fartash web server: serves the built Vite app and renders public pages with live content from the CMS.
// - Same React components and page pipeline as the build-time prerender (scripts/page.mjs) → identical markup/design.
// - Content changes need no rebuild/redeploy: pages are rendered on request and cached in memory; the CMS calls
//   POST /__revalidate after every change, and entries also expire after CACHE_TTL seconds.
// - The browser never talks to the CMS: client-side navigation reads /__data (this server adds the secret key).
// - If the CMS is unreachable, the last good page is served (stale), else the built-in content (src/content/fallback.ts).
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createPageBuilder, esc } from '../scripts/page.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const PORT = Number(process.env.PORT || 3000)
const SITE = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '')
const CMS = (process.env.CMS_INTERNAL_URL || '').replace(/\/$/, '')
const SECRET = process.env.CONTENT_API_SECRET || ''
const TTL = Number(process.env.CACHE_TTL || 300) * 1000

const { createAuth, PROTECTED } = await import('./auth.mjs')
const { render, THEME_PRELOADS, CONTACT, resourceFor, routeKey } = await import(pathToFileURL(path.join(root, 'dist-server/entry-server.js')).href)
const buildPage = createPageBuilder({ dist, THEME_PRELOADS })
const auth = createAuth({ SITE, CMS, SECRET, log: (...a) => console.log(new Date().toISOString(), ...a) })

/* ---------------- CMS client ---------------- */
async function cms(resource) {
  if (!CMS) return { status: 0, data: undefined }
  const res = await fetch(`${CMS}/api/public${resource}`, { headers: { authorization: `Bearer ${SECRET}`, accept: 'application/json' }, signal: AbortSignal.timeout(6000) })
  if (res.status === 404) return { status: 404, data: null }
  if (!res.ok) throw new Error(`CMS ${resource} -> HTTP ${res.status}`)
  return { status: 200, data: await res.json() }
}

/* ---------------- cache ---------------- */
const cache = new Map() // key -> { at, status, body, type }
const memo = new Map() // small JSON lookups (site chrome, redirects, sitemap)
async function memoized(key, ms, fn) {
  const hit = memo.get(key)
  if (hit && Date.now() - hit.at < ms) return hit.v
  try { const v = await fn(); memo.set(key, { at: Date.now(), v }); return v } catch (e) { if (hit) return hit.v; throw e }
}
const clearAll = () => { cache.clear(); memo.clear() }

/* ---------------- route data + head ---------------- */
const STATIC_META = {
  '/': { title: 'فرتاش | آموزشگاه آنلاین زبان', description: 'کلاس‌های زنده و دوره‌های آفلاین زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با اساتید مجرب فرتاش. تعیین سطح رایگان.' },
  '/teachers': { title: 'همهٔ اساتید فرتاش', description: 'آشنایی با اساتید زبان انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی در آموزشگاه آنلاین فرتاش.' },
  '/magazine': { title: 'مجلهٔ آموزشی | فرتاش', description: 'مقالات کاربردی و به‌روز فرتاش برای یادگیری بهتر زبان: مکالمه، گرامر، ابزارها و عادت‌های یادگیری.' },
  '/events': { title: 'کارگاه‌ها و رویدادها | فرتاش', description: 'کارگاه‌ها، وبینارها و جلسه‌های ویژهٔ آموزشگاه آنلاین زبان فرتاش.' },
  '/courses': { title: 'دوره‌های آفلاین | فرتاش', description: 'دوره‌های ضبط‌شدهٔ فرتاش؛ هر زمان که خواستید یاد بگیرید.' },
  '/placement': { title: 'تعیین سطح رایگان | فرتاش', description: 'پیش از شروع کلاس، سطح زبانتان را رایگان بسنجید تا در کلاس مناسب خودتان قرار بگیرید.' },
  '/login': { title: 'ورود / عضویت | فرتاش', description: 'ورود یا ساخت حساب کاربری در آموزشگاه آنلاین فرتاش.', noindex: true },
}
const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + url })) })
const org = (site) => ({
  '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'فرتاش', alternateName: site.settings.name, url: SITE + '/',
  ...(site.settings.contact.phone ? { telephone: '+98' + site.settings.contact.phone.replace(/^0/, '') } : {}),
  ...(site.settings.contact.address ? { address: { '@type': 'PostalAddress', streetAddress: site.settings.contact.address.replace(/^مشهد، /, ''), addressLocality: 'مشهد', addressCountry: 'IR' } } : {}),
  ...(Object.values(site.settings.social).length ? { sameAs: Object.values(site.settings.social) } : {}),
})

function meta(pathname, resource, data, site) {
  const suffix = site.settings.seo.titleSuffix || ' | فرتاش'
  const base = STATIC_META[pathname] ?? null
  const canonical = SITE + pathname
  if (base) return { ...base, canonical, image: site.settings.seo.image, jsonLd: pathname === '/' ? [org(site)] : [] }
  if (!data || !resource) return { title: `صفحه پیدا نشد${suffix}`, description: '', canonical, noindex: true, jsonLd: [] }
  const seo = data.seo ?? {}
  const t = (seo.title || data.title || data.name) + suffix
  const m = { title: t, description: seo.description || data.excerpt || data.intro || data.text || '', canonical: seo.canonical || canonical, noindex: !!seo.noindex,
    image: seo.image || data.cover?.src || data.poster?.src || data.photo?.src || data.image?.src || site.settings.seo.image, ogTitle: seo.ogTitle, ogDescription: seo.ogDescription, jsonLd: [] }
  const [, kind] = resource.split('/')
  if (kind === 'articles') {
    m.type = 'article'
    m.jsonLd = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: data.title, description: m.description, image: m.image || undefined,
      datePublished: data.publishedAt || undefined, dateModified: data.updatedAt, mainEntityOfPage: canonical, inLanguage: 'fa-IR',
      author: data.author ? { '@type': 'Person', name: data.author.name } : { '@type': 'Organization', name: 'فرتاش' },
      publisher: { '@type': 'Organization', name: 'فرتاش', url: SITE } }, crumbs([['خانه', '/'], ['مجله', '/magazine'], [data.title, pathname]])]
  } else if (kind === 'teachers') {
    m.type = 'profile'
    m.jsonLd = [{ '@context': 'https://schema.org', '@type': 'Person', name: data.name, jobTitle: data.title, image: data.photo?.src || undefined, url: canonical,
      knowsLanguage: (data.languages || []).map((l) => l.name), worksFor: { '@type': 'EducationalOrganization', name: 'فرتاش', url: SITE } },
      crumbs([['خانه', '/'], ['اساتید', '/teachers'], [data.name, pathname]])]
  } else if (kind === 'events') {
    m.jsonLd = [{ '@context': 'https://schema.org', '@type': 'Event', name: data.title, description: m.description, startDate: data.startsAt, endDate: data.endsAt,
      image: data.poster?.src || undefined, eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: data.format === 'online' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      location: data.format === 'online' ? { '@type': 'VirtualLocation', url: canonical } : { '@type': 'Place', name: data.venue || 'فرتاش', address: site.settings.contact.address || 'مشهد' },
      organizer: { '@type': 'Organization', name: 'فرتاش', url: SITE },
      ...(data.price != null ? { offers: { '@type': 'Offer', price: data.price, priceCurrency: 'IRR', url: canonical } } : {}) },
      crumbs([['خانه', '/'], ['رویدادها', '/events'], [data.title, pathname]])]
  } else if (kind === 'courses') {
    m.jsonLd = [{ '@context': 'https://schema.org', '@type': 'Course', name: data.title, description: m.description, inLanguage: 'fa-IR',
      provider: { '@type': 'EducationalOrganization', name: 'فرتاش', url: SITE } }, crumbs([['خانه', '/'], ['دوره‌های آفلاین', '/courses'], [data.title, pathname]])]
  } else if (kind === 'languages') {
    m.jsonLd = [crumbs([['خانه', '/'], [data.name, pathname]])]
  } else if (kind === 'pages') {
    const faq = (data.blocks || []).filter((b) => b.type === 'faq').flatMap((b) => b.items)
    m.jsonLd = faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []
  }
  return m
}

/** Loads the site chrome + route data. Returns { site, data, status } (status 404 when the CMS has no such content). */
async function loadRoute(pathname, search) {
  const resource = resourceFor(pathname, search)
  if (resource === '/home') {
    const r = await cms('/home')
    if (r.status === 0) return { site: null, data: undefined, status: 200, resource }
    const { nav, settings, ...rest } = r.data
    return { site: { nav, settings }, data: { nav, settings, ...rest }, status: 200, resource }
  }
  const [site, r] = await Promise.all([
    memoized('site', 30000, async () => (await cms('/site')).data),
    resource ? cms(resource) : Promise.resolve({ status: 200, data: undefined }),
  ])
  return { site: site ?? null, data: r.data, status: r.status === 404 ? 404 : 200, resource }
}

/* ---------------- pages ---------------- */
async function renderRoute(pathname, search, preview) {
  let loaded
  if (preview) {
    // an invalid/expired token is a plain 404 (never the published page, never an error page)
    const r = await cms(`/preview?token=${encodeURIComponent(preview)}`).catch(() => ({ status: 403 }))
    if (r.status !== 200) return { status: 404, html: await notFoundPage(pathname) }
    const site = await memoized('site', 30000, async () => (await cms('/site')).data)
    loaded = { site, data: r.data.data, status: 200, resource: resourceFor(pathname, search) }
  } else loaded = await loadRoute(pathname, search)
  const key = routeKey(pathname, search)
  const known = loaded.site !== null
  const initial = known ? { site: loaded.site, routes: loaded.data === undefined ? {} : { [key]: loaded.data }, preview: !!preview } : undefined
  const app = await render(pathname + search, initial)
  const unknownRoute = /data-not-found/.test(app) // NotFound marker (see Gate.tsx)
  const status = loaded.status === 404 || unknownRoute ? 404 : 200
  const m = meta(pathname, loaded.resource, status === 404 ? null : loaded.data, loaded.site ?? { settings: { seo: {}, contact: {}, social: {} } })
  const html = await buildPage({
    url: pathname, route: pathname, app, ...m, noindex: m.noindex || !!preview || status === 404,
    payload: known ? { key, site: loaded.site, data: status === 404 ? null : loaded.data, preview: !!preview } : null,
  })
  return { status, html }
}
async function notFoundPage(pathname) {
  const app = await render('/__not_found__')
  return buildPage({ url: pathname, route: pathname, app, title: 'صفحه پیدا نشد | فرتاش', description: '', canonical: SITE + pathname, noindex: true, payload: null })
}

/* ---------------- static files ---------------- */
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg' }
function serveStatic(req, res, pathname) {
  const file = path.join(dist, decodeURIComponent(pathname))
  if (!file.startsWith(dist + path.sep)) return false // path traversal
  let stat
  try { stat = fs.statSync(file) } catch { return false }
  if (!stat.isFile()) return false
  const ext = path.extname(file)
  const immutable = pathname.startsWith('/assets/')
  const headers = { 'Content-Type': TYPES[ext] ?? 'application/octet-stream', 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' }
  const ae = String(req.headers['accept-encoding'] || '')
  for (const [enc, suf] of [['br', '.br'], ['gzip', '.gz']]) {
    if (ae.includes(enc) && fs.existsSync(file + suf)) { headers['Content-Encoding'] = enc; headers.Vary = 'Accept-Encoding'; res.writeHead(200, headers); fs.createReadStream(file + suf).pipe(res); return true }
  }
  // byte ranges (the intro video streams)
  const range = /bytes=(\d*)-(\d*)/.exec(String(req.headers.range || ''))
  if (range && ext === '.mp4') {
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Number(range[2]) : stat.size - 1
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 })
    fs.createReadStream(file, { start, end }).pipe(res); return true
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' })
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res)
  return true
}

/* ---------------- HTTP ---------------- */
const send = (res, status, body, headers = {}) => { res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...headers }); res.end(body) }
// HTML/JSON responses: brotli or gzip (compressed once per cache entry, not per request)
const zip = new WeakMap()
function sendText(req, res, status, entry, headers) {
  const ae = String(req.headers['accept-encoding'] || '')
  const enc = ae.includes('br') ? 'br' : ae.includes('gzip') ? 'gzip' : null
  if (!enc || entry.body.length < 1024) return send(res, status, entry.body, headers)
  let z = zip.get(entry); if (!z) { z = {}; zip.set(entry, z) }
  z[enc] ??= enc === 'br'
    ? zlib.brotliCompressSync(Buffer.from(entry.body), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } })
    : zlib.gzipSync(Buffer.from(entry.body), { level: 9 })
  return send(res, status, z[enc], { ...headers, 'Content-Encoding': enc, Vary: 'Accept-Encoding' })
}
const log = (...a) => console.log(new Date().toISOString(), ...a)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://x')
  const { pathname } = url
  const search = url.search
  try {
    if (req.method === 'POST' && pathname === '/__revalidate') {
      if (!SECRET || req.headers.authorization !== `Bearer ${SECRET}`) return send(res, 401, 'unauthorized')
      clearAll(); log('revalidate: cache cleared')
      return send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': 'application/json' })
    }
    if (await auth.handle(req, res, pathname, url.searchParams)) return
    if (pathname.startsWith('/api/')) return send(res, 404, '{"error":"not_found"}', { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed', { Allow: 'GET, HEAD' })
    if (pathname === '/healthz') return send(res, 200, 'ok', { 'Cache-Control': 'no-store' })
    if (pathname === '/robots.txt') return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /panel\nDisallow: /teacher\nDisallow: /reception\nDisallow: /supervisor\nDisallow: /support-desk\nDisallow: /owner\nDisallow: /staff\nDisallow: /__data\n\nSitemap: ${SITE}/sitemap.xml\n`, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' })
    if (pathname === '/sitemap.xml') {
      const entries = await memoized('sitemap', 600000, async () => (await cms('/sitemap')).data?.entries ?? []).catch(() => [])
      const today = new Date().toISOString().slice(0, 10)
      const urls = [['/', today], ['/teachers', today], ['/magazine', today], ['/placement', today], ['/events', today], ...entries.map((e) => [e.path, String(e.updatedAt).slice(0, 10)])]
      return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, d]) => `  <url><loc>${esc(SITE + encodeURI(p))}</loc><lastmod>${d}</lastmod></url>`).join('\n')}\n</urlset>\n`,
        { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
    }
    if (pathname === '/__data') {
      const p = new URL(url.searchParams.get('path') || '/', 'http://x')
      const key = 'data:' + p.pathname + p.search
      const hit = cache.get(key)
      if (hit && Date.now() - hit.at < TTL) return sendText(req, res, hit.status, hit, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' })
      try {
        const l = await loadRoute(p.pathname, p.search)
        if (!l.resource || l.site === null) return send(res, 404, '{"error":"not_found"}', { 'Content-Type': 'application/json' })
        const body = JSON.stringify({ site: l.site, data: l.data })
        const entry = { at: Date.now(), status: l.status, body }
        cache.set(key, entry)
        return sendText(req, res, l.status, entry, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' })
      } catch (e) {
        log('data error', p.pathname, e.message)
        if (hit) return send(res, hit.status, hit.body, { 'Content-Type': 'application/json' })
        return send(res, 503, '{"error":"unavailable"}', { 'Content-Type': 'application/json' })
      }
    }
    // signed-in areas: the server checks the session (and role) before any panel HTML is sent; panels are client-only skeletons
    if (PROTECTED.test(pathname)) {
      const to = await auth.guard(req, pathname, search)
      if (to) return send(res, 302, '', { Location: to, 'Cache-Control': 'no-store' })
      const area = pathname.split('/')[1]
      const f = path.join(dist, pathname.replace(/\/$/, ''), 'index.html')
      const file = f.startsWith(path.join(dist, area)) && fs.existsSync(f) ? f : path.join(dist, area, 'index.html')
      return send(res, 200, fs.readFileSync(file), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' })
    }
    if (pathname !== '/' && serveStatic(req, res, pathname)) return
    // redirects managed in the Support Dashboard
    const redirects = await memoized('redirects', 60000, async () => (await cms('/redirects')).data?.items ?? []).catch(() => [])
    const rd = redirects.find((r) => r.from === pathname || r.from === pathname.replace(/\/$/, ''))
    if (rd) return send(res, rd.status === 302 ? 302 : 301, '', { Location: rd.to + (rd.to.startsWith('/') ? search : ''), 'Cache-Control': 'public, max-age=3600' })
    const preview = url.searchParams.get('preview')
    const cleanSearch = (() => { const q = new URLSearchParams(search); q.delete('preview'); return q.size ? `?${q}` : '' })()
    const key = 'page:' + pathname + cleanSearch
    const hit = !preview && cache.get(key)
    if (hit && Date.now() - hit.at < TTL) return sendText(req, res, hit.status, hit, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Cache': 'hit' })
    try {
      const { status, html } = await renderRoute(pathname, cleanSearch, preview)
      const entry = { at: Date.now(), status, body: html }
      if (!preview) cache.set(key, entry)
      return sendText(req, res, status, entry, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': preview ? 'no-store' : 'no-cache', ...(preview ? { 'X-Robots-Tag': 'noindex' } : {}), 'X-Cache': 'miss' })
    } catch (e) {
      log('render error', pathname, e.message)
      if (hit) return send(res, hit.status, hit.body, { 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'stale' })
      // last resort: the static build of this route (built-in content), if it exists
      const f = path.join(dist, pathname === '/' ? 'index.html' : path.join(pathname, 'index.html'))
      if (f.startsWith(dist) && fs.existsSync(f)) return send(res, 200, fs.readFileSync(f), { 'Content-Type': 'text/html; charset=utf-8', 'X-Cache': 'fallback' })
      return send(res, 503, '<!doctype html><meta charset="utf-8"><title>فرتاش</title><p dir="rtl" style="font-family:sans-serif;padding:2rem">سایت موقتاً در دسترس نیست. چند دقیقهٔ دیگر دوباره سر بزنید.</p>', { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '60' })
    }
  } catch (e) {
    log('request error', pathname, e.message)
    return send(res, 500, 'internal error')
  }
})
server.listen(PORT, () => log(`fartash-web listening on :${PORT} (CMS: ${CMS || 'not configured, built-in content'})`))
void CONTACT
