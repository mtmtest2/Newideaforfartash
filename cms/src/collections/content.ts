// Content modules of the Fartash Content Hub. Public visibility is decided ONLY by src/public-api (published, date reached,
// not archived, feature flags), never by direct collection reads (those are staff-only).
import { APIError, type CollectionConfig, type Field } from 'payload'
import { publishable, publishedAtField, reference, seoField, slugField } from '../fields'
import { articleEditor, simpleEditor } from '../fields/editor'
import { allowField } from '../access/permissions'

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => ({ label: l, value: l }))
export const FLAGS = [
  { label: 'انگلستان', value: 'uk' }, { label: 'آلمان', value: 'de' }, { label: 'فرانسه', value: 'fr' },
  { label: 'عربستان', value: 'sa' }, { label: 'ترکیه', value: 'tr' }, { label: 'ایتالیا', value: 'it' }]
const G = 'مدیریت محتوا'

/* ---------------- taxonomy ---------------- */
export const Authors = reference({
  slug: 'authors', labels: { singular: 'نویسنده', plural: 'نویسندگان' },
  admin: { group: G, useAsTitle: 'name' },
  fields: [
    { name: 'name', label: 'نام', type: 'text', required: true }, slugField('name'),
    { name: 'role', label: 'سمت', type: 'text' }, { name: 'avatar', label: 'تصویر', type: 'upload', relationTo: 'media' },
    { name: 'bio', label: 'معرفی', type: 'textarea' },
    { name: 'teacher', label: 'استاد مرتبط', type: 'relationship', relationTo: 'teachers', admin: { description: 'اگر نویسنده یکی از اساتید است.' } },
  ],
})
export const Categories = reference({
  slug: 'categories', labels: { singular: 'دسته‌بندی', plural: 'دسته‌بندی‌ها' },
  admin: { group: G, useAsTitle: 'name' },
  fields: [{ name: 'name', label: 'نام', type: 'text', required: true }, slugField('name'), { name: 'description', label: 'توضیح', type: 'textarea' }, seoField],
})
export const Tags = reference({
  slug: 'tags', labels: { singular: 'برچسب', plural: 'برچسب‌ها' },
  admin: { group: G, useAsTitle: 'name' },
  fields: [{ name: 'name', label: 'نام', type: 'text', required: true }, slugField('name')],
})
export const Redirects = reference({
  slug: 'redirects', labels: { singular: 'تغییر مسیر', plural: 'تغییر مسیرها' },
  admin: { group: 'سئو', useAsTitle: 'from', defaultColumns: ['from', 'to', 'type'] },
  fields: [
    { name: 'from', label: 'از مسیر', type: 'text', required: true, unique: true, index: true,
      validate: (v: unknown) => /^\/[^\s?#]*$/.test(String(v ?? '')) || 'مسیر باید با / شروع شود؛ مثلاً /blog' },
    { name: 'to', label: 'به مسیر یا آدرس', type: 'text', required: true,
      validate: (v: unknown) => /^(\/[^\s]*|https:\/\/\S+)$/.test(String(v ?? '')) || 'مسیر داخلی (/…) یا آدرس کامل https.' },
    { name: 'type', label: 'نوع', type: 'select', defaultValue: '301', options: [{ label: 'دائمی (301)', value: '301' }, { label: 'موقت (302)', value: '302' }] },
  ],
})

/* ---------------- magazine ---------------- */
export const Articles = publishable({
  slug: 'articles', labels: { singular: 'مقاله', plural: 'مجله' },
  publicPath: (d) => (d.slug ? `/magazine/${d.slug}` : null),
  revalidate: ['articles', 'sitemap'],
  admin: { group: G, useAsTitle: 'title', defaultColumns: ['title', 'category', 'author', '_status', 'publishedAt'], listSearchableFields: ['title', 'slug'] },
  fields: [
    { name: 'title', label: 'عنوان', type: 'text', required: true },
    { name: 'excerpt', label: 'خلاصه', type: 'textarea', required: true, maxLength: 280 },
    { name: 'cover', label: 'تصویر شاخص', type: 'upload', relationTo: 'media', required: true },
    { name: 'content', label: 'متن مقاله', type: 'richText', editor: articleEditor, required: true },
    slugField(), publishedAtField,
    { name: 'author', label: 'نویسنده', type: 'relationship', relationTo: 'authors', admin: { position: 'sidebar' } },
    { name: 'category', label: 'دسته‌بندی', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    { name: 'tags', label: 'برچسب‌ها', type: 'relationship', relationTo: 'tags', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'language', label: 'زبان مرتبط', type: 'relationship', relationTo: 'languages', admin: { position: 'sidebar' } },
    { name: 'related', label: 'مقاله‌های مرتبط', type: 'relationship', relationTo: 'articles', hasMany: true, maxRows: 4,
      filterOptions: ({ id }) => ({ id: { not_equals: id } }) },
    { name: 'readingTime', label: 'زمان مطالعه (دقیقه)', type: 'number', admin: { position: 'sidebar', readOnly: true, description: 'خودکار از طول متن محاسبه می‌شود.' } },
    seoField,
  ],
  hooks: {
    beforeChange: [({ data }) => {
      const text = JSON.stringify(data?.content ?? '').replace(/"(type|format|version|direction|indent|mode|style|detail)":"?[^,"}]*"?/g, '')
      const words = (text.match(/[\p{L}\p{N}]+/gu) ?? []).length
      return { ...data, readingTime: Math.max(1, Math.round(words / 200)) }
    }],
  },
})

/* ---------------- teachers ---------------- */
export const Teachers = publishable({
  slug: 'teachers', labels: { singular: 'استاد', plural: 'اساتید' },
  orderable: true, // drag-and-drop order = order in the directory and the homepage carousel
  publicPath: (d) => (d.slug ? `/teachers/${d.slug}` : null),
  revalidate: ['teachers', 'home', 'sitemap'],
  admin: { group: G, useAsTitle: 'displayName', defaultColumns: ['displayName', 'title', 'profileState', 'showOnHome', '_status'],
    description: 'ترتیب این فهرست (با کشیدن و رها کردن) همان ترتیب کاروسل صفحهٔ اصلی و صفحهٔ اساتید است.' },
  fields: [
    { type: 'row', fields: [{ name: 'firstName', label: 'نام', type: 'text', required: true }, { name: 'lastName', label: 'نام خانوادگی', type: 'text', required: true }] },
    { name: 'displayName', label: 'نام نمایشی', type: 'text', admin: { hidden: true },
      hooks: { beforeChange: [({ siblingData }) => `استاد ${siblingData.firstName ?? ''} ${siblingData.lastName ?? ''}`.trim()] } },
    { name: 'title', label: 'عنوان حرفه‌ای', type: 'text', required: true, admin: { description: 'مثلاً «مدرس آیلتس و مکالمه»' } },
    { name: 'photo', label: 'تصویر', type: 'upload', relationTo: 'media', required: true },
    { type: 'tabs', tabs: [
      { label: 'معرفی', fields: [
        { name: 'bio', label: 'زندگی‌نامه', type: 'richText', editor: simpleEditor },
        { name: 'languages', label: 'زبان‌های تدریس', type: 'relationship', relationTo: 'languages', hasMany: true, required: true },
        { name: 'levels', label: 'سطح‌های تدریس', type: 'select', hasMany: true, options: LEVELS },
        { name: 'specializations', label: 'تخصص‌ها', type: 'array', fields: [{ name: 'label', label: 'عنوان', type: 'text', required: true }] },
        { name: 'qualifications', label: 'مدارک تحصیلی', type: 'array', fields: [{ name: 'label', label: 'عنوان', type: 'text', required: true }] },
        { name: 'certificates', label: 'گواهی‌ها', type: 'array', fields: [{ name: 'label', label: 'عنوان', type: 'text', required: true }, { name: 'year', label: 'سال', type: 'number' }] },
        { name: 'experienceYears', label: 'سابقهٔ تدریس (سال)', type: 'number', min: 0 },
        { name: 'introVideo', label: 'ویدیوی معرفی (آپارات یا یوتیوب)', type: 'text',
          validate: (v: unknown) => !v || /^https:\/\/(www\.)?(aparat\.com|youtube\.com|youtu\.be)\//.test(String(v)) || 'فقط آدرس آپارات یا یوتیوب با https.' },
      ] },
      { label: 'کارت کاروسل', description: 'آنچه در کارت صفحهٔ اصلی و صفحهٔ اساتید دیده می‌شود.', fields: [
        { name: 'cardText', label: 'متن کوتاه کارت', type: 'textarea', required: true, maxLength: 140 },
        { name: 'cardTags', label: 'برچسب‌های کارت', type: 'text', hasMany: true, maxRows: 3 },
        { name: 'cardLevel', label: 'سطح نمایش‌داده‌شده', type: 'text', admin: { description: 'مثلاً «متوسط»' } },
        { name: 'students', label: 'تعداد زبان‌آموزان', type: 'number', min: 0, admin: { description: 'فقط عدد واقعی؛ اگر ندارید خالی بگذارید تا نمایش داده نشود.' } },
        { name: 'rating', label: 'امتیاز (از ۵)', type: 'number', min: 0, max: 5, admin: { step: 0.1, description: 'فقط امتیاز واقعی؛ اگر ندارید خالی بگذارید.' } },
      ] },
      { label: 'سئو', fields: [seoField] },
    ] },
    slugField('lastName'),
    { name: 'profileState', label: 'وضعیت پروفایل', type: 'select', defaultValue: 'active', required: true, admin: { position: 'sidebar', description: 'غیرفعال یا بایگانی: از سایت حذف می‌شود ولی سوابق آموزشی باقی می‌ماند.' },
      options: [{ label: 'فعال', value: 'active' }, { label: 'غیرفعال', value: 'inactive' }, { label: 'بایگانی‌شده', value: 'archived' }] },
    { name: 'showOnHome', label: 'نمایش در کاروسل صفحهٔ اصلی', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'fartashUserId', label: 'شناسهٔ حساب در سامانهٔ مرکزی', type: 'text', index: true, access: { read: allowField('content.read') },
      admin: { position: 'sidebar', description: 'برای اتصال آینده به حساب کاربری استاد (فعلاً خالی). هرگز در سایت نمایش داده نمی‌شود.' } },
  ],
})

/* ---------------- languages ---------------- */
export const Languages = publishable({
  slug: 'languages', labels: { singular: 'زبان', plural: 'زبان‌ها' },
  orderable: true,
  publicPath: (d) => (d.slug ? `/languages/${d.slug}` : null),
  revalidate: ['languages', 'teachers', 'home', 'sitemap'],
  admin: { group: G, useAsTitle: 'name', defaultColumns: ['name', 'slug', '_status'] },
  fields: [
    { type: 'row', fields: [
      { name: 'name', label: 'نام کامل', type: 'text', required: true, admin: { description: 'مثلاً «زبان انگلیسی»' } },
      { name: 'shortName', label: 'نام کوتاه', type: 'text', required: true, admin: { description: 'مثلاً «انگلیسی»' } },
      { name: 'flag', label: 'پرچم', type: 'select', required: true, options: FLAGS }] },
    { name: 'intro', label: 'معرفی کوتاه', type: 'textarea', required: true },
    { name: 'description', label: 'توضیحات', type: 'richText', editor: simpleEditor },
    { name: 'image', label: 'تصویر', type: 'upload', relationTo: 'media' },
    { name: 'levels', label: 'سطح‌ها', type: 'array', fields: [
      { name: 'code', label: 'سطح', type: 'select', required: true, options: LEVELS },
      { name: 'title', label: 'عنوان', type: 'text', required: true }, { name: 'description', label: 'توضیح', type: 'textarea' }] },
    { name: 'exams', label: 'آزمون‌های بین‌المللی', type: 'array', fields: [
      { name: 'name', label: 'نام آزمون', type: 'text', required: true }, { name: 'description', label: 'توضیح', type: 'textarea' }] },
    { name: 'resources', label: 'منابع یادگیری', type: 'array', fields: [
      { name: 'title', label: 'عنوان', type: 'text', required: true },
      { name: 'url', label: 'آدرس', type: 'text', validate: (v: unknown) => !v || /^https:\/\//.test(String(v)) || 'آدرس باید با https شروع شود.' }] },
    { name: 'teachers', label: 'اساتید این زبان', type: 'join', collection: 'teachers', on: 'languages' },
    { name: 'articles', label: 'مقاله‌های این زبان', type: 'join', collection: 'articles', on: 'language' },
    slugField('shortName'), seoField,
  ],
})

/* ---------------- events ---------------- */
export const Events = publishable({
  slug: 'events', labels: { singular: 'رویداد', plural: 'کارگاه‌ها و رویدادها' },
  orderable: true,
  publicPath: (d) => (d.slug ? `/events/${d.slug}` : null),
  revalidate: ['events', 'home', 'sitemap'],
  admin: { group: G, useAsTitle: 'title', defaultColumns: ['title', 'type', 'startsAt', 'registration', '_status'] },
  fields: [
    { name: 'type', label: 'نوع', type: 'select', required: true, defaultValue: 'workshop', options: [
      { label: 'کارگاه', value: 'workshop' }, { label: 'وبینار', value: 'webinar' }, { label: 'جلسهٔ ویژه', value: 'special' },
      { label: 'رویداد آموزشی', value: 'educational' }, { label: 'مسترکلاس', value: 'masterclass' }] },
    { name: 'title', label: 'عنوان', type: 'text', required: true },
    { name: 'subtitle', label: 'زیرعنوان', type: 'text' },
    { name: 'excerpt', label: 'توضیح کوتاه', type: 'textarea', required: true, maxLength: 240 },
    { name: 'description', label: 'توضیحات کامل', type: 'richText', editor: simpleEditor },
    { name: 'poster', label: 'پوستر', type: 'upload', relationTo: 'media', required: true },
    { type: 'tabs', tabs: [
      { label: 'زمان و مکان', fields: [
        { type: 'row', fields: [
          { name: 'startsAt', label: 'شروع', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
          { name: 'endsAt', label: 'پایان', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } },
            validate: (v: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => !v || !siblingData.startsAt || new Date(String(v)) > new Date(String(siblingData.startsAt)) || 'پایان باید بعد از شروع باشد.' }] },
        { name: 'timezone', label: 'منطقهٔ زمانی', type: 'text', defaultValue: 'Asia/Tehran' },
        { name: 'format', label: 'نوع برگزاری', type: 'select', defaultValue: 'online', options: [{ label: 'آنلاین', value: 'online' }, { label: 'حضوری', value: 'offline' }] },
        { name: 'venue', label: 'مکان (برای حضوری)', type: 'text', admin: { condition: (_, s) => s.format === 'offline' } },
        { name: 'meetingLink', label: 'لینک جلسه (فقط برای ثبت‌نام‌شده‌ها؛ در سایت نمایش داده نمی‌شود)', type: 'text', admin: { condition: (_, s) => s.format === 'online' } },
      ] },
      { label: 'ثبت‌نام', fields: [
        { name: 'registration', label: 'وضعیت ثبت‌نام', type: 'select', defaultValue: 'soon', options: [
          { label: 'به‌زودی', value: 'soon' }, { label: 'باز', value: 'open' }, { label: 'تکمیل ظرفیت', value: 'full' }, { label: 'بسته', value: 'closed' }] },
        { name: 'registrationUrl', label: 'آدرس فرم ثبت‌نام', type: 'text', validate: (v: unknown) => !v || /^(https:\/\/|\/)/.test(String(v)) || 'آدرس https یا مسیر داخلی.' },
        { type: 'row', fields: [{ name: 'capacity', label: 'ظرفیت', type: 'number', min: 1 }, { name: 'price', label: 'هزینه (تومان، ۰ = رایگان)', type: 'number', min: 0, defaultValue: 0 }] },
        { name: 'requirements', label: 'پیش‌نیازها', type: 'textarea' },
        { name: 'audience', label: 'مخاطبان', type: 'textarea' },
      ] },
      { label: 'سئو', fields: [seoField] },
    ] },
    slugField(), publishedAtField,
    { name: 'speakerTeacher', label: 'استاد برگزارکننده', type: 'relationship', relationTo: 'teachers', admin: { position: 'sidebar' } },
    { name: 'speakerName', label: 'یا نام سخنران مهمان', type: 'text', admin: { position: 'sidebar' } },
    { name: 'language', label: 'زبان', type: 'relationship', relationTo: 'languages', admin: { position: 'sidebar' } },
    { name: 'category', label: 'دسته‌بندی', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    { name: 'featured', label: 'رویداد ویژه', type: 'checkbox', admin: { position: 'sidebar' } },
    { name: 'showOnHome', label: 'نمایش در صفحهٔ اصلی', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
})

/* ---------------- offline courses (hidden unless the feature flag is on) ---------------- */
const lessonFields: Field[] = [
  { name: 'title', label: 'عنوان درس', type: 'text', required: true },
  { name: 'description', label: 'توضیح', type: 'textarea' },
  { type: 'row', fields: [
    { name: 'minutes', label: 'مدت (دقیقه)', type: 'number', min: 0 },
    { name: 'preview', label: 'پیش‌نمایش رایگان', type: 'checkbox', admin: { description: 'این درس بدون خرید قابل تماشاست.' } }] },
  { name: 'video', label: 'ویدیو', type: 'group', admin: { description: 'فایل ویدیو در سرویس پخش امن نگه داشته می‌شود؛ این‌جا فقط شناسهٔ آن ثبت می‌شود و هرگز آدرس مستقیم در سایت قرار نمی‌گیرد.' }, fields: [
    { type: 'row', fields: [
      { name: 'provider', label: 'سرویس پخش', type: 'select', options: [
        { label: 'ابر آروان (VOD)', value: 'arvan' }, { label: 'آپارات (خصوصی)', value: 'aparat' }, { label: 'Bunny Stream', value: 'bunny' }, { label: 'سایر', value: 'other' }] },
      { name: 'assetId', label: 'شناسهٔ ویدیو در سرویس', type: 'text' }] },
  ] },
  { name: 'resources', label: 'فایل‌های درس', type: 'relationship', relationTo: 'private-files', hasMany: true },
]
export const Courses = publishable({
  slug: 'courses', labels: { singular: 'دورهٔ آفلاین', plural: 'دوره‌های آفلاین' },
  orderable: true,
  publicPath: (d) => (d.slug ? `/courses/${d.slug}` : null),
  revalidate: ['courses', 'home', 'sitemap'],
  admin: { group: G, useAsTitle: 'title', defaultColumns: ['title', 'workflowStatus', 'showOnHome', '_status'],
    description: 'تا وقتی «نمایش دوره‌های آفلاین» در «قابلیت‌های سایت» خاموش است، هیچ‌چیز از این بخش در سایت دیده نمی‌شود.' },
  fields: [
    { name: 'title', label: 'عنوان دوره', type: 'text', required: true },
    { name: 'subtitle', label: 'زیرعنوان', type: 'text' },
    { type: 'tabs', tabs: [
      { label: 'اطلاعات کلی', fields: [
        { name: 'excerpt', label: 'توضیح کوتاه', type: 'textarea', required: true, maxLength: 240 },
        { name: 'description', label: 'توضیحات کامل', type: 'richText', editor: simpleEditor },
        { type: 'row', fields: [
          { name: 'language', label: 'زبان', type: 'relationship', relationTo: 'languages', required: true },
          { name: 'level', label: 'سطح', type: 'select', hasMany: true, options: LEVELS },
          { name: 'difficulty', label: 'دشواری', type: 'select', options: [{ label: 'آسان', value: 'easy' }, { label: 'متوسط', value: 'medium' }, { label: 'پیشرفته', value: 'hard' }] }] },
        { name: 'instructor', label: 'مدرس', type: 'relationship', relationTo: 'teachers', required: true },
        { name: 'audience', label: 'مخاطبان', type: 'textarea' },
        { name: 'prerequisites', label: 'پیش‌نیازها', type: 'textarea' },
        { name: 'objectives', label: 'اهداف یادگیری', type: 'array', fields: [{ name: 'text', label: 'هدف', type: 'text', required: true }] },
        { name: 'cover', label: 'تصویر شاخص', type: 'upload', relationTo: 'media', required: true },
        { name: 'promoVideo', label: 'ویدیوی معرفی (عمومی، آپارات یا یوتیوب)', type: 'text',
          validate: (v: unknown) => !v || /^https:\/\/(www\.)?(aparat\.com|youtube\.com|youtu\.be)\//.test(String(v)) || 'فقط آدرس آپارات یا یوتیوب با https.' },
        { type: 'row', fields: [
          { name: 'estimatedWeeks', label: 'زمان تقریبی اتمام (هفته)', type: 'number', min: 0 },
          { name: 'totalMinutes', label: 'مدت کل (دقیقه)', type: 'number', admin: { readOnly: true, description: 'خودکار' } },
          { name: 'totalLessons', label: 'تعداد درس‌ها', type: 'number', admin: { readOnly: true, description: 'خودکار' } }] },
      ] },
      { label: 'سرفصل‌ها', fields: [
        { name: 'modules', label: 'بخش‌ها', type: 'array', labels: { singular: 'بخش', plural: 'بخش‌ها' }, fields: [
          { name: 'title', label: 'عنوان بخش', type: 'text', required: true }, { name: 'description', label: 'توضیح', type: 'textarea' },
          { name: 'chapters', label: 'فصل‌ها', type: 'array', labels: { singular: 'فصل', plural: 'فصل‌ها' }, fields: [
            { name: 'title', label: 'عنوان فصل', type: 'text', required: true },
            { name: 'lessons', label: 'درس‌ها', type: 'array', labels: { singular: 'درس', plural: 'درس‌ها' }, fields: lessonFields }] }] },
      ] },
      { label: 'فروش و دسترسی', description: 'فقط اطلاعات؛ پرداخت و ثبت‌نام در فاز سامانهٔ پرداخت پیاده می‌شود.', fields: [
        { type: 'row', fields: [
          { name: 'price', label: 'قیمت (تومان)', type: 'number', min: 0 },
          { name: 'accessDays', label: 'مدت دسترسی (روز، ۰ = همیشگی)', type: 'number', min: 0, defaultValue: 0 }] },
        { name: 'discount', label: 'تخفیف', type: 'group', fields: [
          { name: 'enabled', label: 'فعال', type: 'checkbox' },
          { type: 'row', fields: [
            { name: 'kind', label: 'نوع', type: 'select', options: [{ label: 'درصدی', value: 'percent' }, { label: 'مبلغ ثابت', value: 'amount' }] },
            { name: 'value', label: 'مقدار', type: 'number', min: 0 }] },
          { type: 'row', fields: [{ name: 'from', label: 'از', type: 'date' }, { name: 'to', label: 'تا', type: 'date' }] }] },
        { name: 'enrollment', label: 'وضعیت ثبت‌نام', type: 'select', defaultValue: 'not_open', options: [
          { label: 'هنوز باز نشده', value: 'not_open' }, { label: 'باز', value: 'open' }, { label: 'بسته', value: 'closed' }] },
        { name: 'purchasable', label: 'قابل خرید', type: 'checkbox', defaultValue: false, admin: { description: 'تا راه‌اندازی سامانهٔ پرداخت، دکمهٔ خرید در سایت نمایش داده نمی‌شود.' } },
        { type: 'row', fields: [{ name: 'availableFrom', label: 'در دسترس از', type: 'date' }, { name: 'availableTo', label: 'در دسترس تا', type: 'date' }] },
      ] },
      { label: 'سئو', fields: [seoField] },
    ] },
    slugField(), publishedAtField,
    { name: 'workflowStatus', label: 'مرحلهٔ کار', type: 'select', defaultValue: 'draft', admin: { position: 'sidebar' }, options: [
      { label: 'پیش‌نویس', value: 'draft' }, { label: 'در انتظار بررسی', value: 'pending_review' }, { label: 'تأییدشده', value: 'approved' },
      { label: 'منتشرشده', value: 'published' }, { label: 'زمان‌بندی‌شده', value: 'scheduled' }, { label: 'بایگانی‌شده', value: 'archived' }] },
    { name: 'showOnHome', label: 'نمایش در کاروسل دوره‌ها', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'featured', label: 'دورهٔ ویژه', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
  hooks: {
    beforeChange: [({ data }) => {
      let minutes = 0, lessons = 0
      for (const m of data?.modules ?? []) for (const c of m.chapters ?? []) for (const l of c.lessons ?? []) { lessons++; minutes += Number(l.minutes) || 0 }
      const wf = data?._status === 'published' && ['draft', 'pending_review', 'approved', 'scheduled'].includes(data.workflowStatus) ? 'published' : data?.workflowStatus
      if (data?.purchasable && !data?.price) throw new APIError('برای دورهٔ قابل خرید، قیمت را وارد کنید.', 400, undefined, true)
      return { ...data, totalMinutes: minutes, totalLessons: lessons, workflowStatus: wf }
    }],
  },
})

/* ---------------- public pages (controlled blocks only) ---------------- */
const PAGE_BLOCKS = [
  { slug: 'intro', labels: { singular: 'سرآغاز', plural: 'سرآغازها' }, fields: [
    { name: 'heading', label: 'تیتر', type: 'text', required: true }, { name: 'text', label: 'متن', type: 'textarea' },
    { name: 'image', label: 'تصویر', type: 'upload', relationTo: 'media' }] },
  { slug: 'richText', labels: { singular: 'متن', plural: 'متن‌ها' }, fields: [{ name: 'body', label: 'متن', type: 'richText', editor: simpleEditor, required: true }] },
  { slug: 'faq', labels: { singular: 'پرسش‌های متداول', plural: 'پرسش‌های متداول' }, fields: [
    { name: 'title', label: 'عنوان', type: 'text' },
    { name: 'items', label: 'پرسش‌ها', type: 'array', minRows: 1, fields: [{ name: 'q', label: 'پرسش', type: 'text', required: true }, { name: 'a', label: 'پاسخ', type: 'textarea', required: true }] }] },
  { slug: 'cta', labels: { singular: 'دعوت به اقدام', plural: 'دعوت به اقدام' }, fields: [
    { name: 'heading', label: 'تیتر', type: 'text', required: true }, { name: 'text', label: 'متن', type: 'textarea' },
    { name: 'buttonLabel', label: 'متن دکمه', type: 'text', required: true },
    { name: 'href', label: 'آدرس دکمه', type: 'text', required: true, validate: (v: unknown) => /^(\/|https:\/\/)/.test(String(v ?? '')) || 'مسیر داخلی یا آدرس https.' }] },
  { slug: 'contact', labels: { singular: 'اطلاعات تماس', plural: 'اطلاعات تماس' }, fields: [{ name: 'title', label: 'عنوان', type: 'text' }] },
  { slug: 'announcement', labels: { singular: 'اطلاعیه', plural: 'اطلاعیه‌ها' }, fields: [
    { name: 'tone', label: 'نوع', type: 'select', defaultValue: 'info', options: [{ label: 'اطلاع', value: 'info' }, { label: 'مهم', value: 'important' }] },
    { name: 'text', label: 'متن', type: 'textarea', required: true }] },
] as const
export const Pages = publishable({
  slug: 'pages', labels: { singular: 'صفحه', plural: 'صفحه‌های عمومی' },
  publicPath: (d) => (d.slug ? `/${d.slug}` : null),
  revalidate: ['pages', 'sitemap'],
  admin: { group: G, useAsTitle: 'title', defaultColumns: ['title', 'slug', '_status'],
    description: 'صفحه‌هایی مثل «درباره فرتاش»، «تماس» و قوانین. فقط بلوک‌های از پیش تعریف‌شده با طراحی سایت در دسترس‌اند.' },
  fields: [
    { name: 'title', label: 'عنوان', type: 'text', required: true },
    { name: 'blocks', label: 'بلوک‌ها', type: 'blocks', blocks: PAGE_BLOCKS as never, required: true, minRows: 1 },
    slugField(), publishedAtField,
    { name: 'kind', label: 'نوع صفحه', type: 'select', defaultValue: 'info', admin: { position: 'sidebar' },
      options: [{ label: 'اطلاعاتی', value: 'info' }, { label: 'حقوقی', value: 'legal' }, { label: 'تماس', value: 'contact' }] },
    seoField,
  ],
  hooks: {
    beforeValidate: [({ data }) => {
      const reserved = ['magazine', 'blog', 'teachers', 'events', 'languages', 'courses', 'login', 'placement', 'panel', 'teacher', 'reception', 'api', 'assets', 'support']
      if (data?.slug && reserved.includes(String(data.slug))) throw new APIError('این نشانی برای بخش‌های سایت رزرو شده است؛ نشانی دیگری انتخاب کنید.', 400, undefined, true)
      return data
    }],
  },
})
