// What the site shows when the CMS is not configured or unreachable: exactly the content it shipped with
// (src/data.ts and the built-in links). Keeps `npm run dev`, the static build and outages working unchanged.
import { POSTS, PROFS } from '../data'
import type { ArticleCardDTO, HomeDTO, SiteDTO, TeacherCardDTO } from './types'

const slugOf = (s: string, i: number) => `item-${i + 1}`
export const FALLBACK_SITE: SiteDTO = {
  nav: {
    header: [{ href: '/#home', label: 'خانه' }, { href: '/#steps', label: 'مسیر یادگیری' }, { href: '/teachers', label: 'اساتید' }, { href: '/magazine', label: 'مقالات' }, { href: '/#contact', label: 'تماس با ما' }],
    footer: [
      { href: '/#home', label: 'خانه' }, { href: '/#steps', label: 'مسیر یادگیری' }, { href: '/#intro', label: 'معرفی دوره‌ها' }, { href: '/#classes', label: 'اساتید و کلاس‌ها' },
      { href: '/#blog', label: 'مقالات' }, { href: '/#testimonials', label: 'نظرات زبان‌آموزان' }, { href: '/#contact', label: 'سؤالات متداول و مشاوره' }, { href: '/placement', label: 'تعیین سطح رایگان' }],
  },
  settings: {
    name: 'آموزشگاه آنلاین زبان فرتاش',
    contact: { address: 'مشهد، نبش طبرسی جنوبی ۶۰', phone: '05132777100', phoneDisplay: '۰۵۱-۳۲۷۷۷۱۰۰', hours: 'شنبه تا پنجشنبه، ۹ تا ۲۱' },
    social: {},
    seo: { titleSuffix: ' | فرتاش', description: null, image: null },
  },
}
export const FALLBACK_TEACHERS: TeacherCardDTO[] = PROFS.map((p, i) => ({
  slug: '', name: p.teacher, title: p.role, photo: { src: p.img, width: p.imgW, height: p.imgH, alt: `${p.teacher}، ${p.role}`, srcSet: null },
  lang: p.lang, flag: p.flag, tags: p.tags, level: p.level, text: p.text, students: p.students, rating: Number(p.rating), _i: i,
} as TeacherCardDTO))
export const FALLBACK_ARTICLES: ArticleCardDTO[] = POSTS.map((p, i) => ({
  slug: '', title: p.title, excerpt: p.text, cover: { src: p.img, width: p.imgW, height: p.imgH, alt: '', srcSet: null },
  readingTime: p.min, category: { name: p.tag, slug: slugOf(p.tag, i) }, publishedAt: null, updatedAt: '',
}))
export const FALLBACK_HOME: HomeDTO = {
  ...FALLBACK_SITE,
  teachers: {
    tag: 'کلاس‌های آنلاین فرتاش', title: 'اساتید و کلاس‌های زبان',
    description: 'کلاس‌های زنده و تعاملی انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با همراهی اساتید مجرب.',
    items: FALLBACK_TEACHERS,
  },
  articles: FALLBACK_ARTICLES,
}
/** Data a route can still show without the CMS (only the routes that existed before the CMS). */
export function fallbackFor(resource: string | null): unknown {
  if (resource === '/home') return FALLBACK_HOME
  if (resource === '/teachers') return { items: FALLBACK_TEACHERS }
  if (resource?.startsWith('/articles') && !/^\/articles\/[^?]/.test(resource)) return { items: FALLBACK_ARTICLES, page: 1, totalPages: 1, total: FALLBACK_ARTICLES.length, categories: [] }
  return undefined
}
