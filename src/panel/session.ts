// Demo session stored in the browser. There is no backend yet: replace getSession/signIn/signOut with real
// auth calls when an API exists. useSession is SSR-safe (server snapshot = null) so prerendered panel pages hydrate.
import { useSyncExternalStore } from 'react'

export type Session = {
  name: string
  phone: string // Latin digits, e.g. 09121234567
  email?: string
  goal?: string
  notifySms?: boolean
  notifyEmail?: boolean
  joined: string // ISO date
}

const KEY = 'fartash-session'
const listeners = new Set<() => void>()
let cache: { raw: string | null; value: Session | null } = { raw: null, value: null }

function read(): Session | null {
  let raw: string | null = null
  try { raw = localStorage.getItem(KEY) } catch { /* storage blocked */ }
  if (raw === cache.raw) return cache.value
  let value: Session | null = null
  try { value = raw ? (JSON.parse(raw) as Session) : null } catch { value = null }
  cache = { raw, value }
  return value
}
const emit = () => listeners.forEach((l) => l())

export const getSession = read
export function signIn(s: Omit<Session, 'joined'> & { joined?: string }) {
  const value: Session = { notifySms: true, notifyEmail: false, ...s, joined: s.joined ?? new Date().toISOString() }
  try { localStorage.setItem(KEY, JSON.stringify(value)) } catch { /* ignore */ }
  emit()
}
export function updateSession(patch: Partial<Session>) {
  const cur = read()
  if (cur) signIn({ ...cur, ...patch })
}
export function signOut() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  emit()
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb() }
  window.addEventListener('storage', onStorage)
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage) }
}
export const useSession = () => useSyncExternalStore(subscribe, read, () => null)
