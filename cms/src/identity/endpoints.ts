// /api/identity/* — sign-up, sign-in (username+password, phone+one-time code), session, profile and the account
// management used by the owner/support dashboards. Called ONLY by the Fartash web server (internal key header);
// Caddy also blocks /api/identity/* on the CMS domain. Every rule is enforced here, server-side.
import { randomBytes, randomInt } from 'node:crypto'
import type { Endpoint, PayloadRequest, Where } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { can, MANAGEABLE_ROLES, ROLE_LABELS, STAFF_ROLES, type StaffRole } from '../access/permissions'
import { faDateTime } from '../lib/labels'
import { isDevProvider, smsProvider } from './sms'
import { currentSid, issueSession, revokeSessions } from './session'
import { atLeast, body, cleanName, clientIp, fail, hmac, internalCall, json, normalizePhone, normalizeUsername, passwordProblem, safeEqual } from './util'

type Doc = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
type Audience = 'member' | 'staff'
const COLL = { member: 'members', staff: 'staff' } as const
const OTP_TTL = 120 // seconds
const OTP_RESEND = 60
const OTP_MAX_ATTEMPTS = 5
const BAD_LOGIN = 'نام کاربری یا رمز عبور درست نیست. اگر چند بار اشتباه وارد کرده‌اید، ۱۵ دقیقه بعد دوباره امتحان کنید.'
const BAD_CODE = 'کد واردشده درست نیست یا منقضی شده است.'
const audienceOf = (v: unknown): Audience | null => (v === 'member' || v === 'staff' ? v : null)
const isLocked = (d: Doc) => !!d.lockUntil && new Date(d.lockUntil) > new Date()

export const memberDTO = (d: Doc) => ({
  kind: 'member' as const, id: d.id, name: d.name, username: d.username, phone: d.phone ?? null,
  phoneVerified: !!d.phoneVerifiedAt, passwordSet: d.passwordSet !== false, createdAt: d.createdAt,
})
export const staffDTO = (d: Doc) => ({
  kind: 'staff' as const, id: d.id, name: d.name, username: d.username, email: d.email ?? null, role: d.role as StaffRole,
  roleLabel: ROLE_LABELS[d.role as StaffRole] ?? d.role, phone: d.phone ?? null, createdAt: d.createdAt,
})
const adminRow = (d: Doc, kind: Audience) => ({
  ...(kind === 'staff' ? staffDTO(d) : memberDTO(d)), active: d.active !== false, locked: isLocked(d), lastLoginAt: d.lastLoginAt ?? null,
})

/** Audit for identity events (members have no collection hook; logins and admin actions are recorded here). */
async function audit(req: PayloadRequest, action: string, entity: string, entityId: string | number | null, summary: string, after?: unknown) {
  const u = req.user as Doc | null
  await req.payload.create({
    collection: 'audit-logs', overrideAccess: true, req, context: { skipAudit: true },
    data: {
      action, entity, entityId: entityId != null ? String(entityId) : undefined, summary,
      actor: u?.collection === 'staff' ? u.id : undefined, actorLabel: u ? `${u.collection}:${u.id}` : 'system',
      actorName: u?.name ?? 'سامانه', actorRole: u?.role ?? (u ? u.collection : 'system'),
      after: (after ?? null) as never, result: 'success',
    },
  })
}

const internal = (fn: (req: PayloadRequest) => Promise<Response>) => async (req: PayloadRequest) => {
  if (!internalCall(req)) return fail(404, 'not_found', 'Not found')
  try { return await fn(req) } catch (e) {
    req.payload.logger.error({ err: e, msg: 'identity endpoint failed' })
    return fail(500, 'server_error', 'خطای سرور؛ چند لحظه بعد دوباره امتحان کنید.')
  }
}
/** The signed-in account for this request, only if it belongs to the expected audience and is active. */
function who(req: PayloadRequest, aud: Audience): Doc | null {
  const u = req.user as Doc | null
  return u && u.collection === COLL[aud] && u.active !== false ? u : null
}
async function stampLogin(req: PayloadRequest, aud: Audience, id: number | string) {
  await req.payload.db.updateOne({ collection: COLL[aud], id, data: { lastLoginAt: new Date().toISOString(), updatedAt: null } as never, req, returning: false })
}
const uniqueViolation = (e: unknown, field: string) => {
  const err = e as { data?: { errors?: { path?: string }[] }; message?: string }
  return !!err?.data?.errors?.some((x) => x.path === field) || (err?.message ?? '').includes(field)
}

/* ---------------- sign-up / sign-in ---------------- */
const register: Endpoint = { path: '/identity/register', method: 'post', handler: internal(async (req) => {
  const b = await body(req)
  const name = cleanName(b.name)
  const username = normalizeUsername(b.username)
  if (name.length < 2) return fail(400, 'invalid_name', 'نام و نام خانوادگی را وارد کنید.')
  if (!username) return fail(400, 'invalid_username', 'نام کاربری: ۴ تا ۳۰ حرف لاتین، عدد، نقطه یا _ و شروع با حرف.')
  const problem = passwordProblem(b.password, username)
  if (problem) return fail(400, 'weak_password', problem)
  let doc: Doc
  try {
    doc = await req.payload.create({ collection: 'members', overrideAccess: true, req,
      data: { name, username, password: b.password as string, active: true, passwordSet: true } as never })
  } catch (e) {
    if (uniqueViolation(e, 'username')) return fail(409, 'username_taken', 'این نام کاربری قبلاً گرفته شده است.')
    throw e
  }
  const s = await issueSession(req.payload, req, 'members', doc as never)
  await stampLogin(req, 'member', doc.id)
  return json({ ...s, user: memberDTO(doc) }, 201)
}) }

const login: Endpoint = { path: '/identity/login', method: 'post', handler: internal(async (req) => {
  const b = await body(req)
  const aud = audienceOf(b.audience)
  if (!aud) return fail(400, 'bad_request', 'درخواست نامعتبر')
  const raw = typeof b.username === 'string' ? b.username.trim() : ''
  const password = typeof b.password === 'string' ? b.password : ''
  if (!raw || !password || password.length > 128) return atLeast(700, Promise.resolve(fail(401, 'invalid_credentials', BAD_LOGIN)))
  const asEmail = aud === 'staff' && raw.includes('@')
  const username = asEmail ? null : normalizeUsername(raw)
  if (!asEmail && !username) return atLeast(700, Promise.resolve(fail(401, 'invalid_credentials', BAD_LOGIN)))
  req.context = { ...(req.context ?? {}), siteLogin: true }
  const result = await atLeast(700, (async () => {
    try {
      return await req.payload.login({ collection: COLL[aud], req, context: { siteLogin: true },
        data: (asEmail ? { email: raw.toLowerCase(), password } : { username: username!, password }) as never })
    } catch { return null }
  })())
  if (!result?.token || !result.user) {
    if (aud === 'staff') await audit(req, 'auth.login.failed', 'auth', null, `ورود ناموفق به بخش کارکنان با نام کاربری «${raw.slice(0, 40)}»`, { ip: clientIp(req) })
    return fail(401, 'invalid_credentials', BAD_LOGIN)
  }
  const user = result.user as Doc
  await stampLogin(req, aud, user.id)
  if (aud === 'staff') await audit(req, 'auth.login', 'auth', user.id, `${user.name} (${ROLE_LABELS[user.role as StaffRole]}) وارد شد`, { ip: clientIp(req) })
  return json({ token: result.token, exp: result.exp, user: aud === 'staff' ? staffDTO(user) : memberDTO(user) })
}) }

/* ---------------- one-time codes ---------------- */
const config: Endpoint = { path: '/identity/config', method: 'get', handler: internal(async () => json({ otp: !!smsProvider() })) }

const otpRequest: Endpoint = { path: '/identity/otp/request', method: 'post', handler: internal(async (req) => {
  const provider = smsProvider()
  if (!provider) return fail(503, 'otp_unavailable', 'ورود با کد پیامکی هنوز فعال نشده است؛ فعلاً با نام کاربری و رمز عبور وارد شوید.')
  const b = await body(req)
  const aud = audienceOf(b.audience)
  const phone = normalizePhone(b.phone)
  if (!aud) return fail(400, 'bad_request', 'درخواست نامعتبر')
  if (!phone) return fail(400, 'invalid_phone', 'شمارهٔ موبایل معتبر نیست؛ مثل ۰۹۱۲۱۲۳۴۵۶۷')
  const phoneHash = hmac('phone', phone), ipHash = hmac('ip', clientIp(req))
  const since = (s: number) => new Date(Date.now() - s * 1000).toISOString()
  const count = async (where: Where) => (await req.payload.count({ collection: 'otp-challenges', overrideAccess: true, req, where })).totalDocs
  const recent = await req.payload.find({ collection: 'otp-challenges', overrideAccess: true, req, limit: 1, sort: '-createdAt',
    where: { and: [{ phoneHash: { equals: phoneHash } }, { createdAt: { greater_than: since(OTP_RESEND) } }] } })
  if (recent.docs[0]) {
    const wait = Math.max(1, OTP_RESEND - Math.floor((Date.now() - new Date(recent.docs[0].createdAt as string).getTime()) / 1000))
    return fail(429, 'too_soon', `برای ارسال دوبارهٔ کد ${wait} ثانیه صبر کنید.`, { retryAfter: wait })
  }
  if (await count({ and: [{ phoneHash: { equals: phoneHash } }, { createdAt: { greater_than: since(3600) } }] }) >= 5
    || await count({ and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: since(3600) } }] }) >= 20) {
    return fail(429, 'rate_limited', 'تعداد درخواست‌ها زیاد است؛ یک ساعت بعد دوباره امتحان کنید.', { retryAfter: 3600 })
  }
  // staff: send only to an active staff account with this phone; the response is identical either way
  const eligible = aud === 'member' ? true : !!(await req.payload.find({ collection: 'staff', overrideAccess: true, req, limit: 1, depth: 0,
    where: { and: [{ phone: { equals: phone } }, { active: { not_equals: false } }] } })).docs[0]
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  // older pending codes for this phone stop working
  await req.payload.db.updateMany({ collection: 'otp-challenges', req, data: { consumedAt: new Date().toISOString() } as never,
    where: { and: [{ phoneHash: { equals: phoneHash } }, { audience: { equals: aud } }, { consumedAt: { exists: false } }] } })
  await req.payload.create({ collection: 'otp-challenges', overrideAccess: true, req, data: {
    audience: aud, phoneHash, ipHash, codeHash: hmac('otp', `${aud}:${phone}:${code}`),
    expiresAt: new Date(Date.now() + OTP_TTL * 1000).toISOString(), attempts: 0,
  } })
  if (eligible) await provider.sendOtp(phone, code)
  return json({ ok: true, ttl: OTP_TTL, resendIn: OTP_RESEND, ...(isDevProvider(provider) && eligible ? { devCode: code } : {}) })
}) }

const otpVerify: Endpoint = { path: '/identity/otp/verify', method: 'post', handler: internal(async (req) => {
  if (!smsProvider()) return fail(503, 'otp_unavailable', 'ورود با کد پیامکی هنوز فعال نشده است.')
  const b = await body(req)
  const aud = audienceOf(b.audience)
  const phone = normalizePhone(b.phone)
  const code = typeof b.code === 'string' ? b.code.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).trim() : ''
  if (!aud || !phone || !/^\d{6}$/.test(code)) return fail(400, 'invalid_code', BAD_CODE)
  const phoneHash = hmac('phone', phone)
  const ch = (await req.payload.find({ collection: 'otp-challenges', overrideAccess: true, req, limit: 1, sort: '-createdAt', where: { and: [
    { phoneHash: { equals: phoneHash } }, { audience: { equals: aud } }, { consumedAt: { exists: false } },
    { expiresAt: { greater_than: new Date().toISOString() } }] } })).docs[0] as Doc | undefined
  if (!ch) return fail(400, 'invalid_code', BAD_CODE)
  // count the attempt atomically before comparing (no parallel guessing)
  const db = req.payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows: { attempts: number }[] }> } }
  const upd = await db.drizzle.execute(sql`UPDATE "cms"."otp_challenges" SET "attempts" = "attempts" + 1 WHERE "id" = ${ch.id} AND "consumed_at" IS NULL AND "attempts" < ${OTP_MAX_ATTEMPTS} RETURNING "attempts"`)
  const attempts = upd.rows[0]?.attempts
  if (attempts == null) return fail(400, 'invalid_code', 'تعداد تلاش‌ها تمام شد؛ کد تازه بگیرید.')
  if (!safeEqual(ch.codeHash, hmac('otp', `${aud}:${phone}:${code}`))) {
    const left = OTP_MAX_ATTEMPTS - attempts
    return fail(400, 'invalid_code', left > 0 ? `${BAD_CODE} (${left} تلاش دیگر)` : 'تعداد تلاش‌ها تمام شد؛ کد تازه بگیرید.', { attemptsLeft: left })
  }
  const used = await db.drizzle.execute(sql`UPDATE "cms"."otp_challenges" SET "consumed_at" = now() WHERE "id" = ${ch.id} AND "consumed_at" IS NULL RETURNING "attempts"`)
  if (!used.rows[0]) return fail(400, 'invalid_code', BAD_CODE)

  if (aud === 'staff') {
    const s = (await req.payload.find({ collection: 'staff', overrideAccess: true, req, limit: 1, depth: 0, showHiddenFields: true,
      where: { phone: { equals: phone } } })).docs[0] as Doc | undefined
    if (!s || s.active === false) return fail(400, 'invalid_code', BAD_CODE)
    const sess = await issueSession(req.payload, req, 'staff', s as never)
    await stampLogin(req, 'staff', s.id)
    req.user = { ...s, collection: 'staff' } as never
    await audit(req, 'auth.login', 'auth', s.id, `${s.name} (${ROLE_LABELS[s.role as StaffRole]}) با کد پیامکی وارد شد`, { ip: clientIp(req) })
    return json({ ...sess, user: staffDTO(s) })
  }
  let m = (await req.payload.find({ collection: 'members', overrideAccess: true, req, limit: 1, depth: 0, showHiddenFields: true,
    where: { phone: { equals: phone } } })).docs[0] as Doc | undefined
  let isNew = false
  if (m && m.active === false) return fail(400, 'invalid_code', BAD_CODE)
  if (!m) {
    isNew = true
    const name = cleanName(b.name) || 'کاربر فرتاش'
    for (let i = 0; i < 5 && !m; i++) {
      const username = 'u' + randomBytes(6).toString('hex').slice(0, 9)
      try {
        m = await req.payload.create({ collection: 'members', overrideAccess: true, req, data: {
          name, username, password: randomBytes(24).toString('base64url'), phone, phoneVerifiedAt: new Date().toISOString(), active: true, passwordSet: false,
        } as never }) as Doc
      } catch (e) { if (!uniqueViolation(e, 'username')) throw e }
    }
    if (!m) throw new Error('could not allocate username')
  } else if (!m.phoneVerifiedAt) {
    await req.payload.db.updateOne({ collection: 'members', id: m.id, data: { phoneVerifiedAt: new Date().toISOString(), updatedAt: null } as never, req, returning: false })
  }
  const sess = await issueSession(req.payload, req, 'members', m as never)
  await stampLogin(req, 'member', m.id)
  return json({ ...sess, user: memberDTO(m), isNew })
}) }

/* ---------------- current session ---------------- */
const me: Endpoint = { path: '/identity/me', method: 'get', handler: internal(async (req) => {
  const aud = audienceOf(new URL(req.url ?? 'http://x').searchParams.get('audience'))
  const u = aud && who(req, aud)
  if (!u) return fail(401, 'unauthenticated', 'وارد نشده‌اید.')
  return json({ user: aud === 'staff' ? staffDTO(u) : memberDTO(u) })
}) }

const logout: Endpoint = { path: '/identity/logout', method: 'post', handler: internal(async (req) => {
  const u = req.user as Doc | null
  const sid = currentSid(req)
  if (u && sid && (u.collection === 'members' || u.collection === 'staff')) await revokeSessions(req.payload, req, u.collection, u.id, sid)
  return json({ ok: true })
}) }

const password: Endpoint = { path: '/identity/password', method: 'post', handler: internal(async (req) => {
  const b = await body(req)
  const aud = audienceOf(b.audience)
  const u = aud && who(req, aud)
  if (!aud || !u) return fail(401, 'unauthenticated', 'وارد نشده‌اید.')
  const problem = passwordProblem(b.next, u.username)
  if (problem) return fail(400, 'weak_password', problem)
  // accounts created by phone code have no password yet; everyone else must prove the current one
  if (!(aud === 'member' && u.passwordSet === false)) {
    req.context = { ...(req.context ?? {}), siteLogin: true }
    const ok = await atLeast(500, req.payload.login({ collection: COLL[aud], req, context: { siteLogin: true },
      data: { username: u.username, password: typeof b.current === 'string' ? b.current : '' } as never }).then(() => true, () => false))
    if (!ok) return fail(400, 'wrong_password', 'رمز عبور فعلی درست نیست.')
  }
  await req.payload.update({ collection: COLL[aud], id: u.id, overrideAccess: true, req, data: { password: b.next as string, ...(aud === 'member' ? { passwordSet: true } : {}) } as never })
  // sign out every device (Payload also drops sessions on a password change), then give THIS device a fresh session
  await revokeSessions(req.payload, req, COLL[aud], u.id)
  const fresh = (await req.payload.find({ collection: COLL[aud], overrideAccess: true, req, limit: 1, depth: 0, showHiddenFields: true, where: { id: { equals: u.id } } })).docs[0] as Doc
  const sess = await issueSession(req.payload, req, COLL[aud], fresh as never)
  if (aud === 'staff') await audit(req, 'auth.password', 'auth', u.id, `${u.name} رمز عبور خود را تغییر داد`)
  return json({ ok: true, ...sess })
}) }

const profile: Endpoint = { path: '/identity/profile', method: 'post', handler: internal(async (req) => {
  const b = await body(req)
  const aud = audienceOf(b.audience)
  const u = aud && who(req, aud)
  if (!aud || !u) return fail(401, 'unauthenticated', 'وارد نشده‌اید.')
  const name = cleanName(b.name)
  if (name.length < 2) return fail(400, 'invalid_name', 'نام را کامل وارد کنید.')
  const doc = await req.payload.update({ collection: COLL[aud], id: u.id, overrideAccess: true, req, data: { name } as never })
  return json({ user: aud === 'staff' ? staffDTO(doc as Doc) : memberDTO(doc as Doc) })
}) }

/* ---------------- account management (owner / support dashboards) ---------------- */
const staffActor = (req: PayloadRequest) => who(req, 'staff')
const forbid = () => fail(403, 'forbidden', 'دسترسی ندارید.')
const idParam = (req: PayloadRequest) => { const n = Number((req.routeParams as Record<string, unknown>)?.id); return Number.isInteger(n) && n > 0 ? n : null }

const overview: Endpoint = { path: '/identity/admin/overview', method: 'get', handler: internal(async (req) => {
  if (!staffActor(req) || !(can(req, 'accounts.members') || can(req, 'accounts.staff.basic'))) return forbid()
  const p = req.payload
  const c = (collection: 'members' | 'staff', where?: Where) => p.count({ collection, overrideAccess: true, req, where }).then((r) => r.totalDocs)
  const week = new Date(Date.now() - 7 * 864e5).toISOString()
  const now = new Date().toISOString()
  const [members, activeMembers, newMembers, verified, lockedM, lockedS, ...byRole] = await Promise.all([
    c('members'), c('members', { active: { not_equals: false } }), c('members', { createdAt: { greater_than: week } }),
    c('members', { phoneVerifiedAt: { exists: true } }), c('members', { lockUntil: { greater_than: now } }), c('staff', { lockUntil: { greater_than: now } }),
    ...STAFF_ROLES.map((r) => c('staff', { and: [{ role: { equals: r } }, { active: { not_equals: false } }] })),
  ])
  const activity = can(req, 'audit.read') ? (await p.find({ collection: 'audit-logs', overrideAccess: true, req, limit: 7, sort: '-createdAt', depth: 0,
    where: { entity: { in: ['auth', 'members', 'staff'] } } })).docs.map((d) => ({ id: d.id, summary: d.summary, at: d.createdAt, when: faDateTime(d.createdAt as string) })) : []
  return json({
    members: { total: members, active: activeMembers, newThisWeek: newMembers, phoneVerified: verified, locked: lockedM },
    staff: Object.fromEntries(STAFF_ROLES.map((r, i) => [r, byRole[i]])), staffLocked: lockedS,
    otpEnabled: !!smsProvider(), activity, manageableRoles: MANAGEABLE_ROLES(req),
    contentHubUrl: `${(process.env.CMS_PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, '')}/support`,
  })
}) }

const listStaff: Endpoint = { path: '/identity/admin/staff', method: 'get', handler: internal(async (req) => {
  if (!staffActor(req) || !can(req, 'accounts.staff.basic')) return forbid()
  // each caller sees only the accounts it may manage (support never sees owners/support/supervisors)
  const r = await req.payload.find({ collection: 'staff', overrideAccess: true, req, limit: 200, sort: 'name', depth: 0, showHiddenFields: true,
    where: { role: { in: MANAGEABLE_ROLES(req) } } })
  return json({ docs: r.docs.map((d) => adminRow(d as Doc, 'staff')), manageableRoles: MANAGEABLE_ROLES(req) })
}) }

const createStaff: Endpoint = { path: '/identity/admin/staff', method: 'post', handler: internal(async (req) => {
  if (!staffActor(req) || !can(req, 'accounts.staff.basic')) return forbid()
  const b = await body(req)
  const role = b.role as StaffRole
  if (!MANAGEABLE_ROLES(req).includes(role)) return fail(403, 'role_not_allowed', 'ساخت حساب با این نقش برای شما مجاز نیست.')
  const name = cleanName(b.name), username = normalizeUsername(b.username)
  const phone = b.phone ? normalizePhone(b.phone) : null
  if (name.length < 2) return fail(400, 'invalid_name', 'نام را کامل وارد کنید.')
  if (!username) return fail(400, 'invalid_username', 'نام کاربری: ۴ تا ۳۰ حرف لاتین، عدد، نقطه یا _ و شروع با حرف.')
  if (b.phone && !phone) return fail(400, 'invalid_phone', 'شمارهٔ موبایل معتبر نیست.')
  const problem = passwordProblem(b.password, username)
  if (problem) return fail(400, 'weak_password', problem)
  try {
    req.context = { ...(req.context ?? {}), trustedStaffCreate: true }
    const doc = await req.payload.create({ collection: 'staff', overrideAccess: true, req, data: { name, username, role, password: b.password as string, active: true, ...(phone ? { phone } : {}) } as never })
    return json({ user: adminRow(doc as Doc, 'staff') }, 201)
  } catch (e) {
    if (uniqueViolation(e, 'username')) return fail(409, 'username_taken', 'این نام کاربری قبلاً گرفته شده است.')
    if (uniqueViolation(e, 'phone')) return fail(409, 'phone_taken', 'این شماره برای حساب دیگری ثبت شده است.')
    throw e
  }
}) }

type Action = 'activate' | 'deactivate' | 'unlock' | 'signout' | 'password' | 'role'
async function act(req: PayloadRequest, kind: Audience, id: number, b: Record<string, unknown>) {
  const coll = COLL[kind]
  const target = (await req.payload.find({ collection: coll, overrideAccess: true, req, limit: 1, depth: 0, showHiddenFields: true, where: { id: { equals: id } } })).docs[0] as Doc | undefined
  if (!target) return fail(404, 'not_found', 'حساب پیدا نشد.')
  const me = staffActor(req)!
  const action = b.action as Action
  if (kind === 'staff') {
    // the caller must be allowed to manage the target's CURRENT role (and the new one, for role changes)
    if (!MANAGEABLE_ROLES(req).includes(target.role)) return forbid()
    const self = target.id === me.id
    if (self && ['deactivate', 'role'].includes(action)) return fail(400, 'self', 'نقش یا وضعیت حساب خودتان را نمی‌توانید تغییر دهید.')
    if (target.role === 'owner' && ['deactivate', 'role'].includes(action)) {
      const owners = await req.payload.count({ collection: 'staff', overrideAccess: true, req, where: { and: [{ role: { equals: 'owner' } }, { active: { not_equals: false } }] } })
      if (owners.totalDocs <= 1) return fail(400, 'last_owner', 'آخرین مالک فعال را نمی‌توان غیرفعال کرد یا نقشش را تغییر داد.')
    }
  }
  const label = `${kind === 'staff' ? ROLE_LABELS[target.role as StaffRole] : 'کاربر'} «${target.name}»`
  // explicit audit entries below say exactly what happened (the generic collection hook would only say "edited")
  const update = (data: Doc) => req.payload.update({ collection: coll, id, overrideAccess: true, req, context: { skipAudit: true }, data: data as never })
  switch (action) {
    case 'activate': await update({ active: true }); break
    case 'deactivate': await update({ active: false }); await revokeSessions(req.payload, req, coll, id); break
    case 'unlock': await req.payload.db.updateOne({ collection: coll, id, data: { loginAttempts: 0, lockUntil: null, updatedAt: null } as never, req, returning: false }); break
    case 'signout': await revokeSessions(req.payload, req, coll, id); break
    case 'password': {
      const problem = passwordProblem(b.password, target.username)
      if (problem) return fail(400, 'weak_password', problem)
      await update({ password: b.password, ...(kind === 'member' ? { passwordSet: true } : {}) })
      await revokeSessions(req.payload, req, coll, id)
      await req.payload.db.updateOne({ collection: coll, id, data: { loginAttempts: 0, lockUntil: null, updatedAt: null } as never, req, returning: false })
      break
    }
    case 'role': {
      if (kind !== 'staff' || !MANAGEABLE_ROLES(req).includes(b.role as StaffRole)) return fail(403, 'role_not_allowed', 'این نقش برای شما مجاز نیست.')
      await update({ role: b.role }); await revokeSessions(req.payload, req, coll, id); break
    }
    default: return fail(400, 'bad_request', 'درخواست نامعتبر')
  }
  const verb: Record<Action, string> = { activate: 'را فعال کرد', deactivate: 'را غیرفعال کرد', unlock: 'را از قفل خارج کرد', signout: 'را از همهٔ دستگاه‌ها خارج کرد',
    password: 'را با رمز تازه تنظیم کرد', role: `را به نقش «${ROLE_LABELS[b.role as StaffRole]}» تغییر داد` }
  await audit(req, `account.${action}`, coll, id, `${me.name} ${label} ${verb[action]}`)
  const fresh = (await req.payload.find({ collection: coll, overrideAccess: true, req, limit: 1, depth: 0, showHiddenFields: true, where: { id: { equals: id } } })).docs[0] as Doc
  return json({ user: adminRow(fresh, kind) })
}

const staffAction: Endpoint = { path: '/identity/admin/staff/:id', method: 'post', handler: internal(async (req) => {
  const id = idParam(req)
  if (!staffActor(req) || !can(req, 'accounts.staff.basic')) return forbid()
  if (!id) return fail(400, 'bad_request', 'درخواست نامعتبر')
  return act(req, 'staff', id, await body(req))
}) }

const listMembers: Endpoint = { path: '/identity/admin/members', method: 'get', handler: internal(async (req) => {
  if (!staffActor(req) || !can(req, 'accounts.members')) return forbid()
  const sp = new URL(req.url ?? 'http://x').searchParams
  const q = (sp.get('q') ?? '').trim().slice(0, 60)
  const page = Math.max(1, Math.min(500, Number(sp.get('page')) || 1))
  const phone = normalizePhone(q)
  const where: Where | undefined = q ? { or: [{ name: { like: q } }, { username: { like: q.toLowerCase() } }, ...(phone ? [{ phone: { equals: phone } }] : [])] } : undefined
  const r = await req.payload.find({ collection: 'members', overrideAccess: true, req, where, limit: 20, page, sort: '-createdAt', depth: 0, showHiddenFields: true })
  return json({ docs: r.docs.map((d) => adminRow(d as Doc, 'member')), page: r.page, totalPages: r.totalPages, totalDocs: r.totalDocs })
}) }

const memberAction: Endpoint = { path: '/identity/admin/members/:id', method: 'post', handler: internal(async (req) => {
  const id = idParam(req)
  if (!staffActor(req) || !can(req, 'accounts.members')) return forbid()
  if (!id) return fail(400, 'bad_request', 'درخواست نامعتبر')
  const b = await body(req)
  if (b.action === 'role') return fail(400, 'bad_request', 'درخواست نامعتبر')
  return act(req, 'member', id, b)
}) }

export const identityEndpoints: Endpoint[] = [
  config, register, login, otpRequest, otpVerify, me, logout, password, profile,
  overview, listStaff, createStaff, staffAction, listMembers, memberAction,
]
