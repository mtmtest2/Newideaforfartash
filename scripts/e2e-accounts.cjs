// Test accounts for the browser e2e scripts, created through the real auth API (the site has no demo sign-in any more).
// Needs a running web server with TRUST_PROXY=1 (each call uses its own client IP so rate limits don't trip) and an
// owner account: E2E_OWNER_USERNAME / E2E_OWNER_PASSWORD (defaults are the local dev owner).
const crypto = require('node:crypto')
const ip = () => `10.77.${crypto.randomInt(0, 250)}.${crypto.randomInt(1, 250)}`
async function post(base, path, body, cookie) {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', origin: base, 'x-forwarded-for': ip(), ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) })
  const set = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
  return { status: r.status, json: await r.json().catch(() => null), cookie: set }
}
/** Returns { student, teacher, reception } credentials ({ username, password, name }). */
async function accounts(base, { student = 'مریم کاظمی', teacher = 'آرمان کیانی', reception = 'نرگس امیری' } = {}) {
  const run = Date.now().toString(36) + crypto.randomInt(0, 1e6).toString(36)
  const pw = 'E2e-Test-Pass-' + run
  const owner = await post(base, '/api/auth/staff/login', { username: process.env.E2E_OWNER_USERNAME || 'owner.demo', password: process.env.E2E_OWNER_PASSWORD || 'Malek-Fartash-2026' })
  if (owner.status !== 200) throw new Error('e2e: owner sign-in failed (set E2E_OWNER_USERNAME/E2E_OWNER_PASSWORD) ' + JSON.stringify(owner.json))
  const s = { username: `st${run}`, password: pw, name: student }
  const reg = await post(base, '/api/auth/register', s)
  if (reg.status !== 201) throw new Error('e2e: register failed ' + JSON.stringify(reg.json))
  const out = { student: s }
  for (const [role, name] of [['teacher', teacher], ['reception', reception], ['support', 'نگار صالحی'], ['supervisor', 'بهرام نادری']]) {
    const a = { username: `${role}${run}`.slice(0, 30), password: pw, name }
    const r = await post(base, '/api/auth/admin/staff', { ...a, role }, owner.cookie)
    if (r.status !== 201) throw new Error(`e2e: create ${role} failed ` + JSON.stringify(r.json))
    out[role] = a
  }
  return out
}
/** Signs in through the API and returns Playwright cookies for that session (for scripts that only need to be signed in). */
async function sessionCookies(base, a, staff) {
  const r = await post(base, staff ? '/api/auth/staff/login' : '/api/auth/login', { username: a.username, password: a.password })
  if (r.status !== 200) throw new Error('e2e: sign-in failed ' + JSON.stringify(r.json))
  const url = new URL(base)
  return r.cookie.split('; ').filter(Boolean).map((kv) => { const i = kv.indexOf('='); return { name: kv.slice(0, i), value: kv.slice(i + 1), domain: url.hostname, path: '/', httpOnly: true, sameSite: staff ? 'Strict' : 'Lax' } })
}
/** Fills the username/password form on /login or /staff/login. */
async function signIn(page, a) {
  await page.waitForSelector('input[name=username]', { timeout: 8000 })
  await page.fill('input[name=username]', a.username)
  await page.fill('input[name=password]', a.password)
  await page.click('form button[type=submit]')
}
/** A fresh client IP per browser context (honoured only when the server runs with TRUST_PROXY=1). */
module.exports = { accounts, signIn, sessionCookies, testIp: ip }
