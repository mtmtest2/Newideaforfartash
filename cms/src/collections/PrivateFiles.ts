import path from 'node:path'
import type { CollectionConfig } from 'payload'
import { allow } from '../access/permissions'
import { auditChange, auditDelete } from '../hooks/audit'
import { DOC_TYPES, IMAGE_TYPES } from './Media'

/**
 * Private course resources (PDF handouts, worksheets, audio). Never publicly readable: only staff can read them now;
 * the future enrollment service will issue short-lived signed links (see docs/OFFLINE-COURSES.md §Delivery).
 * Large course videos are NOT uploaded here — lessons store a secure video reference to a streaming provider.
 */
export const PrivateFiles: CollectionConfig = {
  slug: 'private-files',
  labels: { singular: 'فایل خصوصی', plural: 'فایل‌های خصوصی دوره‌ها' },
  admin: { group: 'مدیریت محتوا', defaultColumns: ['filename', 'title', 'filesize', 'updatedAt'] },
  access: { read: allow('private.read'), create: allow('private.write'), update: allow('private.write'), delete: allow('private.write') },
  upload: {
    staticDir: process.env.PRIVATE_FILES_DIR ? path.resolve(process.env.PRIVATE_FILES_DIR) : path.resolve(process.cwd(), 'private'),
    mimeTypes: [...DOC_TYPES, ...IMAGE_TYPES, 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'application/zip'],
  },
  fields: [{ name: 'title', label: 'عنوان', type: 'text', required: true }],
  hooks: { afterChange: [auditChange], afterDelete: [auditDelete] },
}
