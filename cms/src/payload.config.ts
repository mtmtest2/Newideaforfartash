import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { fa } from '@payloadcms/translations/languages/fa'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { articleEditor } from './fields/editor'
import { AuditLogs } from './collections/AuditLogs'
import { Media } from './collections/Media'
import { PrivateFiles } from './collections/PrivateFiles'
import { Staff } from './collections/Staff'
import { Members, OtpChallenges } from './collections/Members'
import { identityEndpoints } from './identity/endpoints'
import { Articles, Authors, Categories, Courses, Events, Languages, Pages, Redirects, Tags, Teachers } from './collections/content'
import { FeatureFlags } from './globals/FeatureFlags'
import { HomeLayout, Navigation, SiteSettings } from './globals/site'
import { publicEndpoints } from './public-api/endpoints'
import { monitoringEndpoints } from './monitoring/endpoints'
import { cleanupEmptyDrafts } from './jobs/cleanup'
import { can, staffOnly } from './access/permissions'
import { adminEndpoints } from './lib/admin-endpoints'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
if (isProd && (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32)) throw new Error('PAYLOAD_SECRET must be set (32+ chars) in production')
const origins = [process.env.CMS_PUBLIC_URL, process.env.SITE_URL].filter(Boolean) as string[]

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret-change-me-dev-only-secret',
  serverURL: process.env.CMS_PUBLIC_URL || '',
  routes: { admin: '/support' }, // the CMS admin IS the Support Dashboard
  admin: {
    user: 'staff',
    avatar: 'default',
    meta: { titleSuffix: ' — داشبورد پشتیبانی فرتاش', robots: 'noindex, nofollow' },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      graphics: { Logo: '/components/Brand#Logo', Icon: '/components/Brand#Icon' },
      beforeDashboard: ['/components/Overview#Overview'],
      afterNavLinks: ['/components/NavLinks#NavLinks'],
      views: { monitoring: { Component: '/components/Monitoring#Monitoring', path: '/monitoring' } },
    },
    dateFormat: 'yyyy/MM/dd HH:mm',
  },
  i18n: { supportedLanguages: { fa }, fallbackLanguage: 'fa' },
  collections: [
    Articles, Teachers, Courses, Events, Languages, Pages, Authors, Categories, Tags, Media, PrivateFiles, Redirects,
    Staff, Members, OtpChallenges, AuditLogs,
  ],
  globals: [HomeLayout, Navigation, SiteSettings, FeatureFlags],
  editor: articleEditor,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || 'postgres://fartash:devpass@127.0.0.1:5432/fartash' },
    schemaName: 'cms', // the CMS owns schema "cms" only; schema "app" is reserved for the future Fartash platform API
    push: false, // schema changes only through reviewed migrations (src/migrations)
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  cors: origins,
  csrf: origins,
  upload: { limits: { fileSize: 20 * 1024 * 1024 } },
  graphQL: { disable: true }, // not used; smaller attack surface
  telemetry: false,
  endpoints: [...identityEndpoints, ...publicEndpoints, ...monitoringEndpoints, ...adminEndpoints],
  // saved filters/columns/sort per list ("ذخیرهٔ فیلتر"), shared or private
  queryPresets: { access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly }, constraints: {}, labels: { singular: 'فیلتر ذخیره‌شده', plural: 'فیلترهای ذخیره‌شده' } },
  jobs: {
    // runs scheduled publish/unpublish (versions.drafts.schedulePublish) every minute inside the CMS process
    autoRun: [{ cron: '* * * * *', queue: 'default', limit: 20 }],
    shouldAutoRun: () => process.env.DISABLE_JOBS !== '1',
    access: { run: ({ req }) => can(req, 'settings.write') },
    tasks: [cleanupEmptyDrafts],
  },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
