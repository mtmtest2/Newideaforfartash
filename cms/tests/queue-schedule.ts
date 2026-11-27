// Queues a scheduled publish exactly like the dashboard's "schedule publish" action does (server-side job queue).
// usage: npx payload run tests/queue-schedule.ts <collection> <id> <seconds-from-now>
import { getPayload } from 'payload'
import config from '@payload-config'

const [collection, id, secs] = process.argv.slice(-3)
const payload = await getPayload({ config })
const job: { id: number | string } = await payload.jobs.queue({ task: 'schedulePublish' as never, queue: 'default', waitUntil: new Date(Date.now() + Number(secs) * 1000),
  input: { type: 'publish', doc: { relationTo: collection, value: Number(id) } } as never }) as never
console.log(`queued job ${job.id}`)
process.exit(0)
