// Map CMS DTOs to the props the existing (approved) cards already render, so their markup and CSS stay unchanged.
import type { FlagCode } from '../data'
import type { ArticleCardDTO, CourseCardDTO, TeacherCardDTO } from './types'
import { fa } from '../lib/fa'

export type CardProf = {
  key: string; slug?: string; lang: string; flag: FlagCode; teacher: string; role: string; img: string; imgW: number; imgH: number; srcSet?: string | null
  tags: string[]; students: number | null; rating: number | string | null; level: string; text: string
}
export type CardPost = { key: string; slug?: string; title: string; text: string; min: number | null; img: string; imgW: number; imgH: number; srcSet?: string | null; tag: string }

const FLAGS = new Set(['uk', 'de', 'fr', 'it', 'sa', 'tr'])
export const toProf = (t: TeacherCardDTO): CardProf => ({
  key: t.slug || t.name, slug: t.slug || undefined, lang: t.lang, flag: (FLAGS.has(String(t.flag)) ? t.flag : 'uk') as FlagCode,
  teacher: t.name, role: t.title, img: t.photo?.src ?? '', imgW: t.photo?.width ?? 500, imgH: t.photo?.height ?? 350, srcSet: t.photo?.srcSet,
  tags: t.tags, students: t.students, rating: t.rating, level: t.level, text: t.text,
})
export const toPost = (a: ArticleCardDTO): CardPost => ({
  key: a.slug || a.title, slug: a.slug || undefined, title: a.title, text: a.excerpt, min: a.readingTime,
  img: a.cover?.src ?? '', imgW: a.cover?.width ?? 800, imgH: a.cover?.height ?? 300, srcSet: a.cover?.srcSet, tag: a.category?.name ?? 'مجله',
})
/** Offline courses reuse the teacher card ("prof-card") so the carousel keeps the approved design language. */
export const courseAsProf = (c: CourseCardDTO): CardProf => ({
  key: c.slug, slug: c.slug, lang: c.language?.name ?? '', flag: (FLAGS.has(String(c.language?.flag)) ? c.language!.flag : 'uk') as FlagCode,
  teacher: c.title, role: c.instructor?.name ?? '', img: c.cover?.src ?? '', imgW: c.cover?.width ?? 800, imgH: c.cover?.height ?? 450, srcSet: c.cover?.srcSet,
  tags: c.levels.slice(0, 3), students: null, rating: null, level: `${fa(c.totalLessons)} درس`, text: c.excerpt,
})
