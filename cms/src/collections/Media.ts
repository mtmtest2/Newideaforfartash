import crypto from 'node:crypto'
import path from 'node:path'
import { APIError, type CollectionConfig } from 'payload'
import { allow } from '../access/permissions'
import { auditChange, auditDelete } from '../hooks/audit'
import { findMediaUsage } from '../lib/usage'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] // no SVG: it can carry scripts
export const DOC_TYPES = ['application/pdf']

/** Public media (images used on the website, downloadable PDFs). Course videos/resources go to `private-files`. */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'رسانه', plural: 'کتابخانهٔ رسانه' },
  admin: { group: 'مدیریت محتوا', defaultColumns: ['filename', 'alt', 'category', 'filesize', 'updatedAt'], listSearchableFields: ['filename', 'alt'] },
  access: {
    read: () => true, // files are referenced by the public site; nothing private may be uploaded here
    create: allow('media.write'), update: allow('media.write'), delete: allow('media.delete'),
  },
  upload: {
    staticDir: process.env.MEDIA_DIR ? path.resolve(process.env.MEDIA_DIR) : path.resolve(process.cwd(), 'media'),
    mimeTypes: [...IMAGE_TYPES, ...DOC_TYPES],
    imageSizes: [
      { name: 'thumb', width: 400, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'card', width: 800, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'wide', width: 1600, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
    formatOptions: { format: 'webp', options: { quality: 82 } },
    resizeOptions: { width: 2400, withoutEnlargement: true },
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
  fields: [
    { name: 'alt', label: 'متن جایگزین (alt)', type: 'text', admin: { description: 'برای تصویرها الزامی است؛ برای تصویر تزئینی یک خط تیره (-) بنویسید.' } },
    { name: 'category', label: 'دسته', type: 'select', options: [
      { label: 'اساتید', value: 'teachers' }, { label: 'مجله', value: 'magazine' }, { label: 'رویدادها', value: 'events' },
      { label: 'دوره‌ها', value: 'courses' }, { label: 'زبان‌ها', value: 'languages' }, { label: 'صفحه‌ها', value: 'pages' }, { label: 'سایر', value: 'other' }] },
    { name: 'credit', label: 'منبع / حق نشر', type: 'text' },
    { name: 'checksum', type: 'text', index: true, admin: { readOnly: true, hidden: true } },
  ],
  hooks: {
    beforeValidate: [({ data, req }) => {
      const isImage = data?.mimeType ? IMAGE_TYPES.includes(data.mimeType) : !!req.file && IMAGE_TYPES.includes(req.file.mimetype)
      if (isImage && !String(data?.alt ?? '').trim()) throw new APIError('برای تصویر، متن جایگزین (alt) را بنویسید.', 400, undefined, true)
      return data
    }],
    beforeChange: [async ({ data, req, operation }) => {
      if (req.file?.data) {
        if (req.file.size > 20 * 1024 * 1024) throw new APIError('حداکثر حجم فایل ۲۰ مگابایت است.', 400, undefined, true)
        const sum = crypto.createHash('sha256').update(req.file.data).digest('hex')
        const dup = await req.payload.find({ collection: 'media', where: { checksum: { equals: sum } }, limit: 1, depth: 0, overrideAccess: true, req })
        if (dup.docs[0] && (operation === 'create' || dup.docs[0].id !== data.id)) {
          throw new APIError(`این فایل قبلاً بارگذاری شده است: «${dup.docs[0].filename}» (شناسهٔ ${dup.docs[0].id}).`, 409, undefined, true)
        }
        data.checksum = sum
      }
      return data
    }],
    beforeDelete: [async ({ id, req }) => {
      const used = await findMediaUsage(req, id)
      if (used.length && req.context?.confirmMediaDelete !== true) {
        throw new APIError(`این رسانه در ${used.length} جا استفاده شده است (${used.slice(0, 4).map((u) => `${u.collection}:${u.title}`).join('، ')}). ابتدا آن را جایگزین کنید.`, 409, undefined, true)
      }
    }],
    afterChange: [auditChange], afterDelete: [auditDelete],
  },
}
