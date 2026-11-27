// Dates for public content pages: always Asia/Tehran and the Persian calendar, so the server render and the browser agree.
const TZ = 'Asia/Tehran'
const d = (iso: string) => new Date(iso)
export const faDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(d(iso)) : ''
export const faWeekdayDate = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d(iso))
export const faTime = (iso: string) => new Intl.DateTimeFormat('fa-IR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d(iso))
export const faNum = (n: number) => n.toLocaleString('fa-IR')
export const faToman = (n: number) => `${n.toLocaleString('fa-IR')} تومان`
export const EVENT_TYPES: Record<string, string> = { workshop: 'کارگاه', webinar: 'وبینار', special: 'جلسهٔ ویژه', educational: 'رویداد آموزشی', masterclass: 'مسترکلاس' }
export const REGISTRATION: Record<string, string> = { soon: 'ثبت‌نام به‌زودی', open: 'ثبت‌نام باز است', full: 'ظرفیت تکمیل شد', closed: 'ثبت‌نام بسته شد' }
