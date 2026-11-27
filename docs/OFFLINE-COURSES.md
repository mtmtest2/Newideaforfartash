# Offline courses

Fully implemented, **disabled by default** (`feature-flags.offlineCoursesEnabled = false`).

## Managing
Support Dashboard → دوره‌های آفلاین: general info, curriculum (sections → chapters → lessons: title, description,
minutes, free preview, secure video reference, private resources), sales & access (price, discount, enrollment status,
purchasable, access days, availability window), SEO, workflow stage (draft → pending review → approved → published /
scheduled / archived), drafts, versions, scheduling, preview. Totals (lessons, minutes) are computed.

Homepage carousel: صفحهٔ اصلی → کاروسل دوره‌های آفلاین — title, description, selection (automatic: published courses
with "نمایش در کاروسل" in list order; manual: picked courses in drag-and-drop order) and position (after the intro
video, after the language classes, before the articles). It reuses the approved teacher-carousel component.

## While disabled
No menu item, no home section, `/courses*` answer 404 exactly like unknown URLs, nothing in the sitemap or the home
API, no course data in any page payload. Previews still work for Support.

## Enabling (no code, no deploy)
قابلیت‌های سایت → tick «نمایش دوره‌های آفلاین در سایت» → save. The site cache is revalidated immediately: menu item,
carousel (if courses are configured), `/courses`, course pages and sitemap entries appear. Emergency switch-off without
the dashboard: set `OFFLINE_COURSES_FORCE_OFF=1` for the CMS container (it can only force OFF).

## Delivery (future phases)
Purchase and playback need the payment and enrollment services (`contracts/payments.ts`, `contracts/enrollment.ts`):
the platform API checks an active enrollment (or `lesson.preview`) and requests a short-lived signed URL from the
streaming provider for `lesson.video.assetId`. Until then the public course page shows the curriculum outline only;
`purchasable` is always false in the public API, so no purchase button is ever shown.
