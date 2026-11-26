import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
/** Current time, refreshed every `ms` (for countdowns and "live now" states). */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), ms); return () => window.clearInterval(id) }, [ms])
  return now
}
/** A live class can be joined from 15 minutes before it starts until it ends. */
export const JOIN_EARLY_MS = 15 * 60000

/** A filter/tab value kept in the URL (?key=value), so it survives reload, back/forward and can be shared. */
export function useQueryState<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key) as T | null
  const value = raw && allowed.includes(raw) ? raw : fallback
  const set = (v: T) => setParams((p) => {
    const n = new URLSearchParams(p)
    if (v === fallback) n.delete(key); else n.set(key, v)
    return n
  }, { replace: true })
  return [value, set] as const
}

/** Shows a validation message under one field: marks it aria-invalid and moves focus to it. */
export function fieldError(form: HTMLFormElement, name: string) {
  const el = form.elements.namedItem(name) as HTMLElement | null
  el?.focus()
}
