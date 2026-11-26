// Jalali (Solar Hijri) date helpers on top of Intl's built-in Persian calendar. Weeks start on Saturday.
import { fa } from './fa'

const parts = (d: Date) => {
  const p = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d)
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

export const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
/** Saturday-first weekday names; index with weekdayIndex(). */
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
export const WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

/** 0 = Saturday … 6 = Friday */
export const weekdayIndex = (d: Date) => (d.getDay() + 1) % 7

export const jDate = (d: Date) => parts(d)
/** «۵ آذر ۱۴۰۵» */
export const formatDate = (d: Date, withYear = true) => {
  const { y, m, d: day } = parts(d)
  return fa(`${day} ${MONTHS[m - 1]}${withYear ? ' ' + y : ''}`)
}
/** «پنجشنبه ۵ آذر» */
export const formatDay = (d: Date) => `${WEEKDAYS[weekdayIndex(d)]} ${formatDate(d, false)}`
/** «۱۸:۰۰» */
export const formatTime = (d: Date) => fa(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
/** «۱۴۰۵/۰۹/۰۵» */
export const formatNumeric = (d: Date) => {
  const { y, m, d: day } = parts(d)
  return fa(`${y}/${String(m).padStart(2, '0')}/${String(day).padStart(2, '0')}`)
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes())
/** Saturday 00:00 of the week containing d */
export const startOfWeek = (d: Date) => addDays(startOfDay(d), -weekdayIndex(d))
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

/** «امروز»، «فردا»، «۳ روز دیگر»، «دیروز»، «۲ روز پیش» */
export const relativeDay = (d: Date, now = new Date()) => {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86400000)
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'فردا'
  if (diff === -1) return 'دیروز'
  return diff > 0 ? `${fa(diff)} روز دیگر` : `${fa(-diff)} روز پیش`
}

/** «۲ ساعت و ۱۵ دقیقه» */
export const formatDuration = (ms: number) => {
  const mins = Math.max(0, Math.round(ms / 60000))
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60
  const out = [d && `${fa(d)} روز`, h && `${fa(h)} ساعت`, (m || (!d && !h)) && `${fa(m)} دقیقه`].filter(Boolean)
  return out.slice(0, 2).join(' و ')
}
