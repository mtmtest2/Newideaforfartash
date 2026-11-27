'use client'
// Jalali (Persian calendar) companions for Payload's Gregorian date picker: a hint under the input and list cells.
import { useField } from '@payloadcms/ui'

const fmt = (iso: string, withTime: boolean) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran', weekday: withTime ? 'long' : undefined, year: 'numeric', month: 'long', day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(new Date(iso))

export function JalaliHint({ path }: { path: string }) {
  const { value } = useField<string>({ path })
  return (
    <p className="fx-jalali" aria-live="polite">
      {value ? <>معادل شمسی: <b>{fmt(value, true)}</b> (به وقت تهران)</> : 'تاریخی انتخاب نشده است.'}
    </p>
  )
}

export function JalaliCell({ cellData }: { cellData?: string | null }) {
  return cellData ? <span className="fx-nowrap">{fmt(cellData, false)}</span> : <span className="fx-muted">—</span>
}
