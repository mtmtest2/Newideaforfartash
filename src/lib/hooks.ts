import { useCallback, useEffect, useRef, useState } from 'react'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    (document.documentElement.dataset.theme as Theme) === 'dark' ? 'dark' : 'light',
  )
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.add('theme-anim')
    root.dataset.theme = next
    setTheme(next)
    try { localStorage.setItem('fartash-theme', next) } catch { /* private mode */ }
    window.setTimeout(() => root.classList.remove('theme-anim'), 500)
  }, [theme])
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
