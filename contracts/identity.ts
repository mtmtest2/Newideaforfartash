// CONTRACT ONLY — not implemented. The future central Fartash identity & authorization service (schema "app").
// The CMS, the website and the dashboards integrate against these shapes; see docs/AUTH-CONTRACT.md.

/** One person, one account, any number of roles. Owned by the future platform API (schema app). */
export interface FartashUser {
  id: string // uuid
  phone: string // E.164 (+98…), unique, verified by OTP
  email?: string | null
  displayName: string
  status: 'applicant' | 'active' | 'suspended' | 'deactivated' | 'deleted' // soft states; 'deleted' = anonymised, records kept
  roles: Role[]
  createdAt: string
  updatedAt: string
}

/** The seven roles of the platform. `applicant` is an account state that may also carry the student role. */
export type Role = 'owner' | 'support' | 'reception' | 'supervisor' | 'teacher' | 'student' | 'applicant'

/** Fine-grained permissions checked server-side. Roles map to permission sets; the Owner can grant extras. */
export type Permission =
  | 'content.read' | 'content.write' | 'content.publish' | 'content.delete' | 'media.write' | 'flags.write' | 'settings.write'
  | 'users.read' | 'users.write' | 'users.suspend' | 'roles.assign' | 'roles.assign.privileged'
  | 'transactions.read' | 'transactions.refund' | 'classes.read' | 'classes.write' | 'attendance.write'
  | 'audit.read' | 'monitoring.read' | 'tools.run'

/** Opaque server-side session, sent as an httpOnly, Secure, SameSite=Lax cookie (`__Host-fartash_session`). */
export interface Session {
  id: string
  userId: string
  createdAt: string
  expiresAt: string // sliding, max 30 days for students; 8h for staff roles
  ip?: string
  userAgent?: string
}

/** What every backend (CMS included) receives after validating a session with the identity service. */
export interface AuthContext {
  user: Pick<FartashUser, 'id' | 'displayName' | 'status'>
  roles: Role[]
  permissions: Permission[]
  sessionId: string
}

/** Identity service endpoints (server-to-server, mTLS or shared key inside the Docker network). */
export interface IdentityService {
  /** Validate a session cookie value; null if invalid/expired/revoked. */
  resolveSession(sessionToken: string): Promise<AuthContext | null>
  /** Role changes: privileged roles (owner, support) require an Owner approval id; always audited. */
  assignRole(input: { actorId: string; userId: string; role: Role; ownerApprovalId?: string }): Promise<void>
  revokeRole(input: { actorId: string; userId: string; role: Role; ownerApprovalId?: string }): Promise<void>
}

/** Link from a CMS staff account to the central identity (cms.staff.fartash_user_id). */
export interface StaffLink { staffId: number; fartashUserId: string }
