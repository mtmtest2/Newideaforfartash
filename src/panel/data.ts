// Demo data for the student panel, generated relative to "now" so the panel always looks current.
// When a backend exists, replace buildDemo() with API calls returning the same shapes.
import { addDays, startOfDay, startOfWeek, weekdayIndex } from '../lib/jalali'
import prof_en from '../assets/img/prof-en.webp'
import prof_de from '../assets/img/prof-de.webp'
import blog_book from '../assets/img/blog-book.webp'
import blog_english from '../assets/img/blog-english.webp'
import blog_writing from '../assets/img/blog-writing.webp'
import blog_laptop from '../assets/img/blog-laptop.webp'

export type Slot = { weekday: number; start: [number, number]; minutes: number } // weekday 0 = Saturday
export type Course = {
  id: string; title: string; lang: string; level: string; type: 'live' | 'offline'
  teacher: string; img: string; imgW: number; imgH: number
  sessions: number; done: number; slots: Slot[]; color: 'lime' | 'navy' | 'sky'
}
export type Session = { course: Course; start: Date; end: Date; topic: string }
export type Assignment = {
  id: string; course: Course; title: string; kind: 'تکلیف' | 'آزمونک'; due: Date
  status: 'pending' | 'submitted' | 'graded'; score?: number; max?: number; feedback?: string
}
export type Recording = { id: string; course: Course; title: string; date: Date; minutes: number; watched: number; thumb: string }
export type Invoice = { id: string; title: string; amount: number; date: Date; status: 'paid' | 'due'; method?: string }
export type Ticket = { id: string; subject: string; dept: string; date: Date; status: 'open' | 'answered' | 'closed'; last: string }
export type Notice = { id: string; title: string; text: string; date: Date; kind: 'class' | 'assignment' | 'payment' | 'news'; unread: boolean }

export const COURSES: Course[] = [
  { id: 'en-b1', title: 'مکالمهٔ انگلیسی', lang: 'انگلیسی', level: 'B1', type: 'live', teacher: 'استاد آرمان کیانی', img: prof_en, imgW: 468, imgH: 350,
    sessions: 24, done: 14, color: 'lime',
    slots: [{ weekday: 0, start: [18, 0], minutes: 90 }, { weekday: 2, start: [18, 0], minutes: 90 }, { weekday: 4, start: [18, 0], minutes: 90 }] },
  { id: 'de-a2', title: 'آلمانی عمومی', lang: 'آلمانی', level: 'A2', type: 'live', teacher: 'استاد مهسا فرهادی', img: prof_de, imgW: 504, imgH: 350,
    sessions: 20, done: 6, color: 'navy',
    slots: [{ weekday: 1, start: [10, 0], minutes: 90 }, { weekday: 3, start: [10, 0], minutes: 90 }] },
  { id: 'en-grammar', title: 'گرامر کاربردی انگلیسی', lang: 'انگلیسی', level: 'B1', type: 'offline', teacher: 'استاد آرمان کیانی', img: blog_book, imgW: 884, imgH: 276,
    sessions: 18, done: 11, color: 'sky', slots: [] },
]

const TOPICS: Record<string, string[]> = {
  'en-b1': ['صحبت دربارهٔ تجربه‌های سفر', 'بیان نظر و مخالفت مؤدبانه', 'مکالمه در محیط کار', 'تعریف یک خاطره', 'برنامه‌ریزی و قرار گذاشتن', 'مصاحبهٔ شغلی'],
  'de-a2': ['خرید و قیمت‌ها', 'زمان گذشته (Perfekt)', 'خانه و محله', 'سلامتی و پزشک', 'سفر با قطار'],
}

/** Every class session (live courses) between from and to. */
export function sessionsBetween(from: Date, to: Date, courses = COURSES): Session[] {
  const out: Session[] = []
  for (let d = startOfDay(from); d < to; d = addDays(d, 1)) {
    for (const c of courses) for (const s of c.slots) {
      if (s.weekday !== weekdayIndex(d)) continue
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), s.start[0], s.start[1])
      const end = new Date(start.getTime() + s.minutes * 60000)
      if (end <= from || start >= to) continue
      const t = TOPICS[c.id] ?? ['جلسهٔ کلاس']
      const n = Math.floor(start.getTime() / 86400000)
      out.push({ course: c, start, end, topic: t[n % t.length] })
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}

export function buildDemo(now = new Date()) {
  const [en, de, gr] = COURSES
  const at = (days: number, h = 23, m = 59) => { const d = addDays(startOfDay(now), days); d.setHours(h, m); return d }
  const upcoming = sessionsBetween(new Date(now.getTime() - 90 * 60000), addDays(now, 14))
  const nextSession = upcoming.find((s) => s.end > now)!

  const assignments: Assignment[] = [
    { id: 'a1', course: en, kind: 'تکلیف', title: 'نوشتن یک متن ۱۵۰ کلمه‌ای دربارهٔ سفر مورد علاقه', due: at(1), status: 'pending' },
    { id: 'a2', course: de, kind: 'آزمونک', title: 'آزمونک فصل ۳: زمان گذشته (Perfekt)', due: at(3, 20, 0), status: 'pending' },
    { id: 'a3', course: gr, kind: 'تکلیف', title: 'تمرین‌های Present Perfect و Past Simple', due: at(5), status: 'pending' },
    { id: 'a4', course: en, kind: 'تکلیف', title: 'ضبط صدای یک دقیقه‌ای: معرفی شغل رؤیایی', due: at(-2), status: 'submitted' },
    { id: 'a5', course: de, kind: 'تکلیف', title: 'نوشتن ایمیل کوتاه به یک دوست', due: at(-6), status: 'graded', score: 18, max: 20, feedback: 'ساختار جمله‌ها خوب بود. به ترتیب فعل در جمله‌های پیرو بیشتر دقت کنید.' },
    { id: 'a6', course: en, kind: 'آزمونک', title: 'آزمونک واژگان واحد ۴', due: at(-9), status: 'graded', score: 17, max: 20, feedback: 'عالی بود! چند واژهٔ مربوط به محیط کار را دوباره مرور کنید.' },
    { id: 'a7', course: gr, kind: 'آزمونک', title: 'آزمونک پایان فصل ۲', due: at(-13), status: 'graded', score: 19, max: 20, feedback: 'تسلط خیلی خوبی روی زمان‌ها دارید.' },
  ]

  const thumbs = [blog_english, blog_writing, blog_laptop, blog_book]
  const past = sessionsBetween(addDays(now, -21), now).filter((s) => s.end < now).reverse()
  const recordings: Recording[] = [
    ...past.slice(0, 6).map((s, i) => ({ id: 'r' + i, course: s.course, title: s.topic, date: s.start, minutes: 88 - (i % 3) * 4, watched: [1, 1, 0.6, 0, 1, 0.3][i] ?? 0, thumb: s.course.id === 'de-a2' ? blog_writing : thumbs[i % 3] })),
    ...['Present Perfect در برابر Past Simple', 'جمله‌های شرطی نوع اول و دوم', 'افعال کمکی (Modal Verbs)', 'نقل قول غیرمستقیم'].map((t, i) => ({
      id: 'g' + i, course: gr, title: t, date: addDays(now, -30 - i * 7), minutes: [24, 31, 27, 35][i], watched: [1, 1, 0.45, 0][i], thumb: blog_book })),
  ]

  const invoices: Invoice[] = [
    { id: 'INV-14051', title: 'مکالمهٔ انگلیسی B1 (قسط اول)', amount: 4950000, date: addDays(now, -48), status: 'paid', method: 'درگاه بانکی' },
    { id: 'INV-14052', title: 'گرامر کاربردی انگلیسی', amount: 2490000, date: addDays(now, -41), status: 'paid', method: 'درگاه بانکی' },
    { id: 'INV-14053', title: 'آلمانی عمومی A2', amount: 7790000, date: addDays(now, -20), status: 'paid', method: 'کارت‌به‌کارت' },
    { id: 'INV-14054', title: 'مکالمهٔ انگلیسی B1 (قسط دوم)', amount: 4950000, date: addDays(now, 6), status: 'due' },
  ]

  const tickets: Ticket[] = [
    { id: 'T-1032', subject: 'جابه‌جایی کلاس چهارشنبه', dept: 'آموزش', date: addDays(now, -3), status: 'answered', last: 'سلام. امکان شرکت در کلاس جبرانی پنجشنبه برای شما فعال شد.' },
    { id: 'T-1018', subject: 'دریافت فاکتور رسمی', dept: 'مالی', date: addDays(now, -15), status: 'closed', last: 'فاکتور رسمی به ایمیل شما ارسال شد.' },
  ]

  const notices: Notice[] = [
    { id: 'n1', kind: 'class', title: 'یادآوری کلاس', text: `${nextSession.course.title} ${nextSession.course.level}`, date: addDays(now, 0), unread: true },
    { id: 'n2', kind: 'assignment', title: 'نمرهٔ آزمونک ثبت شد', text: 'نمرهٔ «نوشتن ایمیل کوتاه به یک دوست»: ۱۸ از ۲۰', date: addDays(now, -1), unread: true },
    { id: 'n3', kind: 'payment', title: 'قسط دوم نزدیک است', text: 'مهلت پرداخت قسط دوم مکالمهٔ انگلیسی ۶ روز دیگر است.', date: addDays(now, -1), unread: false },
    { id: 'n4', kind: 'news', title: 'کارگاه رایگان مکالمه', text: 'کارگاه آنلاین «اعتمادبه‌نفس در مکالمه» پنجشنبهٔ آینده برگزار می‌شود.', date: addDays(now, -4), unread: false },
  ]

  // minutes studied per day, Saturday..Friday of this week (future days = 0)
  const todayIdx = weekdayIndex(now)
  const activity = [65, 40, 90, 25, 70, 50, 15].map((m, i) => (i <= todayIdx ? m : 0))

  return {
    now, upcoming, nextSession, assignments, recordings, invoices, tickets, notices, activity,
    weekStart: startOfWeek(now),
    stats: {
      activeCourses: COURSES.length,
      sessionsDone: COURSES.reduce((s, c) => s + c.done, 0),
      sessionsTotal: COURSES.reduce((s, c) => s + c.sessions, 0),
      hoursThisMonth: 14,
      avgScore: (() => { const g = assignments.filter((a) => a.status === 'graded'); return g.reduce((s, a) => s + (a.score! / a.max!) * 20, 0) / g.length })(),
      streak: 5,
    },
    certificates: [
      { id: 'FR-1405-0731', title: 'زبان انگلیسی', level: 'A2', date: addDays(now, -96), hours: 48, score: 18.5 },
    ],
  }
}
export type Demo = ReturnType<typeof buildDemo>
