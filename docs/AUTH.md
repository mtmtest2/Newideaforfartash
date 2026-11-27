# Sign-in, sign-up and accounts

## Addresses
| Who | Sign-in page | After sign-in |
|---|---|---|
| Students / site users | `/login` (sign-up: `/register`) | `/panel` |
| Teacher | `/staff/login` | `/teacher` |
| Reception | `/staff/login` | `/reception` |
| Supervisor | `/staff/login` | `/supervisor` |
| Support | `/staff/login` | `/support-desk` (+ Content Hub at `CMS_PUBLIC_URL/support`) |
| Owner | `/staff/login` | `/owner` |

`/staff/login` is not linked from the public site, is `noindex` and disallowed in `robots.txt`. Its address is not a
secret, and security doesn't depend on hiding it.

## Methods
- **Username + password**: works now for everyone.
- **Phone + one-time code**: fully implemented, but switched off until an SMS provider is chosen (`SMS_PROVIDER`
  empty → the tab shows «به‌زودی» and the endpoints answer 503). Members without an account get one on first code
  sign-in. Staff can use it only if the owner stored their mobile number.
  - Local development only: `SMS_PROVIDER=console` writes the code to the CMS log and shows it on the form. This mode
    is refused when `NODE_ENV=production`.
  - Adding a provider: implement `SmsProvider` in `cms/src/identity/sms.ts` (e.g. Kavenegar *verify/lookup*), register
    it in `providers`, put its API key in the CMS environment and set `SMS_PROVIDER=<name>`.

## Accounts and roles
- `members` (CMS schema `cms.members`): students and site users. Self sign-up, or created by a phone code.
- `staff` (`cms.staff`): roles `owner`, `support`, `supervisor`, `reception`, `teacher`. There is no self sign-up.
  - The **first owner** is created on the server:
    `STAFF_ROLE=owner STAFF_USERNAME=… STAFF_NAME=… STAFF_PASSWORD=… npm run create-staff`.
  - After that, the owner creates every staff account from `/owner`. Support can create and manage only teacher and
    reception accounts.
  - Safety rules: the last active owner can't be deactivated or demoted, and nobody can change their own role or
    active state.
- Only owner and support can enter the CMS Content Hub. Other staff roles are refused there, even with a correct
  password.

## How it works
```
browser ──(sealed httpOnly cookie)──▶ web server (server/auth.mjs) ──(internal key + JWT)──▶ CMS /api/identity/*
```
- **Passwords**: hashed by Payload (PBKDF2 with salt; hashes are upgraded automatically). The policy is 10–128
  characters, not a common or digit-only password, and not containing the username. It applies to every password
  write: sign-up, change, admin reset and the CMS form.
- **Sessions**: server-side session ids on the account row (`*_sessions` tables). Sessions last 14 days for members and
  8 hours for staff. Logout, password change, deactivation, role change and "sign out everywhere" delete them, so an
  old cookie stops working within 5 seconds (the web server's validation cache).
- **Cookies**: the CMS JWT never reaches the browser.
  - It is sealed with AES-256-GCM (`SESSION_SECRET`) into `__Host-fartash_m` (members, `SameSite=Lax`) or
    `__Host-fartash_s_<role>` (one per staff role, `SameSite=Strict`). All are `HttpOnly; Secure; Path=/`.
  - The cookie name is bound into the encryption, so a cookie can't be moved to another role's slot. The role is
    re-checked with the CMS on every request.
- **CSRF**: every state-changing call must be same-origin (`Origin`, or `Sec-Fetch-Site: same-origin`) and JSON.
- **Brute force**: limits per client IP on the web server, and per account and phone in the CMS:
  - Login: 10 per 5 minutes per IP, plus account lockout after 5 failures for 15 minutes.
  - Sign-up: 5 per hour per IP.
  - Codes: one per 60 seconds and 5 per hour per phone, 20 per hour per IP. A code allows 5 attempts and expires
    after 2 minutes.
  - Codes are stored only as HMACs and checked in constant time; old codes are deleted after a day.
- **No account enumeration on sign-in**: wrong password, unknown user, locked or inactive accounts all get the same
  message with padded timing. A staff code request answers the same whether the number exists or not.
- **Server-side page guards**: `/panel`, `/teacher`, `/reception`, `/supervisor`, `/support-desk` and `/owner` are
  answered with a redirect before any HTML is sent, unless the right session exists. Their responses are
  `private, no-store`.
- **Internal API**: `/api/identity/*` requires the internal key (otherwise 404) and is also blocked at Caddy. The
  `members` and `otp-challenges` collections have no REST/GraphQL endpoints at all.
- **Audit**: staff sign-ins, failed staff sign-ins and every account action (create, role, activate, password reset,
  unlock, sign-out) go to the append-only audit log, shown on the owner and support dashboards.

## Demo panels
The student, teacher and reception panels still show **sample data** from the browser store (classes, homework,
chats). Only who is signed in is real now. Their data moves to the server in its own phase.

## Tests
- `cms/tests/identity.mjs` (81 attack-oriented checks, needs `TRUST_PROXY=1` on the web server).
- `scripts/e2e.cjs` and `scripts/e2e-teacher.cjs` sign in through the real forms (accounts are created by
  `scripts/e2e-accounts.cjs` with the dev owner).
