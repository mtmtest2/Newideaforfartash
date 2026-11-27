'use client'
import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

const NAMES: Record<string, string> = { articles: 'مقاله', teachers: 'استاد', events: 'رویداد', courses: 'دوره', languages: 'زبان', authors: 'نویسنده' }
type Item = { collection: string; id: string | number; title: string }

/** Where this file is used. Media in use cannot be deleted until it is replaced in these documents. */
export function MediaUsage() {
  const { id } = useDocumentInfo()
  const [items, setItems] = useState<Item[] | null>(null)
  useEffect(() => {
    if (!id) return
    fetch(`/api/admin-tools/media-usage/${id}`, { credentials: 'include' }).then((r) => r.json()).then((d) => setItems(d.items ?? [])).catch(() => setItems([]))
  }, [id])
  if (!id) return null
  return (
    <section className="fx-panel" aria-labelledby="fx-usage-h">
      <h3 id="fx-usage-h">محل استفاده</h3>
      {items === null ? <p className="fx-muted">در حال بررسی…</p> : items.length === 0 ? (
        <p className="fx-muted">این فایل در هیچ محتوایی استفاده نشده و می‌توانید آن را حذف کنید.</p>
      ) : (
        <>
          <p className="fx-muted">تا وقتی در این موارد استفاده شده، حذف نمی‌شود:</p>
          <ul className="fx-usage">{items.map((u) => (
            <li key={`${u.collection}-${u.id}`}><span className="fx-chip">{NAMES[u.collection] ?? u.collection}</span>
              <a href={`/support/collections/${u.collection}/${u.id}`}>{u.title}</a></li>
          ))}</ul>
        </>
      )}
    </section>
  )
}
