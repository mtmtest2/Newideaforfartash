// Central permission map for the CMS (Support Dashboard). Every collection/global access function reads from here,
// and docs/SUPPORT-PERMISSIONS.md documents the same table. Enforced server-side by Payload on every request
// (REST, GraphQL, admin UI and Local API calls without overrideAccess).
//
// Identity model (see docs/ARCHITECTURE.md §Identity):
// - CMS staff identities live in the `staff` collection (schema cms). They are NOT Fartash application users.
// - The future central Fartash identity (schema app) will own students, teachers, owners, support…; each staff
//   row can then be linked through `fartashUserId` and staff login can move to SSO without changing content data.
import type { Access, FieldAccess, PayloadRequest } from 'payload'

/** Staff roles. Only owner and support may use the Content Hub (CMS admin); the other roles sign in on the website
 *  staff login (/staff/login) and reach only their own panel. Students are a separate collection (`members`). */
export const STAFF_ROLES = ['owner', 'support', 'supervisor', 'reception', 'teacher'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]
export const ROLE_LABELS: Record<StaffRole, string> = { owner: 'مالک', support: 'پشتیبانی', supervisor: 'سوپروایزر', reception: 'پذیرش', teacher: 'استاد' }

export type Permission =
  | 'content.read' | 'content.write' | 'content.publish' | 'content.delete'
  | 'media.write' | 'media.delete' | 'private.read' | 'private.write'
  | 'settings.write' | 'flags.write' | 'audit.read' | 'staff.read' | 'staff.self'
  | 'accounts.members' | 'accounts.staff.basic' | 'accounts.staff.all'

const CONTENT: Permission[] = [
  'content.read', 'content.write', 'content.publish', 'content.delete',
  'media.write', 'media.delete', 'private.read', 'private.write',
  'settings.write', 'flags.write', 'audit.read', 'staff.read', 'staff.self',
]
const MATRIX: Record<StaffRole, Permission[]> = {
  // owner: everything, including creating/changing any staff account (owner and support included)
  owner: [...CONTENT, 'accounts.members', 'accounts.staff.basic', 'accounts.staff.all'],
  // support: content hub + student accounts + teacher/reception accounts (never owner/support/supervisor)
  support: [...CONTENT, 'accounts.members', 'accounts.staff.basic'],
  supervisor: [],
  reception: [],
  teacher: [],
}
/** Staff roles a holder of each permission may create or change. */
export const MANAGEABLE_ROLES = (req: PayloadRequest): StaffRole[] =>
  can(req, 'accounts.staff.all') ? [...STAFF_ROLES] : can(req, 'accounts.staff.basic') ? ['teacher', 'reception'] : []

type StaffUser = { id: number | string; role?: StaffRole; active?: boolean; collection?: string }
const staffOf = (req: PayloadRequest): StaffUser | null => {
  const u = req.user as StaffUser | null
  return u && u.collection === 'staff' && u.active !== false ? u : null
}
export const currentStaff = staffOf

export const can = (req: PayloadRequest, p: Permission) => {
  const u = staffOf(req)
  return !!u && !!u.role && MATRIX[u.role]?.includes(p)
}

/** Access helpers */
export const allow = (p: Permission): Access => ({ req }) => can(req, p)
export const allowField = (p: Permission): FieldAccess => ({ req }) => can(req, p)
export const nobody: Access = () => false
/** Staff may read every version; the public never reads collections directly (it uses /api/public/*). */
/** Content Hub staff only (owner/support). Teachers, reception and supervisors are staff too but never read CMS data. */
export const staffOnly: Access = ({ req }) => can(req, 'staff.self')
