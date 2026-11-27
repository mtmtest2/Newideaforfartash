// Shared helpers for the identity endpoints (/api/identity/*). Server-side only.
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PayloadRequest } from 'payload'

const isProd = () => process.env.NODE_ENV === 'production'

/** Persian/Arabic digits → Latin. */
export const latinDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))

/** Iranian mobile → canonical 09XXXXXXXXX, or null. Accepts +98 / 0098 / 98 / 9… forms and Persian digits. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 32) return null
  let s = latinDigits(input).replace(/[\s\-()]/g, '')
  if (s.startsWith('+98')) s = '0' + s.slice(3)
  else if (s.startsWith('0098')) s = '0' + s.slice(4)
  else if (s.startsWith('98') && s.length === 12) s = '0' + s.slice(2)
  else if (s.startsWith('9') && s.length === 10) s = '0' + s
  return /^09\d{9}$/.test(s) ? s : null
}

/** Username: 4–30 chars, latin letters/digits/._, starts with a letter, stored lowercase. */
export function normalizeUsername(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const s = latinDigits(input).trim().toLowerCase()
  return /^[a-z][a-z0-9._]{3,29}$/.test(s) && !/[._]{2}/.test(s) && !/[._]$/.test(s) ? s : null
}

const COMMON = new Set(['password', 'password1', 'password123', '1234567890', '12345678910', 'qwertyuiop', 'qwerty1234', 'iloveyou12', 'aaaaaaaaaa',
  '0123456789', '1q2w3e4r5t', 'abcdefghij', 'abcd123456', 'fartash123', 'fartash1234', 'admin12345', 'welcome123', 'pass123456', '0987654321'])

/** Returns a Persian error message, or null when the password is acceptable. */
export function passwordProblem(pw: unknown, username?: string | null): string | null {
  if (typeof pw !== 'string' || pw.length < 10) return 'رمز عبور باید دست‌کم ۱۰ نویسه باشد.'
  if (pw.length > 128) return 'رمز عبور حداکثر ۱۲۸ نویسه است.'
  if (COMMON.has(pw.toLowerCase()) || /^(.)\1+$/.test(pw) || /^\d+$/.test(pw)) return 'این رمز عبور خیلی ساده است؛ ترکیبی از حروف و عدد انتخاب کنید.'
  if (username && pw.toLowerCase().includes(username.toLowerCase())) return 'رمز عبور نباید شامل نام کاربری باشد.'
  return null
}

export const cleanName = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 80) : '')

const key = () => process.env.PAYLOAD_SECRET || 'dev-only-secret-change-me-dev-only-secret'
export const hmac = (label: string, value: string) => createHmac('sha256', key()).update(`${label}\u0000${value}`).digest('hex')
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Only the Fartash web server may call /api/identity/* (it holds the internal key). Fails closed in production. */
export function internalCall(req: PayloadRequest) {
  const secret = process.env.CONTENT_API_SECRET
  if (!secret) return !isProd()
  return safeEqual(req.headers.get('x-fartash-internal') ?? '', secret)
}
/** Client IP as reported by the web server (trusted only together with the internal key). */
export const clientIp = (req: PayloadRequest) => (req.headers.get('x-fartash-client-ip') ?? '').slice(0, 64) || 'unknown'

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
export const fail = (status: number, error: string, message: string, extra: Record<string, unknown> = {}) => json({ error, message, ...extra }, status)

/** Constant-ish response time for credential checks, so "no such user" and "wrong password" look the same. */
export async function atLeast<T>(ms: number, p: Promise<T>): Promise<T> {
  const start = Date.now()
  try { return await p } finally { const left = ms - (Date.now() - start); if (left > 0) await new Promise((r) => setTimeout(r, left)) }
}

export async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    const text = await (req as unknown as Request).text()
    if (text.length > 8192) return {}
    const v = text ? JSON.parse(text) : {}
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
}
