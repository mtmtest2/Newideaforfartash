// Demo sessions stored in the browser. There is no backend yet: replace these with real auth calls when an
// API exists. Student and teacher sessions use separate keys, so both panels can be open side by side.
// The hooks are SSR-safe (server snapshot = null) so prerendered panel pages hydrate as skeletons.
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
export type TeacherSession = { teacherId: string; name: string; phone: string; bio?: string; notifySms?: boolean; joined: string }

function store<T extends { joined: string }>(key: string, defaults: Partial<T>) {
  const listeners = new Set<() => void>()
  let cache: { raw: string | null; value: T | null } = { raw: null, value: null }
  const read = (): T | null => {
    let raw: string | null = null
    try { raw = localStorage.getItem(key) } catch { /* storage blocked */ }
    if (raw === cache.raw) return cache.value
    let value: T | null = null
    try { value = raw ? (JSON.parse(raw) as T) : null } catch { value = null }
    cache = { raw, value }
    return value
  }
  const emit = () => listeners.forEach((l) => l())
  const signIn = (s: Omit<T, 'joined'> & { joined?: string }) => {
    const value = { ...defaults, ...s, joined: s.joined ?? new Date().toISOString() }
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
    emit()
  }
  const update = (patch: Partial<T>) => { const cur = read(); if (cur) signIn({ ...cur, ...patch }) }
  const signOut = () => { try { localStorage.removeItem(key) } catch { /* ignore */ } emit() }
  const subscribe = (cb: () => void) => {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => { if (e.key === key) cb() }
    window.addEventListener('storage', onStorage)
    return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage) }
  }
  const use = () => useSyncExternalStore(subscribe, read, () => null)
  return { read, signIn, update, signOut, use }
}

const student = store<Session>('fartash-session', { notifySms: true, notifyEmail: false })
export const getSession = student.read
export const signIn = student.signIn
export const updateSession = student.update
export const signOut = student.signOut
export const useSession = student.use

const teacher = store<TeacherSession>('fartash-teacher', { notifySms: true })
export const getTeacher = teacher.read
export const signInTeacher = teacher.signIn
export const updateTeacher = teacher.update
export const signOutTeacher = teacher.signOut
export const useTeacher = teacher.use
