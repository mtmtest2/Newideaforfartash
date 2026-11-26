// Demo "school database" shared by the student panel (/panel) and the teacher panel (/teacher).
// It lives in localStorage, so both panels see each other's changes, also live across tabs (storage event).
// When a backend exists, replace load/commit with API calls that return the same shapes.
import { useSyncExternalStore } from 'react'
import { addDays, startOfDay } from '../lib/jalali'
import { COURSES, sessionsBetween, TEACHERS } from '../panel/data'

export type Role = 'student' | 'teacher' | 'reception'
export type Mark = 'present' | 'late' | 'absent'
export type Student = { id: string; name: string }
export type Task = { id: string; courseId: string; title: string; kind: 'تکلیف' | 'آزمونک'; desc: string; due: string; max: number; createdAt: string }
export type Submission = { id: string; taskId: string; studentId: string; answer: string; file?: string; at: string; score?: number; feedback?: string; gradedAt?: string }
/** One group chat per class. Only reception creates groups; a locked group is read-only for students and the teacher. */
export type Group = { id: string; courseId: string; createdAt: string; locked: boolean }
export type Message = { id: string; groupId: string; role: Role; authorId: string; text: string; at: string; deleted?: boolean }
/** Who is reading: `${role}:${id}` (student:me, teacher:arman, reception:desk). */
export type Reader = string
export type Announcement = { id: string; courseId: string; title: string; text: string; at: string }
export type Db = {
  v: 2; seededAt: string
  students: Student[]
  rosters: Record<string, string[]>
  tasks: Task[]
  submissions: Submission[]
  groups: Group[]
  messages: Message[]
  /** reader -> groupId -> ISO time they last opened the group */
  reads: Record<Reader, Record<string, string>>
  announcements: Announcement[]
  /** `${courseId}|${session start ISO}` -> studentId -> mark */
  attendance: Record<string, Record<string, Mark>>
}

/** The signed-in student is always "me" in the demo; their name comes from the student session. */
export const ME = 'me'
export const DESK = 'desk' // the reception account
export const reader = (role: Role, id: string): Reader => `${role}:${id}`
const KEY = 'fartash-db'
const MAX_AGE_DAYS = 5 // reseed old demo data so due dates stay around "now"

const NAMES = ['نیما احمدی', 'پریا صالحی', 'علی رستمی', 'زهرا موسوی', 'امیرحسین کریمی', 'سینا جعفری', 'هستی نوری', 'کیان مرادی',
  'ترانه یزدانی', 'محمد شریفی', 'الهام قاسمی', 'رضا بهرامی', 'یاسمن حیدری', 'آرین طاهری']

export const sessionKey = (courseId: string, start: Date) => `${courseId}|${start.toISOString()}`

function seed(now = new Date()): Db {
  const iso = (d: Date) => d.toISOString()
  const at = (days: number, h = 23, m = 59) => { const d = addDays(startOfDay(now), days); d.setHours(h, m, 0, 0); return iso(d) }
  const students: Student[] = [{ id: ME, name: '' }, ...NAMES.map((name, i) => ({ id: 's' + (i + 1), name }))]
  const rosters: Record<string, string[]> = {
    'en-b1': [ME, 's1', 's2', 's3', 's4', 's5', 's6', 's7'],
    'de-a2': [ME, 's8', 's9', 's10', 's11', 's12'],
    'en-grammar': [ME, 's1', 's3', 's6', 's8', 's9', 's10', 's11', 's12', 's13', 's14'],
  }
  const tasks: Task[] = [
    { id: 'a1', courseId: 'en-b1', kind: 'تکلیف', title: 'نوشتن یک متن ۱۵۰ کلمه‌ای دربارهٔ سفر مورد علاقه', desc: 'از زمان گذشتهٔ ساده و دست‌کم پنج واژهٔ تازهٔ واحد ۵ استفاده کنید.', due: at(1), max: 20, createdAt: at(-4, 19, 40) },
    { id: 'a2', courseId: 'de-a2', kind: 'آزمونک', title: 'آزمونک فصل ۳: زمان گذشته (Perfekt)', desc: 'ده پرسش چهارگزینه‌ای؛ زمان پاسخ‌گویی ۱۵ دقیقه.', due: at(3, 20, 0), max: 20, createdAt: at(-2, 11, 30) },
    { id: 'a3', courseId: 'en-grammar', kind: 'تکلیف', title: 'تمرین‌های Present Perfect و Past Simple', desc: 'تمرین‌های ۱ تا ۱۲ کتاب کار، صفحهٔ ۴۲.', due: at(5), max: 20, createdAt: at(-1, 9, 0) },
    { id: 'a4', courseId: 'en-b1', kind: 'تکلیف', title: 'ضبط صدای یک دقیقه‌ای: معرفی شغل رؤیایی', desc: 'فایل صوتی یک دقیقه‌ای بفرستید؛ روی تلفظ ed- در فعل‌های گذشته دقت کنید.', due: at(-2), max: 20, createdAt: at(-9, 19, 40) },
    { id: 'a5', courseId: 'de-a2', kind: 'تکلیف', title: 'نوشتن ایمیل کوتاه به یک دوست', desc: 'یک ایمیل ۸۰ کلمه‌ای دربارهٔ آخر هفته‌تان.', due: at(-6), max: 20, createdAt: at(-13, 11, 30) },
    { id: 'a6', courseId: 'en-b1', kind: 'آزمونک', title: 'آزمونک واژگان واحد ۴', desc: 'بیست واژهٔ واحد ۴.', due: at(-9), max: 20, createdAt: at(-14, 19, 40) },
    { id: 'a7', courseId: 'en-grammar', kind: 'آزمونک', title: 'آزمونک پایان فصل ۲', desc: 'پانزده پرسش از درس‌های فصل ۲.', due: at(-13), max: 20, createdAt: at(-20, 9, 0) },
  ]
  const subs: Submission[] = []
  const add = (taskId: string, studentId: string, daysAgo: number, answer: string, score?: number, feedback?: string, file?: string) =>
    subs.push({ id: `${taskId}-${studentId}`, taskId, studentId, answer, file, at: at(-daysAgo, 17 + (subs.length % 5), (subs.length * 7) % 60),
      ...(score != null ? { score, feedback, gradedAt: at(-daysAgo + 1, 10) } : {}) })
  // the signed-in student
  add('a4', ME, 2, 'فایل صوتی را پیوست کردم.', undefined, undefined, 'dream-job.m4a')
  add('a5', ME, 7, 'Liebe Sara, am Wochenende habe ich meine Großeltern besucht …', 18, 'ساختار جمله‌ها خوب بود. به ترتیب فعل در جمله‌های پیرو بیشتر دقت کنید.')
  add('a6', ME, 10, 'پاسخ‌ها در سامانهٔ آزمون ثبت شد.', 17, 'خیلی خوب بود. چند واژهٔ مربوط به محیط کار را دوباره مرور کنید.')
  add('a7', ME, 14, 'پاسخ‌ها در سامانهٔ آزمون ثبت شد.', 19, 'تسلط خیلی خوبی روی زمان‌ها دارید.')
  // classmates
  add('a1', 's2', 0, 'Last summer I travelled to Shiraz with my family. We visited …')
  add('a1', 's5', 1, 'My favourite trip was to Gilan. The weather was rainy but …')
  ;['s1', 's2', 's3', 's5', 's6'].forEach((s, i) => add('a4', s, 2 + (i % 2), 'فایل صوتی پیوست شد.', i < 2 ? 16 + i : undefined, i < 2 ? 'تلفظ خوب بود؛ کمی آرام‌تر صحبت کنید.' : undefined, `voice-${s}.m4a`))
  ;['s1', 's2', 's3', 's4', 's5', 's6', 's7'].forEach((s, i) => add('a6', s, 10, 'پاسخ‌ها در سامانهٔ آزمون ثبت شد.', [15, 18, 14, 19, 16, 17, 13][i], 'نمره ثبت شد.'))
  ;['s1', 's3', 's6', 's8', 's9', 's10', 's11', 's12', 's13'].forEach((s, i) => add('a7', s, 14, 'پاسخ‌ها در سامانهٔ آزمون ثبت شد.', [17, 16, 19, 15, 18, 14, 17, 20, 16][i], 'نمره ثبت شد.'))
  ;['s1', 's8'].forEach((s) => add('a3', s, 0, 'تمرین‌ها را حل کردم و عکس صفحه‌ها را فرستادم.', undefined, undefined, `workbook-${s}.jpg`))
  ;['s8', 's9', 's10', 's11', 's12'].forEach((s, i) => add('a5', s, 7, 'ایمیل در متن پاسخ نوشته شد.', [17, 15, 19, 16, 18][i], 'نمره ثبت شد.'))

  // class groups: reception made the two live classes' groups; the offline course has none yet
  const groups: Group[] = [
    { id: 'g-en-b1', courseId: 'en-b1', createdAt: at(-20, 10, 0), locked: false },
    { id: 'g-de-a2', courseId: 'de-a2', createdAt: at(-18, 10, 0), locked: false },
  ]
  let n = 0
  const m = (groupId: string, role: Role, authorId: string, text: string, daysAgo: number, h: number, mi: number): Message =>
    ({ id: `m${++n}`, groupId, role, authorId, text, at: at(-daysAgo, h, mi) })
  const welcome = (title: string) => `به گروه کلاس ${title} خوش آمدید. پرسش‌های درسی را همین‌جا بپرسید تا استاد و هم‌کلاسی‌ها هم ببینند. لطفاً پیام غیردرسی نفرستید.`
  const messages: Message[] = [
    m('g-en-b1', 'reception', DESK, welcome('مکالمهٔ انگلیسی B1'), 20, 10, 0),
    m('g-en-b1', 'teacher', 'arman', 'فایل واژه‌های واحد ۵ در بخش جلسات ضبط‌شده است؛ پیش از کلاس یک بار مرورش کنید.', 2, 21, 30),
    m('g-en-b1', 'student', ME, 'سلام استاد، برای متن سفر می‌توانم دربارهٔ سفری بنویسم که هنوز نرفته‌ام؟', 1, 20, 12),
    m('g-en-b1', 'teacher', 'arman', 'بله، ولی آن‌وقت باید از زمان آینده استفاده کنید؛ برای تمرین زمان گذشته بهتر است یک سفر واقعی را انتخاب کنید.', 1, 21, 5),
    m('g-en-b1', 'student', 's3', 'سلام، من شنبه کمی دیرتر به کلاس می‌رسم.', 0, 9, 14),
    m('g-en-b1', 'student', 's5', 'مهلت متن سفر فردا شب است یا پیش از کلاس؟', 0, 10, 20),
    m('g-de-a2', 'reception', DESK, welcome('آلمانی عمومی A2'), 18, 10, 0),
    m('g-de-a2', 'teacher', 'mahsa', 'برای آزمونک فصل ۳، جدول فعل‌های بی‌قاعدهٔ صفحهٔ ۳۸ را مرور کنید.', 2, 12, 30),
    m('g-de-a2', 'student', 's9', 'ممنون استاد.', 2, 13, 2),
  ]
  const reads: Db['reads'] = {
    [reader('student', ME)]: { 'g-en-b1': at(-1, 21, 10), 'g-de-a2': at(-2, 12, 0) },
    [reader('teacher', 'arman')]: { 'g-en-b1': at(-1, 21, 6) },
    [reader('teacher', 'mahsa')]: { 'g-de-a2': at(-2, 13, 5) },
    [reader('reception', DESK)]: { 'g-en-b1': at(-2, 22, 0), 'g-de-a2': at(-2, 13, 5) },
  }
  const announcements: Announcement[] = [
    { id: 'n-en1', courseId: 'en-b1', title: 'منبع جلسهٔ بعد', text: 'فایل واژه‌های واحد ۵ در بخش جلسات ضبط‌شده است؛ پیش از کلاس یک بار مرورش کنید.', at: at(-1, 21, 30) },
    { id: 'n-de1', courseId: 'de-a2', title: 'جلسهٔ جبرانی', text: 'جلسهٔ جبرانی سه‌شنبهٔ آینده ساعت ۱۰ برگزار می‌شود.', at: at(-3, 12, 0) },
  ]

  // attendance for the live sessions of the last three weeks
  const attendance: Db['attendance'] = {}
  sessionsBetween(addDays(now, -21), now).filter((s) => s.end < now).forEach((s, si) => {
    const marks: Record<string, Mark> = {}
    rosters[s.course.id].forEach((st, i) => {
      const r = (si * 7 + i * 3) % 17
      marks[st] = st === ME ? (si === 2 ? 'absent' : si === 5 ? 'late' : 'present') : r === 0 ? 'absent' : r === 5 ? 'late' : 'present'
    })
    attendance[sessionKey(s.course.id, s.start)] = marks
  })

  return { v: 2, seededAt: iso(now), students, rosters, tasks, submissions: subs, groups, messages, reads, announcements, attendance }
}

/* ---------- store ---------- */
const listeners = new Set<() => void>()
let cache: { raw: string | null; db: Db | null } = { raw: null, db: null }

function load(): Db {
  let raw: string | null = null
  try { raw = localStorage.getItem(KEY) } catch { /* storage blocked */ }
  if (cache.db && raw === cache.raw) return cache.db
  let db: Db | null = null
  try { db = raw ? (JSON.parse(raw) as Db) : null } catch { db = null }
  const stale = !db || db.v !== 2 || Date.now() - new Date(db.seededAt).getTime() > MAX_AGE_DAYS * 86400000
  if (stale) {
    db = seed()
    raw = JSON.stringify(db)
    try { localStorage.setItem(KEY, raw) } catch { /* ignore */ }
  }
  cache = { raw, db }
  return db!
}
const emit = () => listeners.forEach((l) => l())

/** Apply a change and save it; every panel (and every open tab) re-renders. */
export function commit(change: (db: Db) => void) {
  const next = structuredClone(load())
  change(next)
  const raw = JSON.stringify(next)
  try { localStorage.setItem(KEY, raw) } catch { /* ignore */ }
  cache = { raw, db: next }
  emit()
}
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage) }
}
// Prerendered HTML (and hydration) sees an empty school: badges and counts appear right after mount,
// so the server markup always matches the first client render.
const EMPTY: Db = { v: 2, seededAt: '', students: [], rosters: {}, tasks: [], submissions: [], groups: [], messages: [], reads: {}, announcements: [], attendance: {} }
export const useDb = () => useSyncExternalStore(subscribe, load, () => EMPTY)

/* ---------- actions ---------- */
const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export const submitTask = (taskId: string, studentId: string, answer: string, file?: string) => commit((db) => {
  db.submissions = db.submissions.filter((s) => !(s.taskId === taskId && s.studentId === studentId))
  db.submissions.push({ id: uid('sub'), taskId, studentId, answer, file, at: new Date().toISOString() })
})
export const gradeSubmission = (id: string, score: number, feedback: string) => commit((db) => {
  const s = db.submissions.find((x) => x.id === id)
  if (s) Object.assign(s, { score, feedback, gradedAt: new Date().toISOString() })
})
export const addTask = (t: Omit<Task, 'id' | 'createdAt'>) => commit((db) => { db.tasks.unshift({ ...t, id: uid('t'), createdAt: new Date().toISOString() }) })
export const createGroup = (courseId: string) => commit((db) => {
  if (db.groups.some((g) => g.courseId === courseId)) return
  const id = 'g-' + courseId
  const now = new Date().toISOString()
  db.groups.push({ id, courseId, createdAt: now, locked: false })
  db.messages.push({ id: uid('m'), groupId: id, role: 'reception', authorId: DESK, at: now,
    text: 'گروه این کلاس ساخته شد. پرسش‌های درسی را همین‌جا بپرسید تا استاد و هم‌کلاسی‌ها هم ببینند.' })
})
export const sendMessage = (groupId: string, role: Role, authorId: string, text: string) => commit((db) => {
  const g = db.groups.find((x) => x.id === groupId)
  if (!g || (g.locked && role !== 'reception')) return
  const at = new Date().toISOString()
  db.messages.push({ id: uid('m'), groupId, role, authorId, text, at })
  ;(db.reads[reader(role, authorId)] ??= {})[groupId] = at
})
/** Reception moderation: the message stays in place as "removed by reception". */
export const removeMessage = (id: string) => commit((db) => { const m = db.messages.find((x) => x.id === id); if (m) m.deleted = true })
export const setGroupLocked = (groupId: string, locked: boolean) => commit((db) => {
  const g = db.groups.find((x) => x.id === groupId)
  if (!g || g.locked === locked) return
  g.locked = locked
  db.messages.push({ id: uid('m'), groupId, role: 'reception', authorId: DESK, at: new Date().toISOString(),
    text: locked ? 'گروه موقتاً بسته شد؛ فقط پذیرش می‌تواند پیام بفرستد.' : 'گروه دوباره باز شد.' })
})
export const markGroupRead = (groupId: string, who: Reader) => {
  const db = load()
  const last = db.messages.filter((m) => m.groupId === groupId).at(-1)
  if (!last || (db.reads[who]?.[groupId] ?? '') >= last.at) return
  commit((d) => { (d.reads[who] ??= {})[groupId] = new Date().toISOString() })
}
export const postAnnouncement = (courseId: string, title: string, text: string) => commit((db) => {
  db.announcements.unshift({ id: uid('n'), courseId, title, text, at: new Date().toISOString() })
})
export const saveAttendance = (key: string, marks: Record<string, Mark>) => commit((db) => { db.attendance[key] = marks })

/* ---------- selectors ---------- */
export const studentName = (db: Db, id: string, meName?: string) =>
  id === ME ? meName || 'سارا رضایی' : db.students.find((s) => s.id === id)?.name ?? '—'
export const coursesOfTeacher = (teacherId: string) => COURSES.filter((c) => c.teacherId === teacherId)
export const attendanceOf = (db: Db, courseId: string, studentId: string) => {
  const rows = Object.entries(db.attendance).filter(([k]) => k.startsWith(courseId + '|')).map(([, v]) => v[studentId]).filter(Boolean)
  return { total: rows.length, present: rows.filter((r) => r !== 'absent').length, late: rows.filter((r) => r === 'late').length }
}
export const avgScore = (subs: Submission[], tasks: Task[]) => {
  const g = subs.filter((s) => s.score != null)
  if (!g.length) return null
  return g.reduce((sum, s) => sum + (s.score! / (tasks.find((t) => t.id === s.taskId)?.max ?? 20)) * 20, 0) / g.length
}

/** Messages in a group that `who` has not seen yet (their own and removed ones excluded). */
export const unreadIn = (db: Db, groupId: string, who: Reader) => {
  const seen = db.reads[who]?.[groupId] ?? ''
  return db.messages.filter((m) => m.groupId === groupId && !m.deleted && m.at > seen && reader(m.role, m.authorId) !== who)
}
export const groupOf = (db: Db, courseId: string) => db.groups.find((g) => g.courseId === courseId)
export const authorName = (db: Db, m: Message, meName?: string) =>
  m.role === 'student' ? studentName(db, m.authorId, meName) : m.role === 'teacher' ? `استاد ${TEACHERS.find((t) => t.id === m.authorId)?.name ?? ''}` : 'پذیرش فرتاش'
export const sameDayIso = (iso: string, d: Date) => { const x = new Date(iso); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate() }
export const restoreMessage = (id: string) => commit((db) => { const m = db.messages.find((x) => x.id === id); if (m) delete m.deleted })
