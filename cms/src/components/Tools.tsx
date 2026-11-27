'use client'
import { useState } from 'react'

type Result = { ok: boolean; text: string } | null
async function call(path: string): Promise<Result> {
  try {
    const res = await fetch(path, { method: 'POST', credentials: 'include' })
    const body = await res.json().catch(() => ({}))
    return { ok: res.ok && body.ok !== false, text: res.ok ? 'انجام شد.' : `انجام نشد: ${body.error ?? body.result ?? `HTTP ${res.status}`}` }
  } catch (e) {
    return { ok: false, text: `ارتباط برقرار نشد: ${(e as Error).message}` }
  }
}

/** Safe diagnostic actions. Results are shown only after the server answers (never optimistic). */
export function Tools() {
  const [busy, setBusy] = useState<string | null>(null)
  const [res, setRes] = useState<Record<string, Result>>({})
  const run = async (key: string, path: string) => { setBusy(key); const r = await call(path); setRes((s) => ({ ...s, [key]: r })); setBusy(null) }
  const items = [
    { key: 'revalidate', title: 'به‌روزرسانی حافظهٔ سایت', text: 'اگر تغییری در سایت دیده نمی‌شود، حافظهٔ موقت همهٔ صفحه‌ها را پاک می‌کند.', path: '/api/monitoring/revalidate' },
    { key: 'jobs', title: 'اجرای صف انتشار', text: 'انتشارهای زمان‌بندی‌شده‌ای که موعدشان رسیده همین حالا اجرا می‌شوند.', path: '/api/monitoring/run-jobs' },
  ]
  return (
    <section className="fx-tools" aria-labelledby="fx-tools-h">
      <h2 id="fx-tools-h">ابزارها</h2>
      <ul>
        {items.map((i) => (
          <li key={i.key}>
            <div><b>{i.title}</b><p>{i.text}</p></div>
            <button type="button" className="btn btn--style-secondary btn--size-medium" disabled={busy !== null} onClick={() => run(i.key, i.path)}>
              {busy === i.key ? 'در حال انجام…' : 'اجرا'}
            </button>
            {res[i.key] && <p role="status" className={res[i.key]!.ok ? 'fx-ok' : 'fx-err'}>{res[i.key]!.text}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
