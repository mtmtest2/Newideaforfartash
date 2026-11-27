// Browser side of sign-in. The session itself lives in an httpOnly cookie set by the web server (server/auth.mjs);
// this module only calls /api/auth/* and never stores tokens. The demo panels still read their sample data from the
// browser store (src/panel/session.ts): after a real sign-in we copy the account's name/phone into it, and clear it
// when the real session is gone, so the panels show the signed-in person and can never be opened without a session.
import { getReception, getSession, getTeacher, signIn, signInReception, signInTeacher, signOut, signOutReception, signOutTeacher } from '../panel/session'

export type Audience = 'member' | 'staff'
export type StaffRole = 'owner' | 'support' | 'supervisor' | 'reception' | 'teacher'
export type MemberUser = { kind: 'member'; id: number; name: string; username: string; phone: string | null; phoneVerified: boolean; passwordSet: boolean; createdAt: string }
export type StaffUser = { kind: 'staff'; id: number; name: string; username: string; email: string | null; role: StaffRole; roleLabel: string; phone: string | null; createdAt: string }
export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string; message: string; data: Record<string, unknown> }

const base = (aud: Audience) => (aud === 'staff' ? '/api/auth/staff' : '/api/auth')
/** Staff sessions are kept per role, so staff calls say which role's session they mean. */
const q = (role?: StaffRole) => (role ? `?role=${role}` : '')

export async function api<T = Record<string, unknown>>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const r = await fetch(path, body === undefined
      ? { credentials: 'same-origin', headers: { accept: 'application/json' } }
      : { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(body) })
    const data = await r.json().catch(() => ({}))
    if (r.ok) return { ok: true, status: r.status, data: data as T }
    return { ok: false, status: r.status, error: data.error ?? 'error', message: data.message ?? (r.status === 429 ? 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.' : 'خطایی پیش آمد؛ دوباره امتحان کنید.'), data }
  } catch {
    return { ok: false, status: 0, error: 'network', message: 'اتصال برقرار نشد؛ اینترنت را بررسی کنید و دوباره امتحان کنید.', data: {} }
  }
}

export const authApi = {
  config: () => api<{ otp: boolean }>('/api/auth/config'),
  /** user is null when signed out (200, not an error). Staff without a role: the first signed-in staff role. */
  me: <U = MemberUser | StaffUser>(aud: Audience, role?: StaffRole) => api<{ user: U | null; home: string | null }>(`${base(aud)}/me${q(role)}`),
  login: (aud: Audience, username: string, password: string, next?: string) => api<{ user: MemberUser | StaffUser; redirect: string }>(`${base(aud)}/login`, { username, password, next }),
  register: (name: string, username: string, password: string, next?: string) => api<{ user: MemberUser; redirect: string }>('/api/auth/register', { name, username, password, next }),
  otpRequest: (aud: Audience, phone: string) => api<{ ttl: number; resendIn: number; devCode?: string }>(`${base(aud)}/otp/request`, { phone }),
  otpVerify: (aud: Audience, phone: string, code: string, name?: string, next?: string) => api<{ user: MemberUser | StaffUser; redirect: string; isNew: boolean }>(`${base(aud)}/otp/verify`, { phone, code, name, next }),
  logout: (aud: Audience, role?: StaffRole) => api(`${base(aud)}/logout${q(role)}`, {}),
  password: (aud: Audience, current: string, next: string, role?: StaffRole) => api(`${base(aud)}/password${q(role)}`, { current, next }),
  profile: (aud: Audience, name: string, role?: StaffRole) => api<{ user: MemberUser | StaffUser }>(`${base(aud)}/profile${q(role)}`, { name }),
}

/** Student panel guard: true when a member session exists (and mirrors it into the demo store). */
export async function ensureMember(): Promise<MemberUser | null> {
  const r = await authApi.me<MemberUser>('member')
  if (!r.ok) return null
  if (!r.data.user) { signOut(); return null }
  const u = r.data.user, cur = getSession()
  if (!cur || cur.name !== u.name || cur.phone !== (u.phone ?? '')) signIn({ ...(cur ?? {}), name: u.name, phone: u.phone ?? '', joined: u.createdAt })
  return u
}
/** Staff panel guard: true when a staff session with this role exists (and mirrors it into the demo store). */
export async function ensureStaff(role: StaffRole): Promise<StaffUser | null> {
  const r = await authApi.me<StaffUser>('staff', role)
  const u = r.ok && r.data.user?.role === role ? r.data.user : null
  if (role === 'teacher') {
    if (!u) { if (r.ok) signOutTeacher(); return null }
    const cur = getTeacher()
    if (!cur || cur.name !== u.name) signInTeacher({ teacherId: cur?.teacherId ?? 'arman', name: u.name, phone: u.phone ?? '', joined: u.createdAt })
  } else if (role === 'reception') {
    if (!u) { if (r.ok) signOutReception(); return null }
    const cur = getReception()
    if (!cur || cur.name !== u.name) signInReception({ name: u.name, phone: u.phone ?? '', joined: u.createdAt })
  }
  return u
}
export async function logoutMember() { await authApi.logout('member'); signOut() }
export async function logoutStaff(role: StaffRole) {
  await authApi.logout('staff', role)
  if (role === 'teacher') signOutTeacher()
  if (role === 'reception') signOutReception()
}

/** Post-login destination: only paths inside the given area (no open redirects). */
export function safeNext(next: string | null, home: string) {
  if (!next || !/^\/[a-z0-9\-/]*$/i.test(next) || next.includes('//')) return home
  return next === home || next.startsWith(home + '/') ? next : home
}
