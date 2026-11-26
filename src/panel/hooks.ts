import { useEffect, useState } from 'react'
/** Current time, refreshed every `ms` (for countdowns and "live now" states). */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), ms); return () => window.clearInterval(id) }, [ms])
  return now
}
/** A live class can be joined from 15 minutes before it starts until it ends. */
export const JOIN_EARLY_MS = 15 * 60000
