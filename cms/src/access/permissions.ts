// Central permission map for the CMS (Support Dashboard). Every collection/global access function reads from here,
// and docs/SUPPORT-PERMISSIONS.md documents the same table. Enforced server-side by Payload on every request
// (REST, GraphQL, admin UI and Local API calls without overrideAccess).
//
// Identity model (see docs/ARCHITECTURE.md §Identity):
// - CMS staff identities live in the `staff` collection (schema cms). They are NOT Fartash application users.
// - The future central Fartash identity (schema app) will own students, teachers, owners, support…; each staff
//   row can then be linked through `fartashUserId` and staff login can move to SSO without changing content data.
import type { Access, FieldAccess, PayloadRequest } from 'payload'

/** Roles that exist today. `owner` is reserved for the future central auth and cannot be assigned from the CMS. */
export const STAFF_ROLES = ['support'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export type Permission =
  | 'content.read' | 'content.write' | 'content.publish' | 'content.delete'
  | 'media.write' | 'media.delete' | 'private.read' | 'private.write'
  | 'settings.write' | 'flags.write' | 'audit.read' | 'staff.read' | 'staff.self'

const MATRIX: Record<StaffRole, Permission[]> = {
  support: [
    'content.read', 'content.write', 'content.publish', 'content.delete',
    'media.write', 'media.delete', 'private.read', 'private.write',
    'settings.write', 'flags.write', 'audit.read', 'staff.read', 'staff.self',
  ],
}

type StaffUser = { id: number | string; role?: StaffRole; active?: boolean; collection?: string }
const staffOf = (req: PayloadRequest): StaffUser | null => {
  const u = req.user as StaffUser | null
  return u && u.collection === 'staff' && u.active !== false ? u : null
}

export const can = (req: PayloadRequest, p: Permission) => {
  const u = staffOf(req)
  return !!u && !!u.role && MATRIX[u.role]?.includes(p)
}

/** Access helpers */
export const allow = (p: Permission): Access => ({ req }) => can(req, p)
export const allowField = (p: Permission): FieldAccess => ({ req }) => can(req, p)
export const nobody: Access = () => false
/** Staff may read every version; the public never reads collections directly (it uses /api/public/*). */
export const staffOnly: Access = ({ req }) => !!staffOf(req)
