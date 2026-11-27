import type { CollectionConfig } from 'payload'
import { allow, nobody } from '../access/permissions'

/** Append-only. No one (including Support) can create, edit or delete through any API; hooks write with overrideAccess,
 *  and a SQL trigger blocks UPDATE/DELETE on the table itself. */
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: 'رویداد', plural: 'گزارش رویدادها' },
  admin: {
    group: 'امنیت و دسترسی', useAsTitle: 'action',
    defaultColumns: ['createdAt', 'action', 'entity', 'entityId', 'actorLabel'],
    description: 'هر تغییر محتوا و تنظیمات این‌جا ثبت می‌شود و قابل ویرایش یا حذف نیست.',
  },
  access: { read: allow('audit.read'), create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'action', label: 'عمل', type: 'text', required: true, index: true },
    { name: 'entity', label: 'بخش', type: 'text', required: true, index: true },
    { name: 'entityId', label: 'شناسه', type: 'text', index: true },
    { name: 'actor', label: 'انجام‌دهنده', type: 'relationship', relationTo: 'staff' },
    { name: 'actorLabel', label: 'برچسب انجام‌دهنده', type: 'text' },
    { name: 'actorRole', label: 'نقش', type: 'text' },
    { name: 'changed', label: 'فیلدهای تغییرکرده', type: 'json' },
    { name: 'before', label: 'وضعیت قبلی', type: 'json' },
    { name: 'after', label: 'وضعیت جدید', type: 'json' },
    { name: 'result', label: 'نتیجه', type: 'text' },
    { name: 'requestId', label: 'شناسهٔ درخواست', type: 'text' },
  ],
  timestamps: true,
}
