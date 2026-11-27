// Append-only audit trail for every content/settings change made through the CMS.
// Writes go through the Local API with overrideAccess (the audit collection itself denies create/update/delete
// to everyone), and a database trigger (migration "audit_append_only") rejects UPDATE/DELETE at the SQL level.
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from 'payload'

const SECRET_KEYS = /^(password|hash|salt|resetPassword|apiKey|token|_verificationToken|loginAttempts|lockUntil|sessions)/i

/** Small, safe summary of a document: never full rich text bodies, never secrets. */
export function summarize(doc: Record<string, unknown> | undefined | null) {
  if (!doc) return null
  const out: Record<string, unknown> = {}
  for (const k of ['title', 'name', 'firstName', 'lastName', 'slug', '_status', 'profileState', 'workflowStatus', 'role', 'active',
    'showOnHome', 'homeOrder', 'offlineCoursesEnabled', 'publishedAt', 'filename', 'alt']) {
    if (doc[k] !== undefined && !SECRET_KEYS.test(k)) out[k] = doc[k]
  }
  return out
}
const changedKeys = (a: Record<string, unknown> | undefined, b: Record<string, unknown>) =>
  Object.keys(b).filter((k) => !SECRET_KEYS.test(k) && !['updatedAt', 'createdAt', '_order'].includes(k) && JSON.stringify(a?.[k]) !== JSON.stringify(b[k]))

async function write(req: PayloadRequest, entry: { action: string; entity: string; entityId?: string | number; before?: unknown; after?: unknown; changed?: string[] }) {
  if (req.context?.skipAudit) return
  const user = req.user as { id: number | string; role?: string; collection?: string } | null
  try {
    await req.payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      req, // same transaction: the audit row commits or rolls back with the change
      context: { skipAudit: true },
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId != null ? String(entry.entityId) : undefined,
        actor: user?.collection === 'staff' ? (user.id as number) : undefined,
        actorLabel: user ? `${user.collection}:${user.id}` : 'system',
        actorRole: user?.role ?? (user ? user.collection : 'system'),
        before: (entry.before ?? null) as never,
        after: (entry.after ?? null) as never,
        changed: entry.changed ?? [],
        result: 'success',
        requestId: (req.headers?.get?.('x-request-id') ?? undefined) || undefined,
      },
    })
  } catch (e) {
    req.payload.logger.error({ err: e, msg: 'audit write failed' })
    throw e // never let a change pass without its audit record
  }
}

export const auditChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req, collection }) => {
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc?._status === 'published'
  const action = operation === 'create' ? 'create'
    : !wasPublished && isPublished ? 'publish'
      : wasPublished && doc?._status === 'draft' && req.query?.draft !== 'true' ? 'unpublish'
        : 'update'
  // autosave writes are noisy and not decisions; the final save/publish is audited
  if (req.query?.autosave === 'true') return doc
  await write(req, { action, entity: collection.slug, entityId: doc.id, before: summarize(previousDoc), after: summarize(doc), changed: changedKeys(previousDoc, doc) })
  return doc
}
export const auditDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  await write(req, { action: 'delete', entity: collection.slug, entityId: doc.id, before: summarize(doc) })
  return doc
}
export const auditGlobal: GlobalAfterChangeHook = async ({ doc, previousDoc, req, global }) => {
  await write(req, { action: 'update', entity: `global:${global.slug}`, before: summarize(previousDoc), after: summarize(doc), changed: changedKeys(previousDoc, doc) })
  return doc
}
