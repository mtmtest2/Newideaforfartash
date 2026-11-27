'use client'
import { useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

async function openPreview() {
  const r = await fetch('/api/admin-tools/preview-home-courses', { credentials: 'include' })
  if (r.ok) window.open((await r.json()).url, '_blank', 'noopener')
}

export function PreviewCoursesButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button type="button" className="btn btn--style-secondary btn--size-medium fx-preview-btn" disabled={busy}
      onClick={async () => { setBusy(true); await openPreview(); setBusy(false) }}>
      {busy ? 'در حال آماده‌سازی…' : 'پیش‌نمایش صفحهٔ اصلی با کاروسل دوره‌ها'}
    </button>
  )
}

/** State of the offline-courses feature: what is public right now, what turning it on changes, and a preview. */
export function FlagPanel() {
  const on = useFormFields(([fields]) => !!fields.offlineCoursesEnabled?.value)
  const [ready, setReady] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/courses?limit=0&where[_status][equals]=published&where[workflowStatus][not_equals]=archived', { credentials: 'include' })
      .then((r) => r.json()).then((d) => setReady(d.totalDocs ?? 0)).catch(() => setReady(null))
  }, [])
  return (
    <section className={`fx-flagpanel ${on ? 'on' : 'off'}`} aria-live="polite">
      <div className="fx-flagpanel-state">
        <span className="fx-dot" aria-hidden="true" />
        <b>دوره‌های آفلاین {on ? 'روشن است' : 'خاموش است'}</b>
        <small>{ready === null ? '' : `${ready.toLocaleString('fa-IR')} دورهٔ منتشرشده آمادهٔ نمایش`}</small>
      </div>
      <ul>
        {on ? <>
          <li>پیوند «دوره‌های آفلاین» در منوی سایت نمایش داده می‌شود.</li>
          <li>کاروسل دوره‌ها در جایی که در «صفحهٔ اصلی» تعیین کرده‌اید دیده می‌شود.</li>
          <li>صفحهٔ همهٔ دوره‌ها و صفحهٔ هر دوره در دسترس و در نقشهٔ سایت است.</li>
        </> : <>
          <li>هیچ اثری از دوره‌ها در سایت نیست: نه منو، نه بخش صفحهٔ اصلی، نه نقشهٔ سایت.</li>
          <li>نشانی صفحه‌های دوره مثل یک نشانی ناموجود پاسخ «پیدا نشد» می‌دهند.</li>
          <li>ساخت و ویرایش دوره‌ها در داشبورد مثل همیشه ممکن است.</li>
        </>}
      </ul>
      <p className="fx-muted">بعد از تغییر تیک زیر، دکمهٔ «ذخیره» را بزنید؛ سایت در چند ثانیه به‌روز می‌شود.</p>
      <PreviewCoursesButton />
    </section>
  )
}
