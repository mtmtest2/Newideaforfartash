# Support permissions

## Today (Content Hub)
Enforced server-side by Payload access functions on every REST/admin/Local-API request; the matrix lives in
`cms/src/access/permissions.ts`.

| Permission | support | anonymous |
|---|---|---|
| read/write/publish/delete content (articles, teachers, courses, events, languages, pages, taxonomies, redirects) | ✔ | ✘ (public site uses `/api/public/*`, published only) |
| upload/delete media | ✔ (deletion blocked while in use) | read files only |
| private course files | ✔ | ✘ |
| site settings, homepage, navigation, feature flags | ✔ | ✘ |
| read audit log | ✔ | ✘ |
| edit/delete audit log | ✘ (nobody; SQL trigger) | ✘ |
| create staff accounts | ✘ (server CLI only) | ✘ |
| change own role / activate / link identity | ✘ | ✘ |
| read staff list | ✔ | ✘ |
| run diagnostics (revalidate cache, run job queue) | ✔ (audited) | ✘ |

There is no `owner` role in the CMS; it cannot be assigned from the dashboard.

## After the central authentication phase
1. Each staff account is linked to a central user (`fartashUserId`).
2. The CMS validates the central session (`IdentityService.resolveSession`) instead of its own password login
   (Payload custom auth strategy), and maps central permissions to the matrix above.
3. Support receives, in addition: `users.read`, `users.write`, `users.suspend`, `roles.assign` (non-privileged roles
   only), `transactions.read`, `classes.read`, `audit.read`, `monitoring.read`, `tools.run`.
4. Rules enforced by the identity service: Support cannot grant itself or anyone `owner`/`support`
   (`roles.assign.privileged` is Owner-only and needs an Owner approval id); the last active Owner cannot be removed;
   every role change is audited; nobody can read passwords/OTP secrets/payment credentials.
