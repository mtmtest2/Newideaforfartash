import type { CollectionConfig } from 'payload'
import { allow, can, nobody } from '../access/permissions'
import { auditChange, auditDelete } from '../hooks/audit'

/**
 * CMS staff accounts (Support Dashboard sign-in). Deliberately NOT a general user table:
 * students/teachers/owners belong to the future central Fartash identity (schema app).
 * Accounts are created only from the server (npm run create-support-admin) — never from the web UI —
 * so no one can create or escalate staff accounts through the dashboard. `owner` is not an option here.
 */
export const Staff: CollectionConfig = {
  slug: 'staff',
  labels: { singular: 'کارمند', plural: 'کارکنان پشتیبانی' },
  admin: { useAsTitle: 'name', group: 'امنیت و دسترسی', defaultColumns: ['name', 'email', 'role', 'active'], description: 'حساب‌های ورود به داشبورد پشتیبانی. ساخت حساب تازه فقط از سرور انجام می‌شود.' },
  auth: {
    tokenExpiration: 8 * 60 * 60, // 8h sessions
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useSessions: true,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: ({ req }) => can(req, 'staff.self'),
    read: ({ req }) => (can(req, 'staff.read') ? true : false),
    create: nobody, // server-side script only
    // staff can edit only their own profile (name, password); role/active are field-locked below
    update: ({ req }) => (req.user ? { id: { equals: req.user.id } } : false),
    delete: nobody, // deactivate instead; deletion would orphan audit history
  },
  fields: [
    { name: 'name', label: 'نام', type: 'text', required: true },
    {
      name: 'role', label: 'نقش', type: 'select', required: true, defaultValue: 'support',
      options: [{ label: 'پشتیبانی', value: 'support' }],
      access: { update: () => false }, saveToJWT: true,
      admin: { description: 'نقش «مالک» در سامانهٔ احراز هویت مرکزی آینده تعریف می‌شود و از اینجا قابل تعیین نیست.' },
    },
    { name: 'active', label: 'فعال', type: 'checkbox', defaultValue: true, access: { update: () => false }, saveToJWT: true },
    {
      name: 'fartashUserId', label: 'شناسه در سامانهٔ مرکزی فرتاش', type: 'text', index: true,
      access: { update: () => false },
      admin: { readOnly: true, description: 'برای اتصال آیندهٔ این حساب به احراز هویت مرکزی (فعلاً خالی).' },
    },
  ],
  hooks: { afterChange: [auditChange], afterDelete: [auditDelete] },
  timestamps: true,
}
