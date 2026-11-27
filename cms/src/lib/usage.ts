import type { PayloadRequest } from 'payload'

/** Where a media item is referenced. Keeps deletion safe: media used by content cannot be removed silently. */
const REFS: { collection: string; fields: string[]; title: string }[] = [
  { collection: 'articles', fields: ['cover', 'seo.image'], title: 'title' },
  { collection: 'teachers', fields: ['photo', 'seo.image'], title: 'lastName' },
  { collection: 'events', fields: ['poster', 'seo.image'], title: 'title' },
  { collection: 'courses', fields: ['cover', 'seo.image'], title: 'title' },
  { collection: 'languages', fields: ['image', 'seo.image'], title: 'name' },
  { collection: 'authors', fields: ['avatar'], title: 'name' },
]
export async function findMediaUsage(req: PayloadRequest, id: string | number) {
  const out: { collection: string; id: string | number; title: string }[] = []
  for (const r of REFS) {
    if (!req.payload.collections[r.collection as never]) continue
    const res = await req.payload.find({
      collection: r.collection as never, depth: 0, limit: 20, overrideAccess: true, req, draft: true,
      where: { or: r.fields.map((f) => ({ [f]: { equals: id } })) },
    })
    for (const d of res.docs as Record<string, unknown>[]) out.push({ collection: r.collection, id: d.id as string, title: String(d[r.title] ?? d.id) })
  }
  return out
}
