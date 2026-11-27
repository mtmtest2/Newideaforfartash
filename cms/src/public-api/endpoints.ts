// Stable public content API consumed by the Vite site (docs/CONTENT-HUB.md §Public API).
// Rules: only published content whose publish time has passed; archived/inactive excluded; offline courses only when the
// feature flag is on (otherwise the routes answer exactly like unknown routes); responses are DTOs, never raw Payload docs;
// private fields (meeting links, private files, video asset ids, fartashUserId…) are never included.
import type { Endpoint, PayloadRequest, Where } from 'payload'
import { offlineCoursesOn } from '../globals/FeatureFlags'
import { verifyPreview } from '../lib/preview'
import { embedUrl, headingId, richTextToHtml } from './html'

type Doc = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const nowIso = () => new Date().toISOString()
/** Published and (for dated collections) publish time reached. Teachers and languages have no publish date. */
const published = (extra: Where[] = [], dated = true): Where => ({
  and: [{ _status: { equals: 'published' } }, ...(dated ? [{ or: [{ publishedAt: { exists: false } }, { publishedAt: { less_than_equal: nowIso() } }] }] : []), ...extra],
})
const UNDATED = new Set(['teachers', 'languages'])
const json = (data: unknown, status = 200, maxAge = 30) =>
  Response.json(data, { status, headers: { 'Cache-Control': status === 200 ? `public, max-age=${maxAge}, stale-while-revalidate=300` : 'no-store' } })
const notFound = () => json({ error: 'not_found' }, 404)
const authorized = (req: PayloadRequest) => {
  // Only the Fartash web server calls this API (server-to-server). Browsers never see the secret.
  const secret = process.env.CONTENT_API_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return req.headers.get('authorization') === `Bearer ${secret}`
}
const guard = (fn: (req: PayloadRequest) => Promise<Response>) => async (req: PayloadRequest) => (authorized(req) ? fn(req) : json({ error: 'unauthorized' }, 401))

const base = () => (process.env.MEDIA_PUBLIC_URL || process.env.CMS_PUBLIC_URL || '').replace(/\/$/, '')
export const mediaUrl = (m: Doc | null | undefined, size?: 'thumb' | 'card' | 'wide') => {
  if (!m || typeof m !== 'object') return null
  const u = (size && m.sizes?.[size]?.url) || m.url
  return u ? (u.startsWith('http') ? u : base() + u) : null
}
const image = (m: Doc | null | undefined) => (m && typeof m === 'object' ? {
  src: mediaUrl(m), width: m.width ?? null, height: m.height ?? null, alt: m.alt && m.alt !== '-' ? m.alt : '',
  srcSet: (['thumb', 'card', 'wide'] as const).filter((s) => m.sizes?.[s]?.url).map((s) => `${mediaUrl(m, s)} ${m.sizes[s].width}w`).join(', ') || null,
} : null)
const seo = (d: Doc, fallbackTitle: string, fallbackDesc: string) => ({
  title: d.seo?.title || fallbackTitle, description: d.seo?.description || fallbackDesc, canonical: d.seo?.canonical || null,
  noindex: !!d.seo?.noindex, image: mediaUrl(d.seo?.image) ?? null, ogTitle: d.seo?.ogTitle || null, ogDescription: d.seo?.ogDescription || null,
  focusKeyword: undefined, // editorial only, never sent
})

async function flags(req: PayloadRequest) {
  const f = await req.payload.findGlobal({ slug: 'feature-flags', overrideAccess: true, req, depth: 0 })
  return { offlineCourses: offlineCoursesOn(f) }
}

/* ---------- DTO mappers ---------- */
export const teacherCard = (t: Doc) => {
  const lang = Array.isArray(t.languages) ? t.languages.find((l: Doc) => l && typeof l === 'object' && l._status === 'published') : null
  return {
    slug: t.slug, name: t.displayName, title: t.title, photo: image(t.photo),
    lang: lang?.name ?? '', flag: lang?.flag ?? null, tags: t.cardTags ?? [], level: t.cardLevel ?? '', text: t.cardText ?? '',
    students: typeof t.students === 'number' ? t.students : null, rating: typeof t.rating === 'number' ? t.rating : null,
  }
}
const articleCard = (a: Doc) => ({
  slug: a.slug, title: a.title, excerpt: a.excerpt, cover: image(a.cover), readingTime: a.readingTime ?? null,
  category: a.category && typeof a.category === 'object' ? { name: a.category.name, slug: a.category.slug } : null,
  publishedAt: a.publishedAt ?? null, updatedAt: a.updatedAt,
})
const eventCard = (e: Doc) => ({
  slug: e.slug, type: e.type, title: e.title, subtitle: e.subtitle ?? null, excerpt: e.excerpt, poster: image(e.poster),
  startsAt: e.startsAt, endsAt: e.endsAt, timezone: e.timezone, format: e.format, registration: e.registration,
  price: e.price ?? 0, featured: !!e.featured, past: new Date(e.endsAt) < new Date(),
})
const courseCard = (c: Doc) => ({
  slug: c.slug, title: c.title, subtitle: c.subtitle ?? null, excerpt: c.excerpt, cover: image(c.cover),
  language: c.language && typeof c.language === 'object' ? { name: c.language.name, slug: c.language.slug, flag: c.language.flag } : null,
  levels: c.level ?? [], instructor: c.instructor && typeof c.instructor === 'object' ? { name: c.instructor.displayName, slug: c.instructor.slug } : null,
  totalLessons: c.totalLessons ?? 0, totalMinutes: c.totalMinutes ?? 0, featured: !!c.featured,
  price: typeof c.price === 'number' ? c.price : null,
})
const activeTeacher: Where[] = [{ profileState: { equals: 'active' } }]
const liveCourse = (): Where[] => [
  { workflowStatus: { not_equals: 'archived' } },
  { or: [{ availableFrom: { exists: false } }, { availableFrom: { less_than_equal: nowIso() } }] },
  { or: [{ availableTo: { exists: false } }, { availableTo: { greater_than: nowIso() } }] },
]

/* ---------- loaders (also used by preview) ---------- */
async function articleDetail(req: PayloadRequest, a: Doc) {
  const { html, toc } = richTextToHtml(a.content, (m) => mediaUrl(m, 'wide'))
  const relatedIds = (a.related ?? []).map((r: Doc) => (typeof r === 'object' ? r.id : r))
  const related = relatedIds.length ? (await req.payload.find({ collection: 'articles', where: published([{ id: { in: relatedIds } }]), depth: 1, limit: 4, overrideAccess: true, req })).docs : []
  return {
    ...articleCard(a), html, toc,
    author: a.author && typeof a.author === 'object' ? { name: a.author.name, role: a.author.role ?? null, avatar: image(a.author.avatar) } : null,
    tags: (a.tags ?? []).filter((t: Doc) => t && typeof t === 'object').map((t: Doc) => ({ name: t.name, slug: t.slug })),
    language: a.language && typeof a.language === 'object' && a.language._status === 'published' ? { name: a.language.name, slug: a.language.slug } : null,
    related: related.map(articleCard),
    seo: seo(a, a.title, a.excerpt),
  }
}
const teacherDetail = (t: Doc) => ({
  ...teacherCard(t),
  firstName: t.firstName, lastName: t.lastName, bio: richTextToHtml(t.bio, (m) => mediaUrl(m, 'card')).html,
  languages: (t.languages ?? []).filter((l: Doc) => l && typeof l === 'object' && l._status === 'published').map((l: Doc) => ({ name: l.name, slug: l.slug, flag: l.flag })),
  levels: t.levels ?? [], specializations: (t.specializations ?? []).map((s: Doc) => s.label),
  qualifications: (t.qualifications ?? []).map((s: Doc) => s.label), certificates: (t.certificates ?? []).map((s: Doc) => ({ label: s.label, year: s.year ?? null })),
  experienceYears: t.experienceYears ?? null, introVideo: t.introVideo ? embedUrl(t.introVideo) : null,
  seo: seo(t, `${t.displayName} — ${t.title}`, t.cardText ?? ''),
})
const eventDetail = (e: Doc) => ({
  ...eventCard(e), description: richTextToHtml(e.description, (m) => mediaUrl(m, 'wide')).html,
  venue: e.format === 'offline' ? e.venue ?? null : null, // meeting links are private
  registrationUrl: e.registration === 'open' ? e.registrationUrl ?? null : null, capacity: e.capacity ?? null,
  requirements: e.requirements ?? null, audience: e.audience ?? null,
  speaker: e.speakerTeacher && typeof e.speakerTeacher === 'object' && e.speakerTeacher.profileState === 'active' ? { name: e.speakerTeacher.displayName, slug: e.speakerTeacher.slug } : e.speakerName ? { name: e.speakerName, slug: null } : null,
  language: e.language && typeof e.language === 'object' ? { name: e.language.name, slug: e.language.slug } : null,
  seo: seo(e, e.title, e.excerpt),
})
const courseDetail = (c: Doc) => ({
  ...courseCard(c), description: richTextToHtml(c.description, (m) => mediaUrl(m, 'wide')).html,
  audience: c.audience ?? null, prerequisites: c.prerequisites ?? null, objectives: (c.objectives ?? []).map((o: Doc) => o.text),
  promoVideo: c.promoVideo ? embedUrl(c.promoVideo) : null, estimatedWeeks: c.estimatedWeeks ?? null, difficulty: c.difficulty ?? null,
  // curriculum outline only: titles, durations, preview flags. Video asset ids and private files are never exposed.
  modules: (c.modules ?? []).map((m: Doc) => ({ title: m.title, description: m.description ?? null, chapters: (m.chapters ?? []).map((ch: Doc) => ({
    title: ch.title, lessons: (ch.lessons ?? []).map((l: Doc) => ({ id: l.id, title: l.title, minutes: l.minutes ?? null, preview: !!l.preview })) })) })),
  enrollment: c.enrollment, purchasable: false, // purchases open only when the payment service exists (docs/PAYMENTS-CONTRACT.md)
  accessDays: c.accessDays ?? 0,
  seo: seo(c, c.title, c.excerpt),
})
const languageDetail = async (req: PayloadRequest, l: Doc) => {
  const [teachers, articles] = await Promise.all([
    req.payload.find({ collection: 'teachers', where: published([...activeTeacher, { languages: { contains: l.id } }], false), sort: '_order', depth: 2, limit: 50, overrideAccess: true, req }),
    req.payload.find({ collection: 'articles', where: published([{ language: { equals: l.id } }]), sort: '-publishedAt', depth: 1, limit: 6, overrideAccess: true, req }),
  ])
  return {
    slug: l.slug, name: l.name, shortName: l.shortName, flag: l.flag, intro: l.intro, image: image(l.image),
    description: richTextToHtml(l.description, (m) => mediaUrl(m, 'wide')).html,
    levels: (l.levels ?? []).map((x: Doc) => ({ code: x.code, title: x.title, description: x.description ?? null })),
    exams: (l.exams ?? []).map((x: Doc) => ({ name: x.name, description: x.description ?? null })),
    resources: (l.resources ?? []).map((x: Doc) => ({ title: x.title, url: x.url ?? null })),
    teachers: teachers.docs.map(teacherCard), articles: articles.docs.map(articleCard),
    seo: seo(l, l.name, l.intro),
  }
}
const pageDetail = (p: Doc) => ({
  slug: p.slug, title: p.title, kind: p.kind,
  blocks: (p.blocks ?? []).map((b: Doc) => {
    switch (b.blockType) {
      case 'intro': return { type: 'intro', heading: b.heading, text: b.text ?? null, image: image(b.image) }
      case 'richText': return { type: 'richText', html: richTextToHtml(b.body, (m) => mediaUrl(m, 'wide')).html }
      case 'faq': return { type: 'faq', title: b.title ?? null, items: (b.items ?? []).map((i: Doc) => ({ q: i.q, a: i.a })) }
      case 'cta': return { type: 'cta', heading: b.heading, text: b.text ?? null, buttonLabel: b.buttonLabel, href: b.href }
      case 'contact': return { type: 'contact', title: b.title ?? null }
      case 'announcement': return { type: 'announcement', tone: b.tone, text: b.text }
      default: return null
    }
  }).filter(Boolean),
  seo: seo(p, p.title, ''),
})

async function siteChrome(req: PayloadRequest, f: { offlineCourses: boolean }) {
  const [nav, settings] = await Promise.all([
    req.payload.findGlobal({ slug: 'navigation', overrideAccess: true, req, depth: 0 }),
    req.payload.findGlobal({ slug: 'site-settings', overrideAccess: true, req, depth: 1 }),
  ])
  const header = (nav.header ?? []).map((l: Doc) => ({ label: l.label, href: l.href }))
  if (f.offlineCourses) header.push({ label: 'دوره‌های آفلاین', href: '/courses' })
  return {
    nav: { header, footer: (nav.footer ?? []).map((l: Doc) => ({ label: l.label, href: l.href })) },
    settings: {
      name: settings.name, contact: settings.contact ?? {},
      social: Object.fromEntries(Object.entries(settings.social ?? {}).filter(([k, v]) => k !== 'id' && v)),
      seo: { titleSuffix: settings.seo?.titleSuffix ?? ' | فرتاش', description: settings.seo?.description ?? null, image: mediaUrl(settings.seo?.image as unknown as Doc) },
    },
  }
}

async function buildHome(req: PayloadRequest, f: { offlineCourses: boolean }) {
    const home = await req.payload.findGlobal({ slug: 'home-layout', overrideAccess: true, req, depth: 0 })
    const [teachers, articles, events] = await Promise.all([
      req.payload.find({ collection: 'teachers', where: published([...activeTeacher, { showOnHome: { equals: true } }], false), sort: '_order', depth: 2, limit: 24, overrideAccess: true, req }),
      req.payload.find({ collection: 'articles', where: published(), sort: '-publishedAt', depth: 1, limit: 6, overrideAccess: true, req }),
      home.events?.enabled ? req.payload.find({ collection: 'events', where: published([{ showOnHome: { equals: true } }, { endsAt: { greater_than: nowIso() } }]), sort: 'startsAt', depth: 1, limit: 6, overrideAccess: true, req }) : null,
    ])
    let courses: ReturnType<typeof courseCard>[] = []
    if (f.offlineCourses) {
      const c = home.courses ?? {}
      if (c.selection === 'manual' && c.picked?.length) {
        const ids = c.picked.map((x: Doc | number) => (typeof x === 'object' ? x.id : x))
        const docs = (await req.payload.find({ collection: 'courses', where: published([...liveCourse(), { id: { in: ids } }]), depth: 1, limit: 24, overrideAccess: true, req })).docs
        courses = ids.map((id: number) => docs.find((d) => d.id === id)).filter(Boolean).map((d: unknown) => courseCard(d as Doc))
      } else {
        courses = (await req.payload.find({ collection: 'courses', where: published([...liveCourse(), { showOnHome: { equals: true } }]), sort: '_order', depth: 1, limit: 24, overrideAccess: true, req })).docs.map(courseCard)
      }
    }
    return ({
      ...(await siteChrome(req, f)),
      teachers: { tag: home.teachers?.tag, title: home.teachers?.title, description: home.teachers?.description, items: teachers.docs.map(teacherCard) },
      articles: articles.docs.map(articleCard),
      // absent (not empty) when the feature is off or nothing is configured: the site renders no section at all
      ...(f.offlineCourses && courses.length ? { courses: { tag: home.courses?.tag, title: home.courses?.title, description: home.courses?.description, position: home.courses?.position ?? 'afterClasses', items: courses } } : {}),
      ...(events && events.docs.length ? { events: { title: home.events?.title, items: events.docs.map(eventCard) } } : {}),
    })
}

/* ---------- endpoints ---------- */
const getParam = (req: PayloadRequest, k: string) => String((req.routeParams as Record<string, unknown> | undefined)?.[k] ?? '')
const q = (req: PayloadRequest, k: string) => new URL(req.url ?? 'http://x').searchParams.get(k)

export const publicEndpoints: Endpoint[] = [
  { path: '/public/site', method: 'get', handler: guard(async (req) => json(await siteChrome(req, await flags(req)))) },

  { path: '/public/home', method: 'get', handler: guard(async (req) => json(await buildHome(req, await flags(req)))) },

  { path: '/public/teachers', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'teachers', where: published(activeTeacher, false), sort: '_order', depth: 2, limit: 100, overrideAccess: true, req })
    return json({ items: r.docs.map(teacherCard) })
  }) },
  { path: '/public/teachers/:slug', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'teachers', where: published([...activeTeacher, { slug: { equals: getParam(req, 'slug') } }], false), depth: 2, limit: 1, overrideAccess: true, req })
    return r.docs[0] ? json(teacherDetail(r.docs[0])) : notFound()
  }) },

  { path: '/public/articles', method: 'get', handler: guard(async (req) => {
    const page = Math.max(1, Number(q(req, 'page')) || 1)
    const cat = q(req, 'category'); const tag = q(req, 'tag')
    const extra: Where[] = []
    if (cat) extra.push({ 'category.slug': { equals: cat } })
    if (tag) extra.push({ 'tags.slug': { equals: tag } })
    const r = await req.payload.find({ collection: 'articles', where: published(extra), sort: '-publishedAt', depth: 1, page, limit: 12, overrideAccess: true, req })
    const cats = await req.payload.find({ collection: 'categories', depth: 0, limit: 50, sort: 'name', overrideAccess: true, req })
    return json({ items: r.docs.map(articleCard), page: r.page, totalPages: r.totalPages, total: r.totalDocs, categories: cats.docs.map((c) => ({ name: c.name, slug: c.slug })) })
  }) },
  { path: '/public/articles/:slug', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'articles', where: published([{ slug: { equals: getParam(req, 'slug') } }]), depth: 2, limit: 1, overrideAccess: true, req })
    return r.docs[0] ? json(await articleDetail(req, r.docs[0])) : notFound()
  }) },

  { path: '/public/languages', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'languages', where: published([], false), sort: '_order', depth: 1, limit: 20, overrideAccess: true, req })
    return json({ items: r.docs.map((l) => ({ slug: l.slug, name: l.name, shortName: l.shortName, flag: l.flag, intro: l.intro, image: image(l.image as unknown as Doc) })) })
  }) },
  { path: '/public/languages/:slug', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'languages', where: published([{ slug: { equals: getParam(req, 'slug') } }], false), depth: 1, limit: 1, overrideAccess: true, req })
    return r.docs[0] ? json(await languageDetail(req, r.docs[0])) : notFound()
  }) },

  { path: '/public/events', method: 'get', handler: guard(async (req) => {
    const [up, past] = await Promise.all([
      req.payload.find({ collection: 'events', where: published([{ endsAt: { greater_than: nowIso() } }]), sort: 'startsAt', depth: 1, limit: 50, overrideAccess: true, req }),
      req.payload.find({ collection: 'events', where: published([{ endsAt: { less_than_equal: nowIso() } }]), sort: '-startsAt', depth: 1, limit: 12, overrideAccess: true, req }),
    ])
    return json({ upcoming: up.docs.map(eventCard), past: past.docs.map(eventCard) })
  }) },
  { path: '/public/events/:slug', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'events', where: published([{ slug: { equals: getParam(req, 'slug') } }]), depth: 2, limit: 1, overrideAccess: true, req })
    return r.docs[0] ? json(eventDetail(r.docs[0])) : notFound()
  }) },

  // offline courses: indistinguishable from unknown routes while the feature is off
  { path: '/public/courses', method: 'get', handler: guard(async (req) => {
    if (!(await flags(req)).offlineCourses) return notFound()
    const r = await req.payload.find({ collection: 'courses', where: published(liveCourse()), sort: '_order', depth: 1, limit: 100, overrideAccess: true, req })
    return json({ items: r.docs.map(courseCard) })
  }) },
  { path: '/public/courses/:slug', method: 'get', handler: guard(async (req) => {
    if (!(await flags(req)).offlineCourses) return notFound()
    const r = await req.payload.find({ collection: 'courses', where: published([...liveCourse(), { slug: { equals: getParam(req, 'slug') } }]), depth: 2, limit: 1, overrideAccess: true, req })
    return r.docs[0] ? json(courseDetail(r.docs[0])) : notFound()
  }) },

  { path: '/public/pages/:slug', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'pages', where: published([{ slug: { equals: getParam(req, 'slug') } }]), depth: 1, limit: 1, overrideAccess: true, req })
    return r.docs[0] ? json(pageDetail(r.docs[0])) : notFound()
  }) },

  { path: '/public/redirects', method: 'get', handler: guard(async (req) => {
    const r = await req.payload.find({ collection: 'redirects', depth: 0, limit: 1000, overrideAccess: true, req })
    return json({ items: r.docs.map((d) => ({ from: d.from, to: d.to, status: Number(d.type) || 301 })) })
  }) },

  { path: '/public/sitemap', method: 'get', handler: guard(async (req) => {
    const f = await flags(req)
    const pick = async (collection: 'articles' | 'teachers' | 'events' | 'languages' | 'pages' | 'courses', prefix: string, extra: Where[] = []) =>
      (await req.payload.find({ collection, where: published([...extra, { 'seo.noindex': { not_equals: true } }], !UNDATED.has(collection)), depth: 0, limit: 1000, pagination: false, overrideAccess: true, req, select: { slug: true, updatedAt: true } as never }))
        .docs.map((d) => ({ path: `${prefix}${(d as Doc).slug}`, updatedAt: (d as Doc).updatedAt }))
    const entries = [
      ...(await pick('articles', '/magazine/')), ...(await pick('teachers', '/teachers/', activeTeacher)),
      ...(await pick('events', '/events/')), ...(await pick('languages', '/languages/')), ...(await pick('pages', '/')),
      ...(f.offlineCourses ? [{ path: '/courses', updatedAt: nowIso() }, ...(await pick('courses', '/courses/', liveCourse()))] : []),
    ]
    return json({ entries })
  }) },

  // preview: the site forwards the signed token from the dashboard "preview" link; returns the latest draft
  { path: '/public/preview', method: 'get', handler: guard(async (req) => {
    const t = verifyPreview(q(req, 'token') ?? '')
    if (!t) return json({ error: 'invalid_preview' }, 403)
    // homepage preview with the offline-course carousel shown as if the feature were on (dashboard button)
    if (t.collection === 'home' && t.id === 'courses') return Response.json({ collection: 'home', preview: true, data: await buildHome(req, { offlineCourses: true }) }, { headers: { 'Cache-Control': 'no-store' } })
    const allowed = ['articles', 'teachers', 'events', 'languages', 'pages', 'courses'] as const
    if (!allowed.includes(t.collection as never)) return json({ error: 'invalid_preview' }, 403)
    const doc = await req.payload.findByID({ collection: t.collection as (typeof allowed)[number], id: t.id, draft: true, depth: 2, overrideAccess: true, req }).catch(() => null)
    if (!doc) return notFound()
    const d = doc as Doc
    const body = t.collection === 'articles' ? await articleDetail(req, d) : t.collection === 'teachers' ? teacherDetail(d)
      : t.collection === 'events' ? eventDetail(d) : t.collection === 'languages' ? await languageDetail(req, d)
        : t.collection === 'pages' ? pageDetail(d) : courseDetail(d)
    return Response.json({ collection: t.collection, preview: true, data: body }, { headers: { 'Cache-Control': 'no-store' } })
  }) },
]
export { headingId }
