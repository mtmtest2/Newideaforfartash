import type { PayloadRequest, TaskConfig } from 'payload'

// "Create new" with autosave saves an empty draft immediately; drafts that never got a title are removed after 2 hours.
// Only never-published, untitled drafts are touched. Each deletion is audited by the collection hooks.
export const cleanupEmptyDrafts = {
  slug: 'cleanupEmptyDrafts',
  label: 'پاک‌سازی پیش‌نویس‌های خالی',
  schedule: [{ cron: '0 23 * * * *', queue: 'default' }], // hourly at :23
  handler: async ({ req }: { req: PayloadRequest }) => {
    const before = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    let removed = 0
    for (const collection of ['articles', 'courses', 'events', 'pages'] as const) {
      const res = await req.payload.find({
        collection, draft: true, depth: 0, limit: 200, overrideAccess: true, req,
        where: { and: [{ title: { exists: false } }, { _status: { equals: 'draft' } }, { updatedAt: { less_than: before } }] },
      })
      for (const d of res.docs) {
        await req.payload.delete({ collection, id: d.id, overrideAccess: true, req })
        removed++
      }
    }
    return { output: { removed } }
  },
} as unknown as TaskConfig
