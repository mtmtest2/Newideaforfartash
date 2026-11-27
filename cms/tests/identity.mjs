// Security test of sign-in, sign-up, sessions and roles, run against the real web server + CMS (attacker's view).
// Start the web server with TRUST_PROXY=1 so each scenario can use its own client IP (rate limits are per IP).
// usage: WEB=http://localhost:4173 CMS=http://localhost:3001 OWNER_USERNAME=… OWNER_PASSWORD=… node tests/identity.mjs
const WEB = process.env.WEB || 'http://localhost:4173'
const CMS = process.env.CMS || 'http://localhost:3001'
const OWNER = { username: process.env.OWNER_USERNAME || 'owner.demo', password: process.env.OWNER_PASSWORD || 'Malek-Fartash-2026' }
const run = Date.now().toString(36).slice(-6)
const results = []
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !extra ? '' : `  -- ${String(extra).slice(0, 300)}`}`) }
const user = async (b, path = '/api/auth/me') => (await b.req(path)).json?.user ?? null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ipN = 1
const newIp = () => `10.9.${Math.floor(ipN / 250)}.${(ipN++ % 250) + 1}`

/** One browser: its own cookie jar and IP. */
function browser(ip = newIp()) {
  const jar = new Map()
  const b = {
    ip, jar,
    cookie: () => [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    async req(path, { method = 'GET', body, origin = WEB, ct = 'application/json', headers = {} } = {}) {
      const h = { 'x-forwarded-for': ip, ...(jar.size ? { cookie: b.cookie() } : {}), ...headers }
      if (method !== 'GET') { if (origin) h.origin = origin; if (ct) h['content-type'] = ct }
      const r = await fetch(WEB + path, { method, headers: h, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), redirect: 'manual' })
      const setCookie = r.headers.getSetCookie?.() ?? []
      for (const c of setCookie) { const [kv] = c.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i), v = kv.slice(i + 1); if (v) jar.set(k, v); else jar.delete(k) }
      const text = await r.text(); let json = null; try { json = JSON.parse(text) } catch { /* html */ }
      return { status: r.status, json, text, setCookie, location: r.headers.get('location') }
    },
    post: (path, body, o = {}) => b.req(path, { method: 'POST', body, ...o }),
  }
  return b
}

// ---------- member sign-up ----------
const alice = browser()
const aliceUser = `alice.${run}`
const reg = await alice.post('/api/auth/register', { name: 'آلیس تست', username: aliceUser, password: 'Sabz-Kelid-2026', next: '//evil.example/x' })
ok('register: 201 + session cookie', reg.status === 201 && reg.setCookie.length === 1, reg.text)
const mc = reg.setCookie[0] ?? ''
ok('cookie is HttpOnly + SameSite=Lax + Path=/', /HttpOnly/.test(mc) && /SameSite=Lax/.test(mc) && /Path=\//.test(mc), mc)
const sealed = mc.split(';')[0].split('=').slice(1).join('=')
ok('cookie value is sealed (not a JWT)', !!sealed && !sealed.startsWith('eyJ') && sealed.split('.').length === 1, sealed.slice(0, 30))
ok('response carries no token', !/token|eyJ/.test(reg.text), reg.text)
ok('open redirect "//evil" ignored → /panel', reg.json?.redirect === '/panel', reg.json?.redirect)
ok('me works with the cookie', (await user(alice))?.username === aliceUser)
ok('me without a cookie: 200 + user null (no console noise)', (await browser().req('/api/auth/me')).status === 200 && (await user(browser())) === null)
ok('/panel page allowed for member', (await alice.req('/panel')).status === 200)
const dup = await browser().post('/api/auth/register', { name: 'دیگری', username: aliceUser, password: 'Another-Pass-77' })
ok('duplicate username → 409', dup.status === 409, dup.text)
const weak = await browser().post('/api/auth/register', { name: 'ضعیف', username: `weak.${run}`, password: '1234567890' })
ok('weak password rejected', weak.status === 400 && weak.json?.error === 'weak_password', weak.text)
const badName = await browser().post('/api/auth/register', { name: 'x', username: `<script>${run}`, password: 'Sabz-Kelid-2026' })
ok('invalid username / name rejected', badName.status === 400, badName.text)

// ---------- cookie theft / tampering ----------
const cmsReplay = await fetch(`${CMS}/api/articles?limit=1`, { headers: { authorization: `JWT ${sealed}` } })
ok('stolen cookie value is useless on CMS REST', cmsReplay.status === 403 || cmsReplay.status === 401, cmsReplay.status)
const tampered = browser(); tampered.jar.set('fartash_m', sealed.slice(0, -4) + (sealed.endsWith('AAAA') ? 'BBBB' : 'AAAA'))
const tr = await tampered.req('/api/auth/me')
ok('tampered cookie → signed out and cleared', tr.json?.user === null && tr.setCookie.some((c) => /Max-Age=0/.test(c)), tr.text)
const swapped = browser(); swapped.jar.set('fartash_s_owner', sealed)
ok('member cookie moved into the owner slot → rejected', (await user(swapped, '/api/auth/staff/me?role=owner')) === null)
ok('member cookie used as staff cookie → /owner blocked', (await swapped.req('/owner')).status === 302)

// ---------- identity API never reachable without the internal key ----------
ok('CMS /api/identity/* without key → 404', (await fetch(`${CMS}/api/identity/admin/overview`)).status === 404)
const forged = await fetch(`${CMS}/api/identity/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-fartash-internal': 'guess' }, body: JSON.stringify({ audience: 'staff', ...OWNER }) })
ok('CMS identity with a wrong key → 404', forged.status === 404)
const fr = await fetch(`${CMS}/api/staff/first-register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `evil.${run}`, name: 'evil', role: 'owner', password: 'Evil-Owner-2026', 'confirm-password': 'Evil-Owner-2026' }) })
ok('Payload "first user" route cannot create staff', fr.status >= 400 && !(await browser().post('/api/auth/staff/login', { username: `evil.${run}`, password: 'Evil-Owner-2026' })).json?.user, fr.status)
const directCreate = await fetch(`${CMS}/api/staff`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `evil2.${run}`, name: 'evil', role: 'owner', password: 'Evil-Owner-2026' }) })
ok('anonymous POST /api/staff refused', directCreate.status >= 400, directCreate.status)
ok('CMS members REST disabled', (await fetch(`${CMS}/api/members`)).status >= 400)
ok('CMS otp-challenges REST disabled', (await fetch(`${CMS}/api/otp-challenges`)).status >= 400)

// ---------- CSRF ----------
const ev = await browser().post('/api/auth/login', { username: aliceUser, password: 'Sabz-Kelid-2026' }, { origin: 'https://evil.example' })
ok('cross-origin POST → 403', ev.status === 403, ev.status)
const form = await browser().post('/api/auth/login', `username=${aliceUser}&password=x`, { ct: 'application/x-www-form-urlencoded' })
ok('form-encoded POST → 403', form.status === 403, form.status)
const noOrigin = await browser().post('/api/auth/login', { username: aliceUser, password: 'Sabz-Kelid-2026' }, { origin: null })
ok('POST without Origin/Sec-Fetch-Site → 403', noOrigin.status === 403, noOrigin.status)
const csrfAdmin = await alice.post('/api/auth/admin/staff', { name: 'x', username: 'x', password: 'y', role: 'owner' }, { origin: 'https://evil.example' })
ok('cross-origin admin POST → 403', csrfAdmin.status === 403)

// ---------- credential errors don't leak which part was wrong ----------
const t0 = Date.now(); const wrong = await browser().post('/api/auth/login', { username: aliceUser, password: 'Wrong-Pass-123' }); const t1 = Date.now()
const none = await browser().post('/api/auth/login', { username: `ghost.${run}`, password: 'Wrong-Pass-123' }); const t2 = Date.now()
ok('wrong password and unknown user: same status + message', wrong.status === 401 && none.status === 401 && wrong.json?.message === none.json?.message, `${wrong.text} | ${none.text}`)
ok('…and similar timing (±250ms)', Math.abs((t1 - t0) - (t2 - t1)) < 250, `${t1 - t0}ms vs ${t2 - t1}ms`)

// ---------- audience can't be chosen by the client ----------
const inj = await browser().post('/api/auth/login', { ...OWNER, audience: 'staff' })
ok('"audience":"staff" in a member login body is ignored', inj.status === 401, inj.text)
ok('member cannot log in on the staff endpoint', (await browser().post('/api/auth/staff/login', { username: aliceUser, password: 'Sabz-Kelid-2026' })).status === 401)
ok('staff cannot sign up through /api/auth/staff/register', (await browser().post('/api/auth/staff/register', { name: 'x y', username: `st.${run}`, password: 'Sabz-Kelid-2026' })).status === 404)

// ---------- member vs staff areas ----------
ok('member → /owner redirected to staff login', (await alice.req('/owner')).location?.startsWith('/staff/login'))
ok('member → admin API 401', (await alice.req('/api/auth/admin/overview')).status === 401)
ok('anonymous → /panel/index.html redirected (no static bypass)', (await browser().req('/panel/index.html')).status === 302)

// ---------- owner ----------
const owner = browser()
const ol = await owner.post('/api/auth/staff/login', { ...OWNER, next: '/owner/staff' })
ok('owner signs in on staff page', ol.status === 200 && ol.json?.user?.role === 'owner', ol.text)
ok('staff cookie is SameSite=Strict', /SameSite=Strict/.test(ol.setCookie[0] ?? ''), ol.setCookie[0])
ok('next within area kept', ol.json?.redirect === '/owner/staff', ol.json?.redirect)
ok('owner → /owner 200', (await owner.req('/owner')).status === 200)
ok('owner → /teacher needs a teacher session', (await owner.req('/teacher')).location?.startsWith('/staff/login'))
const mk = async (b, role, extra = {}) => b.post('/api/auth/admin/staff', { name: `${role} ${run}`, username: `${role}.${run}`, password: `${role[0].toUpperCase()}${role}-Pass-2026`, role, ...extra })
const supC = await mk(owner, 'support'), teaC = await mk(owner, 'teacher', { phone: `0935${String(Date.now()).slice(-7)}` }), supvC = await mk(owner, 'supervisor')
ok('owner creates support / teacher / supervisor', supC.status === 201 && teaC.status === 201 && supvC.status === 201, `${supC.text} ${teaC.text} ${supvC.text}`)
ok('owner cannot deactivate self', (await owner.post(`/api/auth/admin/staff/${ol.json.user.id}`, { action: 'deactivate' })).status === 400)

// ---------- support: limited account management ----------
const sup = browser()
ok('support signs in', (await sup.post('/api/auth/staff/login', { username: `support.${run}`, password: 'Ssupport-Pass-2026' })).status === 200)
const supOwner = await mk(sup, 'owner')
ok('support cannot create owner', supOwner.status === 403, supOwner.text)
ok('support cannot create support', (await mk(sup, 'support')).status === 403)
const supList = await sup.req('/api/auth/admin/staff')
ok('support list hides owners/support/supervisors', supList.status === 200 && supList.json.docs.every((d) => ['teacher', 'reception'].includes(d.role)), supList.text.slice(0, 200))
ok('support cannot touch the owner account', (await sup.post(`/api/auth/admin/staff/${ol.json.user.id}`, { action: 'password', password: 'Hijack-Pass-2026' })).status === 403)
ok('support cannot promote a teacher to owner', (await sup.post(`/api/auth/admin/staff/${teaC.json.user.id}`, { action: 'role', role: 'owner' })).status === 403)
ok('support → /owner refused', (await sup.req('/owner')).location?.startsWith('/staff/login'))
const recep = await mk(sup, 'reception')
ok('support creates reception', recep.status === 201, recep.text)
ok('"role" action on a member account rejected', (await sup.post(`/api/auth/admin/members/${reg.json.user.id}`, { action: 'role', role: 'owner' })).status === 400)

// ---------- teacher ----------
const tea = browser()
ok('teacher signs in', (await tea.post('/api/auth/staff/login', { username: `teacher.${run}`, password: 'Tteacher-Pass-2026' })).status === 200)
const denied = (st) => st === 401 || st === 403
ok('teacher → admin API denied', denied((await tea.req('/api/auth/admin/overview')).status))
const moved = browser(); moved.jar.set('fartash_s_support', tea.jar.get('fartash_s_teacher'))
ok('teacher cookie moved into the support slot → admin API denied', denied((await moved.req('/api/auth/admin/staff')).status))
ok('teacher → admin POST denied', denied((await mk(tea, 'owner')).status))
ok('teacher → /owner refused', (await tea.req('/owner')).location?.startsWith('/staff/login'))
ok('teacher → /teacher 200', (await tea.req('/teacher')).status === 200)
const cmsT = await fetch(`${CMS}/api/staff/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `teacher.${run}`, password: 'Tteacher-Pass-2026' }) })
ok('teacher cannot sign in to the CMS Content Hub', cmsT.status === 401, cmsT.status)
const supv = browser()
await supv.post('/api/auth/staff/login', { username: `supervisor.${run}`, password: 'Ssupervisor-Pass-2026' })
// one browser, two staff roles side by side (separate cookie per role)
await tea.post('/api/auth/staff/login', { username: `reception.${run}`, password: 'Rreception-Pass-2026' })
ok('teacher + reception sessions side by side in one browser', (await tea.req('/teacher')).status === 200 && (await tea.req('/reception')).status === 200)
ok('…and neither unlocks /owner', (await tea.req('/owner')).status === 302)
ok('supervisor → /supervisor 200, admin API 403', (await supv.req('/supervisor')).status === 200 && denied((await supv.req('/api/auth/admin/staff')).status))

// ---------- deactivation, role change, logout, password change revoke sessions ----------
ok('owner deactivates teacher', (await owner.post(`/api/auth/admin/staff/${teaC.json.user.id}`, { action: 'deactivate' })).status === 200)
await sleep(5500)
ok('deactivated teacher: session gone', (await user(tea, '/api/auth/staff/me?role=teacher')) === null)
ok('deactivated teacher cannot sign in', (await browser().post('/api/auth/staff/login', { username: `teacher.${run}`, password: 'Tteacher-Pass-2026' })).status === 401)
await owner.post(`/api/auth/admin/staff/${teaC.json.user.id}`, { action: 'activate' })

const a2 = browser()
await a2.post('/api/auth/login', { username: aliceUser, password: 'Sabz-Kelid-2026' })
const beforeLogout = a2.cookie()
await a2.post('/api/auth/logout', {})
const replay = browser(); for (const p of beforeLogout.split('; ')) { const i = p.indexOf('='); replay.jar.set(p.slice(0, i), p.slice(i + 1)) }
ok('cookie replay after logout → rejected (server-side session revoked)', (await user(replay)) === null)

const a3 = browser()
await a3.post('/api/auth/login', { username: aliceUser, password: 'Sabz-Kelid-2026' })
const pw = await alice.post('/api/auth/password', { current: 'Sabz-Kelid-2026', next: 'Tazeh-Ramz-2027' })
ok('password change', pw.status === 200, pw.text)
await sleep(5500)
ok('…signs out other devices', (await user(a3)) === null)
ok('…keeps the current device (new session cookie)', (await user(alice))?.username === aliceUser)
ok('password change needs the current password', (await alice.post('/api/auth/password', { current: 'nope-nope-nope', next: 'Another-Ramz-2027' })).status === 400)

// ---------- lockout ----------
const lockIp = browser()
for (let i = 0; i < 5; i++) await lockIp.post('/api/auth/login', { username: aliceUser, password: `Wrong-${i}-xxxxx` })
const locked = await browser().post('/api/auth/login', { username: aliceUser, password: 'Tazeh-Ramz-2027' })
ok('5 wrong passwords lock the account (even with the right one after)', locked.status === 401, locked.text)
const ov = await owner.req('/api/auth/admin/overview')
ok('locked account visible to owner', ov.json?.members?.locked >= 1, ov.text.slice(0, 200))
ok('owner unlocks', (await owner.post(`/api/auth/admin/members/${reg.json.user.id}`, { action: 'unlock' })).status === 200)
ok('…and the member can sign in again', (await browser().post('/api/auth/login', { username: aliceUser, password: 'Tazeh-Ramz-2027' })).status === 200)

// ---------- one-time codes (dev SMS provider) ----------
const cfg = await browser().req('/api/auth/config')
if (cfg.json?.otp) {
  const phone = `0912${String(Date.now()).slice(-7)}`
  const o = browser()
  const r1 = await o.post('/api/auth/otp/request', { phone })
  ok('OTP request', r1.status === 200 && /^\d{6}$/.test(r1.json?.devCode ?? ''), r1.text)
  ok('OTP resend too soon → 429', (await o.post('/api/auth/otp/request', { phone })).status === 429)
  const wrongCode = r1.json.devCode === '000000' ? '111111' : '000000'
  for (let i = 0; i < 4; i++) await o.post('/api/auth/otp/verify', { phone, code: wrongCode })
  const fifth = await o.post('/api/auth/otp/verify', { phone, code: wrongCode })
  const after = await o.post('/api/auth/otp/verify', { phone, code: r1.json.devCode })
  ok('OTP: 5 wrong codes burn the challenge (right code then fails)', fifth.status === 400 && after.status === 400, after.text)
  const o2 = browser()
  const phone2 = `0913${String(Date.now()).slice(-7)}`
  const c2 = (await o2.post('/api/auth/otp/request', { phone: phone2 })).json?.devCode
  const v2 = await o2.post('/api/auth/otp/verify', { phone: phone2, code: c2 })
  ok('OTP creates a member account and signs in', v2.status === 200 && v2.json?.isNew === true && !!(await user(o2)), v2.text)
  ok('OTP code cannot be reused', (await browser().post('/api/auth/otp/verify', { phone: phone2, code: c2 })).status === 400)
  const st = await browser().post('/api/auth/staff/otp/request', { phone: `0936${String(Date.now()).slice(-7)}` })
  ok('staff OTP for an unknown phone: same answer, no code sent', st.status === 200 && st.json?.ok && !st.json?.devCode, st.text)
  const teaPhone = teaC.json.user.phone
  const so = browser()
  const sc = (await so.post('/api/auth/staff/otp/request', { phone: teaPhone })).json?.devCode
  const sv = await so.post('/api/auth/staff/otp/verify', { phone: teaPhone, code: sc })
  ok('staff OTP sign-in lands on the teacher panel', sv.status === 200 && sv.json?.redirect === '/teacher', sv.text)
  ok('member OTP code is not valid for staff', (await browser().post('/api/auth/staff/otp/verify', { phone: phone2, code: c2 })).status === 400)
} else ok('OTP disabled → endpoints answer 503', (await browser().post('/api/auth/otp/request', { phone: '09120000000' })).status === 503)

// ---------- rate limits ----------
const flood = browser()
let last
for (let i = 0; i < 11; i++) last = await flood.post('/api/auth/login', { username: `flood${i}.${run}`, password: 'Whatever-Pass-1' })
ok('11 logins from one IP in 5 min → 429', last.status === 429, last.status)

// ---------- headers ----------
const h = await fetch(`${WEB}/api/auth/me`)
ok('auth API responses are no-store', /no-store/.test(h.headers.get('cache-control') ?? ''))
const pg = await fetch(`${WEB}/owner`, { redirect: 'manual' })
ok('protected pages are not cacheable', /no-store/.test(pg.headers.get('cache-control') ?? ''))
const robots = await (await fetch(`${WEB}/robots.txt`)).text()
ok('robots.txt disallows staff areas', /Disallow: \/owner/.test(robots) && /Disallow: \/staff/.test(robots))

console.log(results.join('\n'))
const failed = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
