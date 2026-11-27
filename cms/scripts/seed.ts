// One-time import of the content the public site shows today (src/data.ts, Header/Footer links, contact info), so the
// site looks the same after switching to the CMS. Idempotent: does nothing if teachers already exist.
// Nothing new is invented: article bodies are only their existing summaries and stay `noindex` until Support writes
// the full text; teacher card numbers are the values already shown on the site (src/data.ts marks them as placeholders).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction } from 'payload'
import config from '@payload-config'

// images of the current website (mounted read-only into the tools container in production: SEED_ASSETS_DIR)
const img = (f: string) => path.resolve(process.env.SEED_ASSETS_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/assets/img'), f)
const para = (text: string) => ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'rtl', children: [
  { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'rtl', textFormat: 0, textStyle: '', children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] }] } })
const CEFR = [['A1', 'مبتدی'], ['A2', 'مقدماتی'], ['B1', 'متوسط'], ['B2', 'فوق‌متوسط'], ['C1', 'پیشرفته'], ['C2', 'تسلط کامل']] as const

const payload = await getPayload({ config })
const ctx = { skipAudit: true }
if ((await payload.count({ collection: 'teachers', overrideAccess: true })).totalDocs) { console.log('Already seeded; nothing to do.'); process.exit(0) }

// everything below runs in one database transaction: a failure leaves the database untouched
const req = await createLocalReq({}, payload)
await initTransaction(req)
try {
async function upload(file: string, alt: string, category: string) {
  return payload.create({ collection: 'media', overrideAccess: true, req, context: ctx, data: { alt, category: category as never }, filePath: img(file) })
}

const LANGS = [
  { slug: 'english', name: 'زبان انگلیسی', shortName: 'انگلیسی', flag: 'uk', exams: ['IELTS', 'TOEFL'], intro: 'تقویت مهارت‌های چهارگانهٔ زبان انگلیسی برای تحصیل، کار و زندگی روزمره.' },
  { slug: 'german', name: 'زبان آلمانی', shortName: 'آلمانی', flag: 'de', exams: ['Goethe-Zertifikat', 'TestDaF'], intro: 'یادگیری آلمانی با تمرکز بر مکالمه و آمادگی آزمون‌های بین‌المللی.' },
  { slug: 'french', name: 'زبان فرانسوی', shortName: 'فرانسوی', flag: 'fr', exams: ['DELF', 'DALF', 'TCF'], intro: 'یادگیری فرانسوی به‌صورت کاربردی برای تحصیل، مهاجرت و فرصت‌های شغلی.' },
  { slug: 'arabic', name: 'زبان عربی', shortName: 'عربی', flag: 'sa', exams: [], intro: 'عربی فصیح و محاوره‌ای برای سفر، کار در کشورهای عربی و درک متون.' },
  { slug: 'turkish', name: 'زبان ترکی استانبولی', shortName: 'ترکی استانبولی', flag: 'tr', exams: ['TÖMER'], intro: 'ترکی استانبولی از پایه تا مکالمهٔ روان، برای تحصیل و زندگی در ترکیه.' },
] as const
const langIds: Record<string, number> = {}
for (const l of LANGS) {
  const d = await payload.create({ collection: 'languages', overrideAccess: true, req, context: ctx, data: {
    slug: l.slug, name: l.name, shortName: l.shortName, flag: l.flag, intro: l.intro, _status: 'published',
    levels: CEFR.map(([code, title]) => ({ code, title })), exams: l.exams.map((name) => ({ name })),
    seo: { noindex: true }, // language pages are new; index them after Support writes their descriptions
  } as never })
  langIds[l.slug] = d.id as number
}

const TEACHERS = [
  { first: 'آرمان', last: 'کیانی', slug: 'arman-kiani', lang: 'english', title: 'مدرس آیلتس و مکالمه', file: 'prof-en.webp', tags: ['عمومی', 'آیلتس', 'مکالمه'], students: 370, rating: 4.9, level: 'متوسط' },
  { first: 'مهسا', last: 'فرهادی', slug: 'mahsa-farhadi', lang: 'german', title: 'مدرس آزمون‌های گوته', file: 'prof-de.webp', tags: ['عمومی', 'آزمون گوته', 'مکالمه'], students: 520, rating: 4.8, level: 'متوسط' },
  { first: 'سینا', last: 'رضایی', slug: 'sina-rezaei', lang: 'french', title: 'مدرس آزمون DELF و مکالمه', file: 'prof-fr.webp', tags: ['عمومی', 'DELF', 'مکالمه'], students: 950, rating: 4.9, level: 'متوسط' },
  { first: 'زهرا', last: 'موسوی', slug: 'zahra-mousavi', lang: 'arabic', title: 'مدرس عربی فصیح و محاوره', file: 'prof-ar.webp', tags: ['عمومی', 'محاوره', 'فصیح'], students: 410, rating: 4.8, level: 'مقدماتی' },
  { first: 'کاوه', last: 'احمدی', slug: 'kaveh-ahmadi', lang: 'turkish', title: 'مدرس ترکی و آزمون TÖMER', file: 'prof-tr.webp', tags: ['عمومی', 'TÖMER', 'مکالمه'], students: 630, rating: 4.9, level: 'مقدماتی' },
]
for (const t of TEACHERS) {
  const photo = await upload(t.file, `استاد ${t.first} ${t.last}`, 'teachers')
  await payload.create({ collection: 'teachers', overrideAccess: true, req, context: ctx, data: {
    firstName: t.first, lastName: t.last, slug: t.slug, title: t.title, photo: photo.id, languages: [langIds[t.lang]],
    cardText: LANGS.find((l) => l.slug === t.lang)!.intro, cardTags: t.tags, cardLevel: t.level, students: t.students, rating: t.rating,
    profileState: 'active', showOnHome: true, _status: 'published',
  } as never })
}

const author = await payload.create({ collection: 'authors', overrideAccess: true, req, context: ctx, data: { name: 'تحریریهٔ فرتاش', slug: 'fartash', role: 'آموزشگاه آنلاین زبان فرتاش' } })
const catIds: Record<string, number> = {}
for (const [name, slug] of [['محتوای آموزشی', 'education'], ['زبان آلمانی', 'german'], ['زبان فرانسوی', 'french'], ['یادگیری', 'learning'], ['ابزار', 'tools']]) {
  catIds[name] = (await payload.create({ collection: 'categories', overrideAccess: true, req, context: ctx, data: { name, slug } })).id as number
}
const POSTS = [
  { slug: 'english-speaking-skills', title: 'چگونه مهارت مکالمهٔ انگلیسی را تقویت کنیم؟', text: '۵ راهکار کاربردی برای صحبت روان‌تر و با اعتمادبه‌نفس بیشتر.', file: 'blog-english.webp', cat: 'محتوای آموزشی', lang: 'english' },
  { slug: 'common-german-mistakes', title: 'اشتباهات رایج در یادگیری آلمانی', text: 'رایج‌ترین اشتباه‌ها و راه پرهیز از آن‌ها.', file: 'blog-writing.webp', cat: 'زبان آلمانی', lang: 'german' },
  { slug: 'useful-french-phrases', title: 'عبارات پرکاربرد زبان فرانسوی', text: 'عباراتی که در سفر و مکالمه به کارتان می‌آیند.', file: 'blog-paris.webp', cat: 'زبان فرانسوی', lang: 'french' },
  { slug: 'daily-learning-habits', title: 'عادت‌های روزانه برای یادگیری سریع‌تر', text: 'با ده دقیقه تمرین هر روز، نتیجهٔ چشمگیری بگیرید.', file: 'blog-book.webp', cat: 'یادگیری', lang: null },
  { slug: 'online-listening-tools', title: 'بهترین ابزارهای آنلاین برای تمرین شنیداری', text: 'با این ابزارها گوش‌دادن فعال را تمرین کنید.', file: 'blog-laptop.webp', cat: 'ابزار', lang: null },
]
let day = 0
for (const p of POSTS) {
  const cover = await upload(p.file, '-', 'magazine')
  await payload.create({ collection: 'articles', overrideAccess: true, req, context: ctx, data: {
    slug: p.slug, title: p.title, excerpt: p.text, cover: cover.id, content: para(p.text), author: author.id, category: catIds[p.cat],
    language: p.lang ? langIds[p.lang] : undefined, _status: 'published', publishedAt: new Date(Date.now() - (day++ + 1) * 86400000).toISOString(),
    seo: { noindex: true }, // body not written yet
  } as never })
}

await payload.updateGlobal({ slug: 'navigation', overrideAccess: true, req, context: ctx, data: {
  header: [{ label: 'خانه', href: '/#home' }, { label: 'مسیر یادگیری', href: '/#steps' }, { label: 'اساتید', href: '/teachers' }, { label: 'مقالات', href: '/magazine' }, { label: 'تماس با ما', href: '/#contact' }],
  footer: [{ label: 'خانه', href: '/#home' }, { label: 'مسیر یادگیری', href: '/#steps' }, { label: 'معرفی دوره‌ها', href: '/#intro' }, { label: 'اساتید و کلاس‌ها', href: '/#classes' },
    { label: 'مقالات', href: '/#blog' }, { label: 'نظرات زبان‌آموزان', href: '/#testimonials' }, { label: 'سؤالات متداول و مشاوره', href: '/#contact' }, { label: 'تعیین سطح رایگان', href: '/placement' }],
} })
await payload.updateGlobal({ slug: 'site-settings', overrideAccess: true, req, context: ctx, data: {} })
await payload.updateGlobal({ slug: 'home-layout', overrideAccess: true, req, context: ctx, data: {} })
await payload.updateGlobal({ slug: 'feature-flags', overrideAccess: true, req, context: ctx, data: { offlineCoursesEnabled: false } })
await payload.create({ collection: 'redirects', overrideAccess: true, req, context: ctx, data: { from: '/blog', to: '/magazine', type: '301' } })
await payload.create({ collection: 'audit-logs', overrideAccess: true, req, data: { action: 'seed', entity: 'content', actorLabel: 'server-cli', actorRole: 'system', result: 'success',
  after: { languages: LANGS.length, teachers: TEACHERS.length, articles: POSTS.length } } })
await commitTransaction(req)
console.log('Seeded: 5 languages, 5 teachers, 5 articles, navigation, settings, /blog → /magazine redirect.')
process.exit(0)
} catch (e) {
  await killTransaction(req)
  console.error('Seed failed; database rolled back.', e)
  process.exit(1)
}
