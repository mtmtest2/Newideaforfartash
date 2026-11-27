import type { CollectionBeforeChangeHook, CollectionBeforeLoginHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { can, currentStaff, nobody, ROLE_LABELS, STAFF_ROLES } from '../access/permissions'
import { auditChange, auditDelete } from '../hooks/audit'
import { normalizeUsername, passwordProblem } from '../identity/util'

/** Inactive accounts never sign in; only owner/support may sign in to the Content Hub (CMS admin). Teachers, reception
 *  and supervisors sign in on the website staff page (/staff/login), which sets `context.siteLogin`. */
export const staffBeforeLogin: CollectionBeforeLoginHook = ({ user, req }) => {
  if (user?.active === false) throw new APIError('inactive', 401)
  if (!req.context?.siteLogin && !['owner', 'support'].includes(String(user?.role))) throw new APIError('not_allowed', 401)
  return user
}
/** Staff accounts are created only by the identity endpoints (owner/support, role checked) or the server script.
 *  This also closes Payload's "create first user" route (/api/staff/first-register, /support/create-first-user),
 *  which would otherwise let anyone create the first account (with any role) on a fresh install. */
export const staffCreateGuard: CollectionBeforeChangeHook = ({ operation, req, data }) => {
  if (operation === 'create' && !req.context?.trustedStaffCreate) throw new APIError('forbidden', 403)
  return data
}
/** Password policy for every password write (website, CMS admin "change password", server scripts). */
export const passwordPolicy: CollectionBeforeValidateHook = ({ data }) => {
  if (data && typeof data.password === 'string') {
    const problem = passwordProblem(data.password, (data.username as string) ?? null)
    if (problem) throw new APIError(problem, 400, undefined, true)
  }
  if (data && typeof data.username === 'string') {
    const u = normalizeUsername(data.username)
    if (!u) throw new APIError('نام کاربری معتبر نیست: ۴ تا ۳۰ حرف لاتین، عدد، نقطه یا _ و شروع با حرف.', 400, undefined, true)
    data.username = u
  }
  return data
}

/**
 * Staff accounts: owner, support, supervisor, reception, teacher.
 * Accounts are created only by an owner/support from the website dashboards (/owner, /support-desk) through
 * /api/identity/admin/*, or by the server script `npm run create-staff` (first owner). Never self-service.
 * Role, active, username and phone are locked for every API caller; only those identity endpoints change them,
 * after checking MANAGEABLE_ROLES server-side.
 */
export const Staff: CollectionConfig = {
  slug: 'staff',
  labels: { singular: 'کارمند', plural: 'کارکنان' },
  admin: { useAsTitle: 'name', group: 'امنیت و دسترسی', defaultColumns: ['name', 'username', 'role', 'active'], description: 'حساب‌های کارکنان. ساخت و تغییر نقش فقط از داشبورد مالک/پشتیبانی در سایت انجام می‌شود.' },
  auth: {
    tokenExpiration: 8 * 60 * 60, // 8h sessions
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useSessions: true,
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: true },
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: ({ req }) => can(req, 'staff.self'),
    read: ({ req }) => (can(req, 'staff.read') ? true : currentStaff(req) ? { id: { equals: currentStaff(req)!.id } } : false),
    create: nobody, // identity endpoints / server script only
    // staff may edit only their own profile (name, password); role/active/username/phone are field-locked below
    update: ({ req }) => { const me = currentStaff(req); return me ? { id: { equals: me.id } } : false },
    delete: nobody, // deactivate instead; deletion would orphan audit history
    unlock: nobody,
  },
  fields: [
    { name: 'name', label: 'نام', type: 'text', required: true },
    {
      name: 'role', label: 'نقش', type: 'select', required: true,
      options: STAFF_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: { update: () => false }, saveToJWT: true,
    },
    { name: 'active', label: 'فعال', type: 'checkbox', defaultValue: true, access: { update: () => false }, saveToJWT: true },
    { name: 'phone', label: 'موبایل (برای ورود با کد پیامکی)', type: 'text', unique: true, index: true, access: { update: () => false } },
    { name: 'lastLoginAt', label: 'آخرین ورود', type: 'date', access: { update: () => false }, admin: { readOnly: true } },
    {
      name: 'fartashUserId', label: 'شناسه در سامانهٔ مرکزی فرتاش', type: 'text', index: true,
      access: { update: () => false },
      admin: { readOnly: true, description: 'برای اتصال آینده (فعلاً خالی).' },
    },
  ],
  hooks: { beforeLogin: [staffBeforeLogin], beforeValidate: [passwordPolicy], beforeChange: [staffCreateGuard], afterChange: [auditChange], afterDelete: [auditDelete] },
  timestamps: true,
}
