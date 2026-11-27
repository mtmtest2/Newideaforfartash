// Content store for the public site. The server embeds the site chrome + the current route's data in the page
// (<script id="__content">); client-side navigation loads other routes from the web server (/__data), which proxies
// the CMS with its server-side key (the browser never talks to the CMS directly).
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { FALLBACK_SITE, fallbackFor } from './fallback'
import { resourceFor, routeKey } from './routes'
import type { RoutePayload, SiteDTO } from './types'

/** Static hosting (old Caddy image, `vite preview`): pages carry no embedded content and there is no /__data. */
const STATIC_MODE = typeof document !== 'undefined' && !document.getElementById('__content')

type Store = { site: SiteDTO; routes: Record<string, unknown>; preview?: boolean }
type Ctx = { store: Store; setRoute: (key: string, data: unknown, site?: SiteDTO) => void }
const ContentContext = createContext<Ctx>({ store: { site: FALLBACK_SITE, routes: {} }, setRoute: () => {} })

export function ContentProvider({ initial, children }: { initial?: Store; children: ReactNode }) {
  const [store, setStore] = useState<Store>(initial ?? { site: FALLBACK_SITE, routes: {} })
  const setRoute = (key: string, data: unknown, site?: SiteDTO) => setStore((s) => ({ ...s, site: site ?? s.site, routes: { ...s.routes, [key]: data } }))
  return <ContentContext.Provider value={{ store, setRoute }}>{children}</ContentContext.Provider>
}

/** Reads the embedded payload written by the server (or nothing on a static/fallback page). */
export function readEmbedded(): Store | undefined {
  if (typeof document === 'undefined') return undefined
  const el = document.getElementById('__content')
  if (!el?.textContent) return undefined
  try {
    const p = JSON.parse(el.textContent) as RoutePayload & { key: string }
    return { site: p.site, routes: p.data === undefined ? {} : { [p.key]: p.data }, preview: p.preview }
  } catch { return undefined }
}

export const useSite = () => useContext(ContentContext).store.site
export const useIsPreview = () => !!useContext(ContentContext).store.preview

export type RouteState<T> = { status: 'ready'; data: T } | { status: 'loading' } | { status: 'missing' } | { status: 'error' }

/** Data for the current route: embedded by the server, loaded from /__data on client navigation, or the built-in fallback. */
export function useRouteData<T>(): RouteState<T> {
  const { pathname, search } = useLocation()
  const { store, setRoute } = useContext(ContentContext)
  const resource = resourceFor(pathname, search)
  const key = routeKey(pathname, search)
  const have = store.routes[key]
  const [state, setState] = useState<'idle' | 'loading' | 'missing' | 'error'>('idle')

  useEffect(() => {
    if (have !== undefined || !resource || store.preview) return
    if (STATIC_MODE) { const fb = fallbackFor(resource); if (fb !== undefined) setRoute(key, fb); else setState('missing'); return }
    let alive = true
    setState('loading')
    fetch(`/__data?path=${encodeURIComponent(pathname + search)}`, { headers: { accept: 'application/json' } })
      .then(async (r) => {
        if (!alive) return
        if (r.status === 404) return setState('missing')
        if (!r.ok) throw new Error(String(r.status))
        const p = (await r.json()) as RoutePayload
        setRoute(key, p.data, p.site)
        setState('idle')
      })
      .catch(() => {
        if (!alive) return
        const fb = fallbackFor(resource) // static hosting / dev without the content server
        if (fb !== undefined) { setRoute(key, fb); setState('idle') } else setState('error')
      })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (have === null) return { status: 'missing' } // the server answered 404 for this route
  if (have !== undefined) return { status: 'ready', data: have as T }
  if (!resource) return { status: 'missing' }
  const fb = typeof window === 'undefined' || state === 'idle' ? fallbackFor(resource) : undefined
  if (fb !== undefined && state !== 'loading') return { status: 'ready', data: fb as T }
  return state === 'missing' ? { status: 'missing' } : state === 'error' ? { status: 'error' } : { status: 'loading' }
}
