export type FlagCode = 'uk' | 'de' | 'fr' | 'it' | 'sa' | 'tr'

export type Prof = {
  lang: string; flag: FlagCode; teacher: string; role: string; img: string
  tags: string[]; students: number; rating: string; level: string; text: string
}

/** Professors shown in the home carousel and on /teachers. Names and numbers are placeholders. */
export const PROFS: Prof[] = [
  { lang: 'زبان انگلیسی', flag: 'uk', teacher: 'استاد آرمان کیانی', role: 'مدرس آیلتس و مکالمه', img: '/img/prof-en.webp',
    tags: ['عمومی', 'آیلتس', 'مکالمه'], students: 370, rating: '4.9', level: 'متوسط',
    text: 'تقویت مهارت‌های چهارگانهٔ زبان انگلیسی برای تحصیل، کار و زندگی روزمره.' },
  { lang: 'زبان آلمانی', flag: 'de', teacher: 'استاد مهسا فرهادی', role: 'مدرس آزمون‌های گوته', img: '/img/prof-de.webp',
    tags: ['عمومی', 'آزمون گوته', 'مکالمه'], students: 520, rating: '4.8', level: 'متوسط',
    text: 'یادگیری آلمانی با تمرکز بر مکالمه و آمادگی آزمون‌های بین‌المللی.' },
  { lang: 'زبان فرانسوی', flag: 'fr', teacher: 'استاد سینا رضایی', role: 'مدرس دلف و مکالمه', img: '/img/prof-fr.webp',
    tags: ['عمومی', 'DELF', 'مکالمه'], students: 950, rating: '4.9', level: 'متوسط',
    text: 'یادگیری فرانسوی به‌صورت کاربردی برای تحصیل، مهاجرت و فرصت‌های شغلی.' },
  { lang: 'زبان عربی', flag: 'sa', teacher: 'استاد زهرا موسوی', role: 'مدرس عربی فصیح و محاوره', img: '/img/prof-ar.webp',
    tags: ['عمومی', 'محاوره', 'فصیح'], students: 410, rating: '4.8', level: 'مقدماتی',
    text: 'عربی فصیح و محاوره‌ای برای سفر، کار در کشورهای عربی و درک متون.' },
  { lang: 'زبان ترکی استانبولی', flag: 'tr', teacher: 'استاد کاوه احمدی', role: 'مدرس ترکی و آزمون TÖMER', img: '/img/prof-tr.webp',
    tags: ['عمومی', 'TÖMER', 'مکالمه'], students: 630, rating: '4.9', level: 'مقدماتی',
    text: 'ترکی استانبولی از پایه تا مکالمهٔ روان، برای تحصیل و زندگی در ترکیه.' },
]

export type Post = { title: string; text: string; min: number; img: string; tag: string }

export const POSTS: Post[] = [
  { title: 'چگونه مهارت مکالمهٔ انگلیسی را تقویت کنیم؟', text: '۵ راهکار کاربردی برای صحبت روان‌تر و با اعتماد به نفس بیشتر.', min: 8, img: '/img/blog-english.webp', tag: 'محتوای آموزشی' },
  { title: 'اشتباهات رایج در یادگیری آلمانی', text: 'از این اشتباهات پرهیز کنید!', min: 6, img: '/img/blog-writing.webp', tag: 'زبان آلمانی' },
  { title: 'عبارات پرکاربرد در زبان فرانسه', text: 'عباراتی که در سفر و مکالمه به کارتان می‌آیند.', min: 7, img: '/img/blog-paris.webp', tag: 'زبان فرانسه' },
  { title: 'عادت‌های روزانه برای یادگیری سریع‌تر', text: 'با ده دقیقه تمرین هر روز، نتیجهٔ چشمگیری بگیرید.', min: 5, img: '/img/blog-book.webp', tag: 'یادگیری' },
  { title: 'بهترین ابزارهای آنلاین برای تمرین شنیداری', text: 'گوش‌دادن فعال را با این ابزارها تمرین کنید.', min: 6, img: '/img/blog-laptop.webp', tag: 'ابزار' },
]
