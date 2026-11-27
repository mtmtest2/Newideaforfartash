// Creates a staff account from the server. Use it for the FIRST owner; after that, the owner creates every other
// staff account from the website dashboard (/owner). There is no self-service staff sign-up.
// usage: STAFF_ROLE=owner STAFF_USERNAME=owner.ali STAFF_NAME="علی …" STAFF_PASSWORD='…' [STAFF_EMAIL=a@b.ir] [STAFF_PHONE=0912…] npm run create-staff
import { getPayload } from 'payload'
import config from '@payload-config'
import { ROLE_LABELS, STAFF_ROLES, type StaffRole } from '../src/access/permissions'
import { normalizePhone, normalizeUsername, passwordProblem } from '../src/identity/util'

const role = (process.env.STAFF_ROLE || process.env.SUPPORT_ROLE || 'owner').trim() as StaffRole
const username = normalizeUsername(process.env.STAFF_USERNAME)
const name = (process.env.STAFF_NAME || process.env.SUPPORT_NAME || '').trim()
const password = process.env.STAFF_PASSWORD || process.env.SUPPORT_PASSWORD || ''
const email = (process.env.STAFF_EMAIL || process.env.SUPPORT_EMAIL || '').trim().toLowerCase() || undefined
const phone = process.env.STAFF_PHONE ? normalizePhone(process.env.STAFF_PHONE) : undefined
const die = (m: string) => { console.error(m); process.exit(1) }
if (!STAFF_ROLES.includes(role)) die(`STAFF_ROLE must be one of: ${STAFF_ROLES.join(', ')}`)
if (!username) die('STAFF_USERNAME: 4–30 latin letters/digits/._, starting with a letter.')
if (name.length < 2) die('Set STAFF_NAME.')
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) die('STAFF_EMAIL is not a valid email.')
if (process.env.STAFF_PHONE && !phone) die('STAFF_PHONE is not a valid Iranian mobile number.')
const problem = passwordProblem(password, username)
if (problem) die(`STAFF_PASSWORD: ${problem}`)

const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'staff', where: { username: { equals: username } }, limit: 1, overrideAccess: true })
if (existing.docs[0]) die(`An account with username ${username} already exists (id ${existing.docs[0].id}). Nothing changed.`)
const doc = await payload.create({ collection: 'staff', overrideAccess: true, context: { skipAudit: true, trustedStaffCreate: true },
  data: { username: username!, name, password, role, active: true, ...(email ? { email } : {}), ...(phone ? { phone } : {}) } as never })
await payload.create({ collection: 'audit-logs', overrideAccess: true, data: {
  action: 'staff.create', entity: 'staff', entityId: String(doc.id), actorLabel: 'server-cli', actorRole: 'system', actorName: 'سامانه',
  summary: `حساب ${ROLE_LABELS[role]} «${name}» از سرور ساخته شد`, after: { username, name, role }, result: 'success' } })
console.log(`Created ${role} account "${username}" (id ${doc.id}).`)
process.exit(0)
