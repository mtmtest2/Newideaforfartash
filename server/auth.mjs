// Website side of sign-in (browser ⇄ this server ⇄ CMS /api/identity/*).
//
// - The browser never sees a usable token. The CMS session JWT is sealed (AES-256-GCM) into an httpOnly cookie.
//   One cookie ("slot") per kind of session: members, and one per staff role (so e.g. a teacher panel and a reception
//   panel can be open side by side). Each cookie name is bound into the encryption (AAD), so a cookie can't be moved
//   to another slot, and the role inside is re-checked against the CMS anyway. Useless against the CMS API.
// - Cookies: HttpOnly, SameSite (Lax for members, Strict for staff), Secure + "__Host-" prefix on https.
// - Every state-changing call must be same-origin JSON (Origin/Sec-Fetch-Site checked) → no CSRF.
// - The audience (member/staff) comes from the URL, never from the request body.
// - Per-IP rate limits here, account lockout (5 tries / 15 min) and one-time-code limits in the CMS.
// - Page guards: /panel needs a member session; /teacher, /reception, /supervisor, /support-desk, /owner need a staff
//   session with exactly that role. Checked on the server before any panel HTML is sent.
import crypto from 'node:crypto'

const AREAS = [
  { re: /^\/panel(\/|$)/, aud: 'member', home: '/panel' },
  { re: /^\/teacher(\/|$)/, aud: 'staff', role: 'teacher', home: '/teacher' },
  { re: /^\/reception(\/|$)/, aud: 'staff', role: 'reception', home: '/reception' },
  { re: /^\/supervisor(\/|$)/, aud: 'staff', role: 'supervisor', home: '/supervisor' },
  { re: /^\/support-desk(\/|$)/, aud: 'staff', role: 'support', home: '/support-desk' },
  { re: /^\/owner(\/|$)/, aud: 'staff', role: 'owner', home: '/owner' },
]
const STAFF_ROLES = ['owner', 'support', 'supervisor', 'reception', 'teacher']
export const PROTECTED = /^\/(panel|teacher|reception|supervisor|support-desk|owner)(\/|$)/
const homeOf = (user) => (user.kind === 'member' ? '/panel' : AREAS.find((a) => a.role === user.role)?.home ?? '/staff/login')

export function createAuth({ SITE, CMS, SECRET, log }) {
  const secure = SITE.startsWith('https://')
  const siteOrigin = new URL(SITE).origin
  const pre = secure ? '__Host-' : ''
  const NAMES = { member: `${pre}fartash_m`, ...Object.fromEntries(STAFF_ROLES.map((r) => [r, `${pre}fartash_s_${r}`])) }
  const rawKey = process.env.SESSION_SECRET || ''
  if (secure && rawKey.length < 32) throw new Error('SESSION_SECRET (32+ chars) is required when SITE_URL is https')
  const key = rawKey ? crypto.createHash('sha256').update(rawKey).digest()
    : SECRET ? Buffer.from(crypto.hkdfSync('sha256', SECRET, 'fartash', 'session-cookie-dev', 32)) : null
  const trustProxy = process.env.TRUST_PROXY === '1'
  const enabled = !!(CMS && key)

  /* ---------- sealed cookies ---------- */
  function seal(slot, token, exp) {
    const iv = crypto.randomBytes(12)
    const c = crypto.createCipheriv('aes-256-gcm', key, iv)
    c.setAAD(Buffer.from(NAMES[slot]))
    const enc = Buffer.concat([c.update(JSON.stringify({ t: token, e: exp })), c.final()])
    return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url')
  }
  function unseal(slot, value) {
    try {
      const b = Buffer.from(value, 'base64url')
      if (b.length < 30) return null
      const d = crypto.createDecipheriv('aes-256-gcm', key, b.subarray(0, 12))
      d.setAAD(Buffer.from(NAMES[slot]))
      d.setAuthTag(b.subarray(12, 28))
      const v = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString())
      return typeof v.t === 'string' && v.e * 1000 > Date.now() ? v : null
    } catch { return null }
  }
  const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((p) => p.trim().split('=')).filter((p) => p.length >= 2).map(([k, ...v]) => [k, v.join('=')]))
  const cookie = (slot, value, maxAge) => `${NAMES[slot]}=${value}; Path=/; HttpOnly; SameSite=${slot === 'member' ? 'Lax' : 'Strict'}; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
  const clear = (slot) => cookie(slot, '', 0)
  const slotOf = (user) => (user.kind === 'member' ? 'member' : user.role)

  /* ---------- client ip + rate limits ---------- */
  const ip = (req) => {
    if (trustProxy) { const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean); if (xff.length) return xff[xff.length - 1] }
    return req.socket.remoteAddress || 'unknown'
  }
  const buckets = new Map()
  const limited = (bucket, max, windowMs) => {
    const now = Date.now(), b = buckets.get(bucket)
    if (!b || b.reset < now) { buckets.set(bucket, { n: 1, reset: now + windowMs }); return 0 }
    b.n++
    return b.n > max ? Math.ceil((b.reset - now) / 1000) : 0
  }
  setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k) }, 60000).unref()
  const LIMITS = { login: [10, 5 * 60e3], register: [5, 60 * 60e3], 'otp/request': [6, 10 * 60e3], 'otp/verify': [15, 10 * 60e3], password: [10, 15 * 60e3], admin: [120, 60e3], read: [240, 60e3] }

  /* ---------- CMS calls ---------- */
  async function call(path, { method = 'GET', token, body, clientIp } = {}) {
    const r = await fetch(CMS + '/api/identity' + path, {
      method, signal: AbortSignal.timeout(10000),
      headers: { 'x-fartash-internal': SECRET, 'x-fartash-client-ip': clientIp || '', ...(token ? { authorization: `JWT ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    let data = null
    try { data = await r.json() } catch { /* empty */ }
    return { status: r.status, data }
  }
  // short cache of "this token is valid" so every panel page view isn't a CMS round trip; logout/password evict it
  const meCache = new Map()
  const hash = (t) => crypto.createHash('sha256').update(t).digest('base64url')
  /** The account in one cookie slot ('member' or a staff role), validated by the CMS (cached 5 s). */
  async function userFor(req, slot) {
    if (!enabled) return null
    const raw = cookies(req)[NAMES[slot]]
    const s = raw && unseal(slot, raw)
    if (!s) return null
    const aud = slot === 'member' ? 'member' : 'staff'
    const h = hash(s.t), hit = meCache.get(h)
    let user
    if (hit && hit.until > Date.now()) user = hit.user
    else {
      const r = await call(`/me?audience=${aud}`, { token: s.t }).catch(() => ({ status: 0 }))
      user = r.status === 200 ? r.data.user : null
      if (r.status === 200 || r.status === 401) meCache.set(h, { user, until: Date.now() + 5000 })
      if (meCache.size > 5000) meCache.clear()
    }
    // a staff cookie only counts for the role it was issued for (role changes end every session anyway)
    return user && (slot === 'member' || user.role === slot) ? user : null
  }
  const tokenOf = (req, slot) => { const raw = cookies(req)[NAMES[slot]]; return (raw && unseal(slot, raw))?.t ?? null }
  /** First signed-in staff role in this browser (for "already signed in" on the staff login page). */
  async function anyStaff(req) { for (const r of STAFF_ROLES) { const u = cookies(req)[NAMES[r]] && await userFor(req, r); if (u) return u } return null }

  /* ---------- HTTP helpers ---------- */
  const sendJson = (res, status, data, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', ...headers })
    res.end(JSON.stringify(data))
  }
  const readBody = (req) => new Promise((resolve) => {
    let size = 0; const chunks = []
    req.on('data', (c) => { size += c.length; if (size > 8192) { req.destroy(); resolve(null) } else chunks.push(c) })
    req.on('end', () => { try { const v = JSON.parse(Buffer.concat(chunks).toString() || '{}'); resolve(v && typeof v === 'object' && !Array.isArray(v) ? v : null) } catch { resolve(null) } })
    req.on('error', () => resolve(null))
  })
  const sameOrigin = (req) => {
    const origin = req.headers.origin
    if (origin) return origin === siteOrigin
    return req.headers['sec-fetch-site'] === 'same-origin'
  }
  /** Only same-area relative paths are allowed as a post-login destination (no open redirects). */
  const safeNext = (next, user) => {
    const home = homeOf(user)
    if (typeof next !== 'string' || !/^\/[a-z0-9\-/]*$/i.test(next) || next.includes('//')) return home
    return next === home || next.startsWith(home + '/') ? next : home
  }

  /** Handles /api/auth/*. Returns true when the request was answered. */
  async function handle(req, res, pathname, searchParams) {
    if (!pathname.startsWith('/api/auth/')) return false
    if (!enabled) { sendJson(res, 503, { error: 'auth_unavailable', message: 'ورود موقتاً در دسترس نیست.' }); return true }
    let rest = pathname.slice('/api/auth/'.length)
    let aud = 'member'
    if (rest.startsWith('staff/')) { aud = 'staff'; rest = rest.slice(6) }
    const admin = rest.startsWith('admin/')
    if (admin) aud = 'staff'
    // staff calls name their role (?role=teacher); the matching cookie is used
    const qRole = searchParams.get('role')
    const role = STAFF_ROLES.includes(qRole) ? qRole : null
    const slot = aud === 'member' ? 'member' : role
    const method = req.method
    const clientIp = ip(req)

    if (method === 'GET' && rest === 'config') {
      const r = await call('/config').catch(() => ({ status: 0, data: null }))
      sendJson(res, 200, { otp: !!r.data?.otp }); return true
    }
    if (method === 'GET' && rest === 'me') {
      if (limited(`read:${clientIp}`, ...LIMITS.read)) { sendJson(res, 429, { error: 'rate_limited' }); return true }
      const user = slot ? await userFor(req, slot) : await anyStaff(req)
      // signed out is a normal answer here (200 + null), not an error
      const stale = slot && !user && cookies(req)[NAMES[slot]]
      sendJson(res, 200, { user: user ?? null, home: user ? homeOf(user) : null }, stale ? { 'Set-Cookie': clear(slot) } : {}); return true
    }
    // admin API: the owner's session if present, else support's (owner can do everything support can)
    const adminSlot = admin ? (tokenOf(req, 'owner') ? 'owner' : 'support') : null
    if (admin && method === 'GET') {
      const token = tokenOf(req, adminSlot)
      if (!token) { sendJson(res, 401, { error: 'unauthenticated' }); return true }
      if (limited(`read:${clientIp}`, ...LIMITS.read)) { sendJson(res, 429, { error: 'rate_limited' }); return true }
      const q = new URLSearchParams()
      for (const k of ['q', 'page']) if (searchParams.get(k)) q.set(k, searchParams.get(k).slice(0, 60))
      const r = await call('/' + rest + (q.size ? `?${q}` : ''), { token, clientIp })
      sendJson(res, r.status, r.data); return true
    }
    if (method !== 'POST') { sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET, POST' }); return true }
    // ---- state-changing calls: same-origin JSON only ----
    if (!sameOrigin(req) || !String(req.headers['content-type'] || '').startsWith('application/json')) { sendJson(res, 403, { error: 'forbidden', message: 'درخواست نامعتبر' }); return true }
    const body = await readBody(req)
    if (!body) { sendJson(res, 400, { error: 'bad_request', message: 'درخواست نامعتبر' }); return true }
    const limitKey = admin ? 'admin' : rest
    if (LIMITS[limitKey]) {
      const wait = limited(`${limitKey}:${aud}:${clientIp}`, ...LIMITS[limitKey])
      if (wait) { sendJson(res, 429, { error: 'rate_limited', message: `تعداد تلاش‌ها زیاد است؛ ${Math.ceil(wait / 60)} دقیقهٔ دیگر دوباره امتحان کنید.`, retryAfter: wait }, { 'Retry-After': String(wait) }); return true }
    }

    if (admin) {
      const token = tokenOf(req, adminSlot)
      if (!token) { sendJson(res, 401, { error: 'unauthenticated' }); return true }
      const r = await call('/' + rest, { method: 'POST', token, body, clientIp })
      sendJson(res, r.status, r.data); return true
    }
    if (rest === 'logout') {
      // staff without ?role= signs out every staff role in this browser
      const slots = slot ? [slot] : STAFF_ROLES
      const headers = []
      for (const sl of slots) {
        const token = tokenOf(req, sl)
        if (token) { meCache.delete(hash(token)); await call('/logout', { method: 'POST', token, clientIp }).catch(() => null) }
        if (cookies(req)[NAMES[sl]] !== undefined || slot) headers.push(clear(sl))
      }
      sendJson(res, 200, { ok: true }, headers.length ? { 'Set-Cookie': headers } : {}); return true
    }
    if (rest === 'password' || rest === 'profile') {
      const token = slot && tokenOf(req, slot)
      if (!token) { sendJson(res, 401, { error: 'unauthenticated', message: 'وارد نشده‌اید.' }); return true }
      const payload = rest === 'password' ? { current: body.current, next: body.next } : { name: body.name }
      const r = await call('/' + rest, { method: 'POST', token, body: { ...payload, audience: aud }, clientIp })
      meCache.delete(hash(token))
      if (r.status === 200 && r.data?.token) { // password change: every old session is gone, this device gets a new one
        const { token: t, exp } = r.data
        sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookie(slot, seal(slot, t, exp), Math.max(60, exp - Math.floor(Date.now() / 1000))) }); return true
      }
      sendJson(res, r.status, r.data); return true
    }
    const ROUTES = { login: ['username', 'password'], 'otp/request': ['phone'], 'otp/verify': ['phone', 'code', 'name'], register: ['name', 'username', 'password'] }
    if (!ROUTES[rest] || (rest === 'register' && aud !== 'member')) { sendJson(res, 404, { error: 'not_found' }); return true }
    const clean = Object.fromEntries(ROUTES[rest].filter((k) => typeof body[k] === 'string').map((k) => [k, body[k].slice(0, 200)]))
    const r = await call('/' + rest, { method: 'POST', body: { ...clean, audience: aud }, clientIp })
    if (r.status >= 200 && r.status < 300 && r.data?.token) {
      const { token, exp, user, isNew } = r.data
      const sl = slotOf(user)
      if (!NAMES[sl]) { sendJson(res, 500, { error: 'server_error' }); return true }
      const maxAge = Math.max(60, exp - Math.floor(Date.now() / 1000))
      sendJson(res, r.status, { user, isNew: !!isNew, redirect: safeNext(body.next, user) }, { 'Set-Cookie': cookie(sl, seal(sl, token, exp), maxAge) })
      if (aud === 'staff') log(`auth: staff ${user.username} (${user.role}) signed in from ${clientIp}`)
      return true
    }
    sendJson(res, r.status || 502, r.data ?? { error: 'unavailable', message: 'ورود موقتاً در دسترس نیست.' }); return true
  }

  /** Page guard for panel areas. Returns null when allowed, or a redirect location. */
  async function guard(req, pathname, search) {
    const area = AREAS.find((a) => a.re.test(pathname))
    if (!area) return null
    const next = encodeURIComponent(pathname + (search || ''))
    const loginPage = area.aud === 'member' ? '/login' : '/staff/login'
    if (!enabled) return `${loginPage}?next=${next}`
    const user = await userFor(req, area.aud === 'member' ? 'member' : area.role)
    return user ? null : `${loginPage}?next=${next}`
  }

  return { handle, guard, enabled, userFor }
}
