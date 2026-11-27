# Support Control Center

## Available now
- **Overview** (dashboard home): live counts for every content module, offline-course switch state, job queue,
  latest audit events, and an explicit list of modules that wait for the central auth/payment phases.
- **Content management**: all modules in CONTENT-HUB.md.
- **System monitoring & tools**: SYSTEM-MONITORING.md.
- **Security & audit**: staff list (read), audit log (read-only, append-only).
- **Settings**: homepage, navigation, site information, feature switches.

## Deferred until the central identity and payment services exist
Member directory, account actions (suspend, restore, recovery), role management, transactions, cross-dashboard
operational views (classes, attendance, registrations, reports). They need real accounts and records; showing them
now would mean fake data. When the platform API (schema `app`) exists, they are added to this same dashboard as
custom views that call the API with the staff member's central session (see AUTH-CONTRACT.md); the permission rules
are already defined in SUPPORT-PERMISSIONS.md and the data shapes in `contracts/`.
