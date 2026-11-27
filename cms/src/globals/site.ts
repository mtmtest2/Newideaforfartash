import type { GlobalConfig } from 'payload'
import { allow, staffOnly } from '../access/permissions'
import { auditGlobal } from '../hooks/audit'
import { revalidateSite } from '../lib/revalidate'

const G = 'تنظیمات سایت'
const hooks = (tags: string[]) => ({ afterChange: [auditGlobal, () => { void revalidateSite(tags) }] })
const href = (v: unknown) => !v || /^(\/|#|https:\/\/)/.test(String(v)) || 'مسیر داخلی، #بخش یا آدرس https.'

/** Sections of the existing homepage that CMS data feeds. Layout/design stay in the Vite components. */
export const HomeLayout: GlobalConfig = {
  slug: 'home-layout', label: 'صفحهٔ اصلی', admin: { group: G },
  access: { read: staffOnly, update: allow('settings.write') },
  fields: [
    { name: 'teachers', label: 'کاروسل اساتید', type: 'group', admin: { description: 'کدام اساتید و به چه ترتیبی: از فهرست «اساتید» (تیک «نمایش در کاروسل» و کشیدن و رها کردن برای ترتیب).' }, fields: [
      { name: 'tag', label: 'برچسب بالای عنوان', type: 'text', defaultValue: 'کلاس‌های آنلاین فرتاش' },
      { name: 'title', label: 'عنوان بخش', type: 'text', defaultValue: 'اساتید و کلاس‌های زبان' },
      { name: 'description', label: 'توضیح بخش', type: 'textarea', defaultValue: 'کلاس‌های زنده و تعاملی انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با همراهی اساتید مجرب.' }] },
    { name: 'courses', label: 'کاروسل دوره‌های آفلاین', type: 'group', admin: { description: 'فقط وقتی «نمایش دوره‌های آفلاین» روشن باشد دیده می‌شود.' }, fields: [
      { name: 'tag', label: 'برچسب بالای عنوان', type: 'text', defaultValue: 'دوره‌های ضبط‌شدهٔ فرتاش' },
      { name: 'title', label: 'عنوان بخش', type: 'text', defaultValue: 'دوره‌های آفلاین فرتاش' },
      { name: 'description', label: 'توضیح بخش', type: 'textarea', defaultValue: 'هر زمان که خواستید، با ویدیوهای ضبط‌شده و تمرین‌های هر درس یاد بگیرید.' },
      { name: 'selection', label: 'انتخاب دوره‌ها', type: 'select', defaultValue: 'auto', options: [
        { label: 'همهٔ دوره‌های منتشرشده با تیک «نمایش در کاروسل» (به ترتیب فهرست دوره‌ها)', value: 'auto' },
        { label: 'فقط دوره‌های انتخاب‌شدهٔ زیر (به همین ترتیب)', value: 'manual' }] },
      { name: 'picked', label: 'دوره‌های انتخاب‌شده', type: 'relationship', relationTo: 'courses', hasMany: true, admin: { condition: (_, s) => s.selection === 'manual', description: 'برای تغییر ترتیب بکشید و رها کنید.' } },
      { name: 'visibleCards', label: 'تعداد کارت‌های همزمان (دسکتاپ)', type: 'number', defaultValue: 3, min: 1, max: 4 },
      { name: 'position', label: 'جای بخش در صفحهٔ اصلی', type: 'select', defaultValue: 'afterClasses', options: [
        { label: 'بعد از کلاس‌های زبان', value: 'afterClasses' }, { label: 'بعد از ویدیوی معرفی', value: 'afterIntro' }, { label: 'قبل از مقاله‌ها', value: 'beforeArticles' }] }] },
    { name: 'events', label: 'بخش رویدادها', type: 'group', fields: [
      { name: 'enabled', label: 'نمایش رویدادهای «نمایش در صفحهٔ اصلی»', type: 'checkbox', defaultValue: false },
      { name: 'title', label: 'عنوان بخش', type: 'text', defaultValue: 'کارگاه‌ها و رویدادها' }] },
  ],
  hooks: hooks(['home']),
}

export const Navigation: GlobalConfig = {
  slug: 'navigation', label: 'منو و پیوندهای سایت', admin: { group: G, description: 'پیوند «دوره‌های آفلاین» فقط وقتی قابلیت روشن است خودکار اضافه می‌شود.' },
  access: { read: staffOnly, update: allow('settings.write') },
  fields: [
    { name: 'header', label: 'منوی بالا', type: 'array', maxRows: 7, fields: [
      { name: 'label', label: 'عنوان', type: 'text', required: true }, { name: 'href', label: 'آدرس', type: 'text', required: true, validate: href }] },
    { name: 'footer', label: 'دسترسی سریع (پانویس)', type: 'array', maxRows: 10, fields: [
      { name: 'label', label: 'عنوان', type: 'text', required: true }, { name: 'href', label: 'آدرس', type: 'text', required: true, validate: href }] },
  ],
  hooks: hooks(['*']),
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings', label: 'اطلاعات آموزشگاه', admin: { group: G },
  access: { read: staffOnly, update: allow('settings.write') },
  fields: [
    { name: 'name', label: 'نام', type: 'text', defaultValue: 'آموزشگاه آنلاین زبان فرتاش' },
    { name: 'contact', label: 'تماس', type: 'group', fields: [
      { name: 'address', label: 'نشانی', type: 'text', defaultValue: 'مشهد، نبش طبرسی جنوبی ۶۰' },
      { name: 'phone', label: 'تلفن (رقم لاتین، برای لینک تماس)', type: 'text', defaultValue: '05132777100', validate: (v: unknown) => !v || /^0\d{10}$/.test(String(v)) || '۱۱ رقم با ۰ در ابتدا.' },
      { name: 'phoneDisplay', label: 'تلفن (نمایشی)', type: 'text', defaultValue: '۰۵۱-۳۲۷۷۷۱۰۰' },
      { name: 'email', label: 'ایمیل', type: 'email' },
      { name: 'hours', label: 'ساعت پاسخ‌گویی', type: 'text', defaultValue: 'شنبه تا پنجشنبه، ۹ تا ۲۱' }] },
    { name: 'social', label: 'شبکه‌های اجتماعی', type: 'group', fields: ['instagram', 'telegram', 'youtube'].map((n) => ({
      name: n, label: n === 'instagram' ? 'اینستاگرام' : n === 'telegram' ? 'تلگرام' : 'یوتیوب', type: 'text' as const,
      validate: (v: unknown) => !v || /^https:\/\//.test(String(v)) || 'آدرس کامل https.' })) },
    { name: 'seo', label: 'سئوی پیش‌فرض', type: 'group', fields: [
      { name: 'titleSuffix', label: 'پسوند عنوان صفحه‌ها', type: 'text', defaultValue: ' | فرتاش' },
      { name: 'description', label: 'توضیح پیش‌فرض', type: 'textarea' },
      { name: 'image', label: 'تصویر پیش‌فرض اشتراک‌گذاری', type: 'upload', relationTo: 'media' }] },
  ],
  hooks: hooks(['*']),
}
