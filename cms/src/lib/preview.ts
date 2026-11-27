import crypto from 'node:crypto'

// Preview links: a short-lived HMAC token scoped to one document. The public site sends it to
// GET /api/public/preview, which verifies it and returns the draft. No secret ever reaches the browser.
const TTL_MS = 30 * 60 * 1000
const key = () => process.env.CONTENT_API_SECRET || process.env.PAYLOAD_SECRET || ''

export function signPreview(collection: string, id: string | number, now = Date.now()) {
  const payload = `${collection}.${id}.${now + TTL_MS}`
  const sig = crypto.createHmac('sha256', key()).update(payload).digest('base64url')
  return Buffer.from(payload).toString('base64url') + '.' + sig
}
export function verifyPreview(token: string, now = Date.now()): { collection: string; id: string } | null {
  const [p, sig] = String(token).split('.')
  if (!p || !sig) return null
  const payload = Buffer.from(p, 'base64url').toString()
  const expected = crypto.createHmac('sha256', key()).update(payload).digest('base64url')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  const [collection, id, exp] = payload.split('.')
  if (!collection || !id || Number(exp) < now) return null
  return { collection, id }
}
export function previewUrl(collection: string, doc: Record<string, unknown>, path: (d: Record<string, unknown>) => string | null) {
  const p = path(doc)
  if (!p || !doc.id) return null
  const site = (process.env.SITE_URL || 'http://localhost:4173').replace(/\/$/, '')
  return `${site}${p}?preview=${encodeURIComponent(signPreview(collection, doc.id as string))}`
}
