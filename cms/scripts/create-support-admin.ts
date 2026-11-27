// Creates (or reactivates) a Support Dashboard account. Server-side only: there is no sign-up in the dashboard.
// usage: SUPPORT_EMAIL=a@b.ir SUPPORT_NAME="نام" SUPPORT_PASSWORD='…' npm run create-support-admin
import { getPayload } from 'payload'
import config from '@payload-config'

const email = process.env.SUPPORT_EMAIL?.trim().toLowerCase()
const name = process.env.SUPPORT_NAME?.trim()
const password = process.env.SUPPORT_PASSWORD ?? ''
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) { console.error('Set SUPPORT_EMAIL and SUPPORT_NAME.'); process.exit(1) }
if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) { console.error('SUPPORT_PASSWORD: at least 12 characters with letters and digits.'); process.exit(1) }

const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'staff', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
if (existing.docs[0]) {
  console.error(`An account for ${email} already exists (id ${existing.docs[0].id}). Nothing changed.`)
  process.exit(1)
}
const doc = await payload.create({ collection: 'staff', overrideAccess: true, context: { skipAudit: true }, data: { email, name, password, role: 'support', active: true } })
await payload.create({ collection: 'audit-logs', overrideAccess: true, data: {
  action: 'staff.create', entity: 'staff', entityId: String(doc.id), actorLabel: 'server-cli', actorRole: 'system',
  after: { email, name, role: 'support' }, result: 'success' } })
console.log(`Created support account ${email} (id ${doc.id}).`)
process.exit(0)
