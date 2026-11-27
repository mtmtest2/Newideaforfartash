import type { GlobalConfig } from 'payload'
import { allow, staffOnly } from '../access/permissions'
import { auditGlobal } from '../hooks/audit'
import { revalidateSite } from '../lib/revalidate'

/** Database-backed feature switches. The public API reads these on every request (no rebuild, no redeploy). */
export const FeatureFlags: GlobalConfig = {
  slug: 'feature-flags',
  label: 'قابلیت‌های سایت',
  admin: { group: 'تنظیمات سامانه', description: 'روشن و خاموش کردن قابلیت‌های عمومی سایت بدون نیاز به برنامه‌نویس.' },
  access: { read: staffOnly, update: allow('flags.write') },
  fields: [
    { name: 'panel', type: 'ui', admin: { components: { Field: '/components/CoursesPreview#FlagPanel' } } },
    {
      name: 'offlineCoursesEnabled', label: 'نمایش دوره‌های آفلاین در سایت', type: 'checkbox', defaultValue: false,
      admin: { description: 'خاموش: دوره‌ها، منو، بخش صفحهٔ اصلی، صفحه‌ها و نقشهٔ سایت مربوط به دوره‌های آفلاین کاملاً پنهان‌اند. روشن: دوره‌های منتشرشده و کاروسل تنظیم‌شده نمایش داده می‌شوند.' },
    },
  ],
  hooks: { afterChange: [auditGlobal, () => { void revalidateSite(['*']) }] },
}

/** Effective value: the database switch, unless the emergency env override forces it off. */
export const offlineCoursesOn = (flags: { offlineCoursesEnabled?: boolean | null } | null) =>
  process.env.OFFLINE_COURSES_FORCE_OFF !== '1' && !!flags?.offlineCoursesEnabled
