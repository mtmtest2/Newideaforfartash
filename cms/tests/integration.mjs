// End-to-end integration test of the Content Hub against a running CMS (Payload) and web server.
// Uses a real Support account through the REST API, the public content API and the public website.
// usage: CMS=http://localhost:3001 WEB=http://localhost:4173 SUPPORT_EMAIL=… SUPPORT_PASSWORD=… CONTENT_API_SECRET=… node tests/integration.mjs
import crypto from 'node:crypto'

const CMS = process.env.CMS || 'http://localhost:3001'
const WEB = process.env.WEB || 'http://localhost:4173'
const SECRET = process.env.CONTENT_API_SECRET || 'dev-content-secret-0123456789abcdef'
const results = []
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !extra ? '' : `  -- ${String(extra).slice(0, 300)}`}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const run = Date.now().toString(36)

// ---- auth (CMS staff session via REST) ----
const login = await fetch(`${CMS}/api/staff/login`, { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: process.env.SUPPORT_EMAIL || 'support@fartash.example', password: process.env.SUPPORT_PASSWORD || 'DevOnly-Pass-2026' }) })
const { token, user } = await login.json()
ok('support can sign in', login.ok && !!token)
const H = { 'content-type': 'application/json', authorization: `JWT ${token}` }
const api = async (method, path, body) => {
  const r = await fetch(`${CMS}/api${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined })
  const text = await r.text(); let j = null; try { j = JSON.parse(text) } catch { /* not json */ }
  return { status: r.status, json: j, text }
}
const pub = async (path) => { const r = await fetch(`${CMS}/api/public${path}`, { headers: { authorization: `Bearer ${SECRET}` } }); return { status: r.status, json: r.status === 200 ? await r.json() : null } }
const web = async (path) => { const r = await fetch(`${WEB}${path}`, { redirect: 'manual' }); return { status: r.status, text: await r.text(), headers: r.headers } }
const one = async (collection, where) => (await api('GET', `/${collection}?limit=1&depth=0&${where}`)).json?.docs?.[0]

const english = await one('languages', 'where[slug][equals]=english')
const arman = await one('teachers', 'where[slug][equals]=arman-kiani')
const media = await one('media', 'where[filename][equals]=prof-en.webp')

// ---- 1. magazine: draft -> invisible, publish -> visible on the site (no rebuild) ----
const slug = `test-article-${run}`
const para = (t) => ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'rtl', children: [
  { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'rtl', children: [{ type: 'text', text: 'بخش اول', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] },
  { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'rtl', textFormat: 0, children: [{ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] },
  { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'rtl', children: [{ type: 'text', text: 'بخش دوم <script>alert(1)</script>', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] }] } })
const created = await api('POST', '/articles?draft=true', { title: `مقالهٔ آزمایشی ${run}`, slug, excerpt: 'خلاصهٔ آزمایشی', cover: media.id, content: para('متن آزمایشی مقاله.'), _status: 'draft' })
ok('create article draft', created.status === 201, created.text)
const art = created.json?.doc
ok('draft not in public API', (await pub(`/articles/${slug}`)).status === 404)
ok('draft not on the site', (await web(`/magazine/${slug}`)).status === 404)
ok('anonymous REST cannot read drafts', (await fetch(`${CMS}/api/articles/${art.id}?draft=true`)).status === 403)
const published = await api('PATCH', `/articles/${art.id}`, { _status: 'published' })
ok('publish article', published.status === 200, published.text)
await sleep(600)
const pa = await pub(`/articles/${slug}`)
ok('published article in public API', pa.status === 200)
ok('TOC generated from H2 headings', pa.json?.toc?.length === 2)
ok('rich text is escaped (no <script>)', pa.json && !pa.json.html.includes('<script>') && pa.json.html.includes('&lt;script&gt;'))
const page = await web(`/magazine/${slug}`)
ok('article page live on the site without rebuild', page.status === 200 && page.text.includes(`مقالهٔ آزمایشی ${run}`), page.status)
ok('article page has BlogPosting JSON-LD', page.text.includes('"@type":"BlogPosting"'))
ok('article listed on /magazine', (await web('/magazine')).text.includes(`مقالهٔ آزمایشی ${run}`))
ok('article in sitemap', (await web('/sitemap.xml')).text.includes(`/magazine/${slug}`))

// ---- 2. scheduling: future publish date stays hidden; a scheduled publish job publishes on time ----
const future = await api('POST', '/articles', { title: `آینده ${run}`, slug: `future-${run}`, excerpt: 'خلاصه', cover: media.id, content: para('متن'), _status: 'published', publishedAt: new Date(Date.now() + 86400000).toISOString() })
ok('future-dated article saved', future.status === 201, future.text)
ok('future-dated article hidden until its date', (await pub(`/articles/future-${run}`)).status === 404)
const sched = await api('POST', '/articles?draft=true', { title: `زمان‌بندی ${run}`, slug: `sched-${run}`, excerpt: 'خلاصه', cover: media.id, content: para('متن'), _status: 'draft' })
ok('jobs collection is closed to direct API writes', (await api('POST', '/payload-jobs', { taskSlug: 'schedulePublish', input: {} })).status === 403)
const { execFileSync } = await import('node:child_process')
const queued = execFileSync('npx', ['payload', 'run', 'tests/queue-schedule.ts', 'articles', String(sched.json?.doc?.id), '2'], { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' })
ok('scheduled publish queued (server-side, as the dashboard does)', /queued job/.test(queued), queued)
ok('scheduled article hidden before its time', (await pub(`/articles/sched-${run}`)).status === 404)
await sleep(3000)
const runJobs = await api('POST', '/monitoring/run-jobs')
ok('job runner tool reports success', runJobs.status === 200, runJobs.text)
ok('scheduled article published by the job', (await pub(`/articles/sched-${run}`)).status === 200)

// ---- 3. preview: signed token shows the draft, wrong token rejected ----
await api('PATCH', `/articles/${art.id}?draft=true`, { title: `پیش‌نویس تازه ${run}`, _status: 'draft' })
const sign = (c, id) => { const p = `${c}.${id}.${Date.now() + 600000}`; return Buffer.from(p).toString('base64url') + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('base64url') }
const pv = await web(`/magazine/${slug}?preview=${encodeURIComponent(sign('articles', art.id))}`)
ok('preview shows the unpublished draft', pv.status === 200 && pv.text.includes(`پیش‌نویس تازه ${run}`) && pv.text.includes('preview-bar'))
ok('preview is noindex + no-store', pv.headers.get('x-robots-tag') === 'noindex' && pv.headers.get('cache-control') === 'no-store')
ok('published page still shows the published version', (await web(`/magazine/${slug}`)).text.includes(`مقالهٔ آزمایشی ${run}`))
ok('forged preview token rejected', (await web(`/magazine/${slug}?preview=abc.def`)).status === 404)

// ---- 4. teachers: carousel visibility, archiving keeps the record ----
const homeBefore = await pub('/home')
ok('teacher carousel from CMS (5 teachers)', homeBefore.json?.teachers?.items?.length === 5)
const kaveh = await one('teachers', 'where[slug][equals]=kaveh-ahmadi')
await api('PATCH', `/teachers/${kaveh.id}`, { showOnHome: false })
ok('hidden from carousel when unticked', !(await pub('/home')).json.teachers.items.some((t) => t.slug === 'kaveh-ahmadi'))
ok('still in the directory', (await pub('/teachers')).json.items.some((t) => t.slug === 'kaveh-ahmadi'))
await api('PATCH', `/teachers/${kaveh.id}`, { profileState: 'archived' })
ok('archived teacher: profile gone from the site', (await web('/teachers/kaveh-ahmadi')).status === 404)
ok('archived teacher: record kept in the CMS', (await api('GET', `/teachers/${kaveh.id}`)).status === 200)
await api('PATCH', `/teachers/${kaveh.id}`, { profileState: 'active', showOnHome: true })
ok('restored teacher back in carousel', (await pub('/home')).json.teachers.items.some((t) => t.slug === 'kaveh-ahmadi'))
ok('public teacher DTO has no private link field', !JSON.stringify((await pub('/teachers/arman-kiani')).json).includes('fartashUserId'))

// ---- 5. offline courses: fully manageable, invisible until the flag is on ----
const course = await api('POST', '/courses', {
  title: `دورهٔ آزمایشی ${run}`, slug: `course-${run}`, excerpt: 'خلاصهٔ دوره', language: english.id, instructor: arman.id, cover: media.id, level: ['B1'],
  modules: [{ title: 'بخش ۱', chapters: [{ title: 'فصل ۱', lessons: [
    { title: 'درس ۱', minutes: 12, preview: true, video: { provider: 'arvan', assetId: 'SECRET-ASSET-1' } },
    { title: 'درس ۲', minutes: 18, video: { provider: 'arvan', assetId: 'SECRET-ASSET-2' } }] }] }],
  _status: 'published', showOnHome: true,
})
ok('create course with modules/chapters/lessons', course.status === 201, course.text)
ok('lesson totals computed', course.json?.doc?.totalLessons === 2 && course.json?.doc?.totalMinutes === 30)
const flags0 = await api('GET', '/globals/feature-flags')
ok('feature flag defaults to OFF', flags0.json?.offlineCoursesEnabled === false)
ok('flag off: /courses 404 on the site', (await web('/courses')).status === 404)
ok('flag off: course page 404 on the site', (await web(`/courses/course-${run}`)).status === 404)
ok('flag off: no courses section on the home page', !(await web('/')).text.includes('id="courses"'))
ok('flag off: home API has no courses key', !('courses' in (await pub('/home')).json))
ok('flag off: not in sitemap', !(await web('/sitemap.xml')).text.includes('/courses'))
ok('flag off: no menu link', !(await pub('/site')).json.nav.header.some((l) => l.href === '/courses'))
const on = await api('POST', '/globals/feature-flags', { offlineCoursesEnabled: true })
ok('support turns the flag on', on.status === 200, on.text)
await sleep(800)
const homeOn = await web('/')
ok('flag on: carousel appears on the live home page (no rebuild)', homeOn.text.includes('id="courses"') && homeOn.text.includes(`دورهٔ آزمایشی ${run}`))
ok('flag on: /courses and course page live', (await web('/courses')).status === 200 && (await web(`/courses/course-${run}`)).status === 200)
ok('flag on: menu link + sitemap entry', (await pub('/site')).json.nav.header.some((l) => l.href === '/courses') && (await web('/sitemap.xml')).text.includes(`/courses/course-${run}`))
const cdto = JSON.stringify((await pub(`/courses/course-${run}`)).json)
ok('course DTO never exposes video asset ids or private files', !cdto.includes('SECRET-ASSET') && !cdto.includes('resources'))
await api('POST', '/globals/home-layout', { courses: { selection: 'manual', picked: [course.json.doc.id], position: 'beforeArticles' } })
await sleep(600)
const h2 = await web('/')
ok('carousel position configurable', h2.text.indexOf('id="courses"') > h2.text.indexOf('id="classes"') && h2.text.indexOf('id="courses"') < h2.text.indexOf('id="blog"'))
await api('POST', '/globals/feature-flags', { offlineCoursesEnabled: false })
await sleep(800)
ok('flag off again: section gone from the live site', !(await web('/')).text.includes('id="courses"') && (await web('/courses')).status === 404)

// ---- 6. media safety ----
const fd = (name, type, bytes) => { const f = new FormData(); f.append('file', new Blob([bytes], { type }), name); f.append('_payload', JSON.stringify({ alt: 'آزمایش' })); return f }
const up = (f) => fetch(`${CMS}/api/media`, { method: 'POST', headers: { authorization: `JWT ${token}` }, body: f })
ok('SVG upload rejected', !(await up(fd('x.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).ok)
ok('executable upload rejected', !(await up(fd('x.exe', 'application/x-msdownload', 'MZ....'))).ok)
const fs = await import('node:fs')
const png = fs.readFileSync(new URL('../public/brand/icon.png', import.meta.url))
const dupe = await up(fd('icon-copy.png', 'image/png', png)); const dupe2 = await up(fd('icon-copy2.png', 'image/png', png))
ok('duplicate upload detected', dupe.ok && dupe2.status === 409, `${dupe.status}/${dupe2.status}`)
const del = await api('DELETE', `/media/${media.id}`)
ok('media in use cannot be deleted', del.status === 409 || del.status === 400, del.status)

// ---- 7. security boundaries ----
ok('support cannot create staff accounts', (await api('POST', '/staff', { email: `x${run}@x.ir`, password: 'Abcdefgh12345', name: 'x', role: 'support' })).status === 403)
const esc = await api('PATCH', `/staff/${user.id}`, { role: 'owner', active: true })
const me = await api('GET', `/staff/${user.id}`)
ok('support cannot change its own role (no owner)', me.json?.role === 'support', esc.text)
const logs = await api('GET', '/audit-logs?limit=1')
const logId = logs.json?.docs?.[0]?.id
ok('audit log cannot be edited through the API', (await api('PATCH', `/audit-logs/${logId}`, { action: 'x' })).status === 403)
ok('audit log cannot be deleted through the API', (await api('DELETE', `/audit-logs/${logId}`)).status === 403)
ok('anonymous cannot read private course files', (await fetch(`${CMS}/api/private-files`)).status === 403)
ok('anonymous cannot read audit logs or staff', (await fetch(`${CMS}/api/audit-logs`)).status === 403 && (await fetch(`${CMS}/api/staff`)).status === 403)
ok('public API requires the server key', (await fetch(`${CMS}/api/public/home`)).status === 401)
ok('anonymous cannot run diagnostics', (await fetch(`${CMS}/api/monitoring/run-jobs`, { method: 'POST' })).status === 403)
ok('web: revalidation requires the key', (await fetch(`${WEB}/__revalidate`, { method: 'POST' })).status === 401)
ok('web: path traversal blocked', !(await web('/assets/../../package.json')).text.includes('"dependencies"'))

// ---- 8. audit trail ----
const audit = (await api('GET', '/audit-logs?limit=200&sort=-createdAt')).json.docs
ok('audit: article publish recorded', audit.some((a) => a.entity === 'articles' && a.action === 'publish' && a.entityId === String(art.id)))
ok('audit: feature flag change recorded with old/new value', audit.some((a) => a.entity === 'global:feature-flags' && a.after?.offlineCoursesEnabled === true && a.before?.offlineCoursesEnabled === false))
ok('audit: teacher archive recorded', audit.some((a) => a.entity === 'teachers' && a.after?.profileState === 'archived'))
ok('audit: diagnostics tool recorded', audit.some((a) => a.action === 'tool.run-jobs'))
ok('audit: no secrets stored', !JSON.stringify(audit).match(/"(password|hash|salt)"/))

// ---- cleanup (test content only) ----
for (const [c, id] of [['articles', art.id], ['articles', future.json?.doc?.id], ['articles', sched.json?.doc?.id], ['courses', course.json?.doc?.id]]) if (id) await api('DELETE', `/${c}/${id}`)
await api('POST', '/globals/home-layout', { courses: { selection: 'auto', position: 'afterClasses' } })
if (dupe.ok) { const d = await dupe.json(); await api('DELETE', `/media/${d.doc.id}`) }

console.log(results.join('\n'))
const failed = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
