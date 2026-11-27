// Staff-only helper endpoints used by dashboard components.
import type { Endpoint, PayloadRequest } from 'payload'
import { can } from '../access/permissions'
import { signPreview } from './preview'
import { findMediaUsage } from './usage'

const deny = () => Response.json({ error: 'forbidden' }, { status: 403 })
const site = () => (process.env.SITE_URL || 'http://localhost:4173').replace(/\/$/, '')

export const adminEndpoints: Endpoint[] = [
  // where a media item is used (shown on the media edit screen)
  { path: '/admin-tools/media-usage/:id', method: 'get', handler: async (req: PayloadRequest) => {
    if (!can(req, 'content.read')) return deny()
    const id = String((req.routeParams as Record<string, unknown>)?.id ?? '')
    const used = await findMediaUsage(req, id)
    return Response.json({ items: used }, { headers: { 'Cache-Control': 'no-store' } })
  } },
  // preview of the homepage WITH the offline-course carousel, before the feature is switched on
  { path: '/admin-tools/preview-home-courses', method: 'get', handler: async (req: PayloadRequest) => {
    if (!can(req, 'content.read')) return deny()
    return Response.json({ url: `${site()}/?preview=${encodeURIComponent(signPreview('home', 'courses'))}#courses` }, { headers: { 'Cache-Control': 'no-store' } })
  } },
]
