import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

// The theme lives on <html data-theme> (set by the inline script in index.html before first paint).
// Reading it through useSyncExternalStore keeps prerendering safe (server snapshot = light) and keeps
// every toggle on the page in sync.
const subscribeTheme = (cb: () => void) => {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
const getTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
const getServerTheme = (): Theme => 'light'

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme)
  const toggle = useCallback(() => {
    const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.add('theme-anim')
    root.dataset.theme = next
    try { localStorage.setItem('fartash-theme', next) } catch { /* private mode */ }
    window.setTimeout(() => root.classList.remove('theme-anim'), 500)
  }, [])
  return { theme, toggle }
}

/** Cycles 0..count-1 every `ms`; restarts the timer whenever the index changes. */
export function useAutoplay(count: number, ms: number, paused = false) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (paused || count < 2) return
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), ms)
    return () => window.clearTimeout(id)
  }, [index, count, ms, paused])
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])
  return { index, go, next: () => go(index + 1), prev: () => go(index - 1) }
}

/** Adds `.in` once the element scrolls into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets: HTMLElement[] = el.classList.contains('rv') ? [el] : []
    el.querySelectorAll<HTMLElement>('.rv').forEach((t) => targets.push(t))
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
  return ref
}
