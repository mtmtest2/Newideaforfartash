import type { CollectionBeforeLoginHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { can, nobody } from '../access/permissions'
import { passwordPolicy } from './Staff'

const memberBeforeLogin: CollectionBeforeLoginHook = ({ user }) => {
  if (user?.active === false) throw new APIError('inactive', 401)
  return user
}

/**
 * Students and other site users (sign-up on /register, or by phone + one-time code on /login).
 * No REST/GraphQL endpoints at all (`endpoints: false`): every read and write goes through /api/identity/*, which only
 * the website server can call, and which picks the allowed fields explicitly. Not shown in the CMS admin.
 */
export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'کاربر', plural: 'کاربران سایت' },
  endpoints: false,
  graphQL: false,
  admin: { hidden: true, useAsTitle: 'name' },
  auth: {
    tokenExpiration: 14 * 24 * 60 * 60, // 14 days
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useSessions: true,
    loginWithUsername: { allowEmailLogin: false, requireEmail: false, requireUsername: true },
  },
  access: {
    admin: () => false,
    read: ({ req }) => can(req, 'accounts.members'),
    create: nobody,
    update: nobody,
    delete: nobody,
    unlock: nobody,
  },
  fields: [
    { name: 'name', label: 'نام', type: 'text', required: true },
    { name: 'phone', label: 'موبایل', type: 'text', unique: true, index: true },
    { name: 'phoneVerifiedAt', label: 'تأیید موبایل', type: 'date' },
    { name: 'active', label: 'فعال', type: 'checkbox', defaultValue: true },
    // false for accounts created by phone code until the member sets a password
    { name: 'passwordSet', label: 'رمز عبور تعیین شده', type: 'checkbox', defaultValue: true },
    { name: 'lastLoginAt', label: 'آخرین ورود', type: 'date' },
  ],
  hooks: { beforeLogin: [memberBeforeLogin], beforeValidate: [passwordPolicy] },
  timestamps: true,
}

/** One-time codes. Code and phone are stored only as keyed hashes. Never exposed through any API. */
export const OtpChallenges: CollectionConfig = {
  slug: 'otp-challenges',
  endpoints: false,
  graphQL: false,
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'audience', type: 'select', required: true, options: ['member', 'staff'], index: true },
    { name: 'phoneHash', type: 'text', required: true, index: true },
    { name: 'codeHash', type: 'text', required: true },
    { name: 'ipHash', type: 'text', index: true },
    { name: 'expiresAt', type: 'date', required: true, index: true },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'consumedAt', type: 'date' },
  ],
  timestamps: true,
}
