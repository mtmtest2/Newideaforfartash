import blog_book from './assets/img/blog-book.webp'
import blog_english from './assets/img/blog-english.webp'
import blog_laptop from './assets/img/blog-laptop.webp'
import blog_paris from './assets/img/blog-paris.webp'
import blog_writing from './assets/img/blog-writing.webp'
import prof_ar from './assets/img/prof-ar.webp'
import prof_de from './assets/img/prof-de.webp'
import prof_en from './assets/img/prof-en.webp'
import prof_fr from './assets/img/prof-fr.webp'
import prof_tr from './assets/img/prof-tr.webp'

export type FlagCode = 'uk' | 'de' | 'fr' | 'it' | 'sa' | 'tr'

export type Prof = {
  lang: string; flag: FlagCode; teacher: string; role: string; img: string; imgW: number; imgH: number
  tags: string[]; students: number; rating: string; level: string; text: string
}

/** Professors shown in the home carousel and on /teachers. Names and numbers are placeholders. */
export const PROFS: Prof[] = [
  { lang: 'زبان انگلیسی', flag: 'uk', teacher: 'استاد آرمان کیانی', role: 'مدرس آیلتس و مکالمه', img: prof_en, imgW: 468, imgH: 350,
    tags: ['عمومی', 'آیلتس', 'مکالمه'], students: 370, rating: '4.9', level: 'متوسط',
    text: 'تقویت مهارت‌های چهارگانهٔ زبان انگلیسی برای تحصیل، کار و زندگی روزمره.' },
  { lang: 'زبان آلمانی', flag: 'de', teacher: 'استاد مهسا فرهادی', role: 'مدرس آزمون‌های گوته', img: prof_de, imgW: 504, imgH: 350,
    tags: ['عمومی', 'آزمون گوته', 'مکالمه'], students: 520, rating: '4.8', level: 'متوسط',
    text: 'یادگیری آلمانی با تمرکز بر مکالمه و آمادگی آزمون‌های بین‌المللی.' },
  { lang: 'زبان فرانسوی', flag: 'fr', teacher: 'استاد سینا رضایی', role: 'مدرس آزمون DELF و مکالمه', img: prof_fr, imgW: 540, imgH: 302,
    tags: ['عمومی', 'DELF', 'مکالمه'], students: 950, rating: '4.9', level: 'متوسط',
    text: 'یادگیری فرانسوی به‌صورت کاربردی برای تحصیل، مهاجرت و فرصت‌های شغلی.' },
  { lang: 'زبان عربی', flag: 'sa', teacher: 'استاد زهرا موسوی', role: 'مدرس عربی فصیح و محاوره', img: prof_ar, imgW: 504, imgH: 350,
    tags: ['عمومی', 'محاوره', 'فصیح'], students: 410, rating: '4.8', level: 'مقدماتی',
    text: 'عربی فصیح و محاوره‌ای برای سفر، کار در کشورهای عربی و درک متون.' },
  { lang: 'زبان ترکی استانبولی', flag: 'tr', teacher: 'استاد کاوه احمدی', role: 'مدرس ترکی و آزمون TÖMER', img: prof_tr, imgW: 504, imgH: 350,
    tags: ['عمومی', 'TÖMER', 'مکالمه'], students: 630, rating: '4.9', level: 'مقدماتی',
    text: 'ترکی استانبولی از پایه تا مکالمهٔ روان، برای تحصیل و زندگی در ترکیه.' },
]

export type Post = { title: string; text: string; min: number; img: string; imgW: number; imgH: number; tag: string }

export const POSTS: Post[] = [
  { title: 'چگونه مهارت مکالمهٔ انگلیسی را تقویت کنیم؟', text: '۵ راهکار کاربردی برای صحبت روان‌تر و با اعتمادبه‌نفس بیشتر.', min: 8, img: blog_english, imgW: 884, imgH: 200, tag: 'محتوای آموزشی' },
  { title: 'اشتباهات رایج در یادگیری آلمانی', text: 'رایج‌ترین اشتباه‌ها و راه پرهیز از آن‌ها.', min: 6, img: blog_writing, imgW: 628, imgH: 252, tag: 'زبان آلمانی' },
  { title: 'عبارات پرکاربرد زبان فرانسوی', text: 'عباراتی که در سفر و مکالمه به کارتان می‌آیند.', min: 7, img: blog_paris, imgW: 624, imgH: 248, tag: 'زبان فرانسوی' },
  { title: 'عادت‌های روزانه برای یادگیری سریع‌تر', text: 'با ده دقیقه تمرین هر روز، نتیجهٔ چشمگیری بگیرید.', min: 5, img: blog_book, imgW: 884, imgH: 276, tag: 'یادگیری' },
  { title: 'بهترین ابزارهای آنلاین برای تمرین شنیداری', text: 'با این ابزارها گوش‌دادن فعال را تمرین کنید.', min: 6, img: blog_laptop, imgW: 640, imgH: 240, tag: 'ابزار' },
]
