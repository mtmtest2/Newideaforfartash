import type { Endpoint, PayloadRequest } from 'payload'
import { can } from '../access/permissions'
import { revalidateSite, lastRevalidation } from '../lib/revalidate'
import { runChecks } from './checks'

const deny = () => Response.json({ error: 'forbidden' }, { status: 403 })

/** Staff-only diagnostics. Every action is audited and reports the real backend result. */
export const monitoringEndpoints: Endpoint[] = [
  { path: '/monitoring/status', method: 'get', handler: async (req: PayloadRequest) => {
    if (!can(req, 'audit.read')) return deny()
    return Response.json({ checks: await runChecks(req.payload) }, { headers: { 'Cache-Control': 'no-store' } })
  } },
  { path: '/monitoring/revalidate', method: 'post', handler: async (req: PayloadRequest) => {
    if (!can(req, 'settings.write')) return deny()
    await revalidateSite(['*'])
    await req.payload.create({ collection: 'audit-logs', overrideAccess: true, data: {
      action: 'tool.revalidate', entity: 'site-cache', actor: req.user!.id, actorLabel: `staff:${req.user!.id}`, actorRole: (req.user as { role?: string }).role,
      result: lastRevalidation.ok ? 'success' : `failure: ${lastRevalidation.error ?? 'not configured'}` } })
    return Response.json({ ok: !!lastRevalidation.ok, at: lastRevalidation.at ?? null, error: lastRevalidation.ok ? null : lastRevalidation.error ?? 'SITE_REVALIDATE_URL تنظیم نشده است' }, { status: lastRevalidation.ok ? 200 : 502 })
  } },
  { path: '/monitoring/run-jobs', method: 'post', handler: async (req: PayloadRequest) => {
    if (!can(req, 'settings.write')) return deny()
    let result = 'success'
    try { await req.payload.jobs.run({ queue: 'default', limit: 50 }) } catch (e) { result = `failure: ${(e as Error).message}` }
    await req.payload.create({ collection: 'audit-logs', overrideAccess: true, data: {
      action: 'tool.run-jobs', entity: 'jobs', actor: req.user!.id, actorLabel: `staff:${req.user!.id}`, actorRole: (req.user as { role?: string }).role, result } })
    return Response.json({ ok: result === 'success', result }, { status: result === 'success' ? 200 : 500 })
  } },
]
