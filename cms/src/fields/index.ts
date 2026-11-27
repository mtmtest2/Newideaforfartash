import type { Field, CollectionConfig } from 'payload'
import { allow, staffOnly } from '../access/permissions'
import { auditChange, auditDelete } from '../hooks/audit'
import { revalidateSite } from '../lib/revalidate'
import { previewUrl } from '../lib/preview'

const SLUG_RE = /^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/

/** Turns a title into a URL slug (keeps Persian letters, lowercases Latin, collapses spaces/punctuation into "-"). */
export const toSlug = (s: string) =>
  s.trim().toLowerCase()
    .replace(/[‌\s_]+/g, '-')
    .replace(/[^a-z0-9؀-ۿ-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')

export const slugField = (from = 'title'): Field => ({
  name: 'slug', label: 'نشانی (slug)', type: 'text', required: true, unique: true, index: true,
  admin: { position: 'sidebar', description: 'بخش انتهایی آدرس صفحه؛ اگر خالی بماند از عنوان ساخته می‌شود. بهتر است کوتاه و انگلیسی باشد.' },
  hooks: { beforeValidate: [({ value, data }) => (value ? toSlug(String(value)) : data?.[from] ? toSlug(String(data[from])) : value)] },
  validate: (v: unknown) => (typeof v === 'string' && SLUG_RE.test(v)) || 'فقط حروف، عدد و خط تیره؛ بدون فاصله.',
})

/** Central SEO group used by every public content type (docs/CMS-SEO.md). */
export const seoField: Field = {
  name: 'seo', label: 'سئو', type: 'group',
  admin: { description: 'خالی بگذارید تا از عنوان و خلاصهٔ محتوا ساخته شود.' },
  fields: [
    { name: 'title', label: 'عنوان سئو', type: 'text', maxLength: 70, admin: { description: 'حداکثر ۶۰ تا ۷۰ نویسه.' } },
    { name: 'description', label: 'توضیحات متا', type: 'textarea', maxLength: 170, admin: { description: '۱۲۰ تا ۱۶۰ نویسه.' } },
    { name: 'focusKeyword', label: 'کلیدواژهٔ اصلی', type: 'text' },
    { name: 'canonical', label: 'آدرس canonical', type: 'text', admin: { description: 'فقط اگر محتوای اصلی در آدرس دیگری است.' },
      validate: (v: unknown) => !v || /^https?:\/\//.test(String(v)) || 'یک آدرس کامل با https وارد کنید.' },
    { name: 'noindex', label: 'نمایه نشود (noindex)', type: 'checkbox', defaultValue: false },
    { name: 'image', label: 'تصویر اشتراک‌گذاری (Open Graph)', type: 'upload', relationTo: 'media' },
    { name: 'ogTitle', label: 'عنوان Open Graph', type: 'text' },
    { name: 'ogDescription', label: 'توضیح Open Graph', type: 'textarea' },
  ],
}

export const publishedAtField: Field = {
  name: 'publishedAt', label: 'تاریخ انتشار', type: 'date', index: true,
  admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'اگر خالی بماند، زمان اولین انتشار ثبت می‌شود.' },
  hooks: { beforeChange: [({ value, siblingData }) => (!value && siblingData?._status === 'published' ? new Date().toISOString() : value)] },
}

/** Standard settings for an editorial (publishable) collection: staff-only API access, drafts + autosave +
 *  scheduled publishing + version history, audit trail, site cache revalidation and preview links. */
export function publishable(c: CollectionConfig & { publicPath?: (doc: Record<string, unknown>) => string | null; revalidate?: string[] }): CollectionConfig {
  const { publicPath, revalidate = [c.slug], ...rest } = c
  const revalidateHook = () => { void revalidateSite(revalidate) }
  return {
    ...rest,
    access: {
      read: staffOnly, // the public never reads collections directly; it uses /api/public/* (published only)
      create: allow('content.write'), update: allow('content.write'), delete: allow('content.delete'),
      readVersions: staffOnly,
      ...rest.access,
    },
    versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true, validate: false }, maxPerDoc: 50 },
    admin: {
      ...rest.admin,
      ...(publicPath ? { preview: (doc: Record<string, unknown>) => previewUrl(c.slug, doc, publicPath) } : {}),
    },
    hooks: {
      ...rest.hooks,
      afterChange: [...(rest.hooks?.afterChange ?? []), auditChange, revalidateHook],
      afterDelete: [...(rest.hooks?.afterDelete ?? []), auditDelete, revalidateHook],
    },
  }
}

/** Taxonomy / reference collections (no drafts). */
export function reference(c: CollectionConfig): CollectionConfig {
  const revalidateHook = () => { void revalidateSite([c.slug]) }
  return {
    ...c,
    access: { read: staffOnly, create: allow('content.write'), update: allow('content.write'), delete: allow('content.delete'), ...c.access },
    hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange ?? []), auditChange, revalidateHook], afterDelete: [...(c.hooks?.afterDelete ?? []), auditDelete, revalidateHook] },
  }
}
