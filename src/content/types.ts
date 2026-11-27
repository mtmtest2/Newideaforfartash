// Shapes returned by the CMS public API (cms/src/public-api/endpoints.ts). The site depends only on these DTOs,
// never on Payload's internal document structure.
export type Img = { src: string | null; width: number | null; height: number | null; alt: string; srcSet: string | null }
export type SeoDTO = { title: string; description: string; canonical: string | null; noindex: boolean; image: string | null; ogTitle: string | null; ogDescription: string | null }
export type Link = { label: string; href: string }
export type SiteDTO = {
  nav: { header: Link[]; footer: Link[] }
  settings: {
    name: string
    contact: { address?: string; phone?: string; phoneDisplay?: string; email?: string; hours?: string }
    social: Partial<Record<'instagram' | 'telegram' | 'youtube', string>>
    seo: { titleSuffix: string; description: string | null; image: string | null }
  }
}
export type TeacherCardDTO = {
  slug: string; name: string; title: string; photo: Img | null; lang: string; flag: string | null
  tags: string[]; level: string; text: string; students: number | null; rating: number | null
}
export type TeacherDTO = TeacherCardDTO & {
  firstName: string; lastName: string; bio: string; languages: { name: string; slug: string; flag: string }[]; levels: string[]
  specializations: string[]; qualifications: string[]; certificates: { label: string; year: number | null }[]
  experienceYears: number | null; introVideo: string | null; seo: SeoDTO
}
export type ArticleCardDTO = {
  slug: string; title: string; excerpt: string; cover: Img | null; readingTime: number | null
  category: { name: string; slug: string } | null; publishedAt: string | null; updatedAt: string
}
export type ArticleDTO = ArticleCardDTO & {
  html: string; toc: { id: string; text: string; level: number }[]
  author: { name: string; role: string | null; avatar: Img | null } | null
  tags: { name: string; slug: string }[]; language: { name: string; slug: string } | null
  related: ArticleCardDTO[]; seo: SeoDTO
}
export type ArticleListDTO = { items: ArticleCardDTO[]; page: number; totalPages: number; total: number; categories: { name: string; slug: string }[] }
export type EventCardDTO = {
  slug: string; type: string; title: string; subtitle: string | null; excerpt: string; poster: Img | null
  startsAt: string; endsAt: string; timezone: string; format: 'online' | 'offline'; registration: 'soon' | 'open' | 'full' | 'closed'
  price: number; featured: boolean; past: boolean
}
export type EventDTO = EventCardDTO & {
  description: string; venue: string | null; registrationUrl: string | null; capacity: number | null
  requirements: string | null; audience: string | null; speaker: { name: string; slug: string | null } | null
  language: { name: string; slug: string } | null; seo: SeoDTO
}
export type CourseCardDTO = {
  slug: string; title: string; subtitle: string | null; excerpt: string; cover: Img | null
  language: { name: string; slug: string; flag: string } | null; levels: string[]; instructor: { name: string; slug: string } | null
  totalLessons: number; totalMinutes: number; featured: boolean; price: number | null
}
export type CourseDTO = CourseCardDTO & {
  description: string; audience: string | null; prerequisites: string | null; objectives: string[]; promoVideo: string | null
  estimatedWeeks: number | null; difficulty: string | null; enrollment: string; purchasable: false; accessDays: number
  modules: { title: string; description: string | null; chapters: { title: string; lessons: { id: string; title: string; minutes: number | null; preview: boolean }[] }[] }[]
  seo: SeoDTO
}
export type LanguageDTO = {
  slug: string; name: string; shortName: string; flag: string; intro: string; image: Img | null; description: string
  levels: { code: string; title: string; description: string | null }[]; exams: { name: string; description: string | null }[]
  resources: { title: string; url: string | null }[]; teachers: TeacherCardDTO[]; articles: ArticleCardDTO[]; seo: SeoDTO
}
export type PageBlock =
  | { type: 'intro'; heading: string; text: string | null; image: Img | null }
  | { type: 'richText'; html: string }
  | { type: 'faq'; title: string | null; items: { q: string; a: string }[] }
  | { type: 'cta'; heading: string; text: string | null; buttonLabel: string; href: string }
  | { type: 'contact'; title: string | null }
  | { type: 'announcement'; tone: 'info' | 'important'; text: string }
export type PageDTO = { slug: string; title: string; kind: string; blocks: PageBlock[]; seo: SeoDTO }
export type HomeDTO = SiteDTO & {
  teachers: { tag?: string; title?: string; description?: string; items: TeacherCardDTO[] }
  articles: ArticleCardDTO[]
  courses?: { tag?: string; title?: string; description?: string; visibleCards: number; position: 'afterClasses' | 'afterIntro' | 'beforeArticles'; items: CourseCardDTO[] }
  events?: { title?: string; items: EventCardDTO[] }
}
/** What the server embeds in the page / returns from /__data: the site chrome plus the data of one route. */
export type RoutePayload = { site: SiteDTO; data: unknown; preview?: boolean }
