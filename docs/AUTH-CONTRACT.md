# Central authentication — integration contract (not implemented)

Types: `contracts/identity.ts`.

1. **One identity store** (schema `app`): `users`, `user_roles`, `role_permissions`, `user_permission_grants`,
   `sessions`, `otp_challenges` (hashed codes, short TTL, rate-limited), `audit_events` (append-only).
2. **Sign-in**: phone + SMS OTP for everyone; staff roles additionally require a second factor. Opaque session id in
   an httpOnly `__Host-` cookie; server-side session rows (revocable); staff sessions 8 h.
3. **Authorization**: every API checks permissions server-side from `AuthContext`; never from client claims.
4. **CMS integration**: a Payload custom auth strategy calls `IdentityService.resolveSession`, finds the `staff` row
   with the matching `fartashUserId` (created on first login for users holding `support`), and maps permissions to
   `cms/src/access/permissions.ts`. The CMS password login is then disabled. Content data does not change.
5. **Website**: the demo panels (`src/panel`, `src/teacher`, `src/reception`) switch from `src/school/db.ts` (browser
   storage) to the platform API behind the same session; their UI stays.
6. **Privileged roles** (owner, support) can only be granted with an Owner approval id; the last active Owner cannot
   be removed; all changes audited.
