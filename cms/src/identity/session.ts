// Server-side sessions for members and staff. Payload stores session ids on the user row (auth.useSessions), signs a JWT
// that carries the session id, and rejects any JWT whose session is gone. The website never hands this JWT to the
// browser: it seals it inside an encrypted, httpOnly cookie (server/auth.mjs), so the token cannot be replayed
// against the CMS directly.
import { randomUUID } from 'node:crypto'
import { getFieldsToSign, jwtSign, type Payload, type PayloadRequest } from 'payload'

type AuthUser = Record<string, unknown> & { id: number | string; sessions?: { id: string; createdAt: Date | string; expiresAt: Date | string }[] }

/** Create a session for an already-verified user (used after a one-time code). Password logins use payload.login. */
export async function issueSession(payload: Payload, req: PayloadRequest, collection: 'members' | 'staff', user: AuthUser) {
  const config = payload.collections[collection].config
  const tokenExpiration = config.auth.tokenExpiration
  const now = new Date()
  const sid = randomUUID()
  const live = (user.sessions ?? []).filter((s) => new Date(s.expiresAt) > now)
  // keep at most 10 concurrent sessions per account
  const sessions = [...live.slice(-9), { id: sid, createdAt: now, expiresAt: new Date(now.getTime() + tokenExpiration * 1000) }]
  await payload.db.updateOne({ collection, id: user.id, data: { sessions, updatedAt: null } as never, req, returning: false })
  const fieldsToSign = getFieldsToSign({ collectionConfig: config, email: (user.email as string) ?? '', sid, user: { ...user, collection } as never })
  const { token, exp } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration })
  return { token, exp }
}

/** Remove one session (logout) or all sessions (password change, deactivation, admin "sign out everywhere"). */
export async function revokeSessions(payload: Payload, req: PayloadRequest, collection: 'members' | 'staff', id: number | string, sid?: string | null, keep?: string | null) {
  const doc = (await payload.db.findOne({ collection, req, where: { id: { equals: id } } })) as AuthUser | null
  if (!doc) return
  const sessions = (doc.sessions ?? []).filter((s) => (sid ? s.id !== sid : keep ? s.id === keep : false))
  await payload.db.updateOne({ collection, id, data: { sessions, updatedAt: null } as never, req, returning: false })
}

/** The session id inside the JWT that authenticated this request. */
export function currentSid(req: PayloadRequest): string | null {
  const h = req.headers.get('authorization') ?? ''
  const token = h.startsWith('JWT ') ? h.slice(4) : ''
  const part = token.split('.')[1]
  if (!part) return null
  try { return (JSON.parse(Buffer.from(part, 'base64url').toString()) as { sid?: string }).sid ?? null } catch { return null }
}
