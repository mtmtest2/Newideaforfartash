// Which CMS public-API resource feeds which site route. Shared by the SSR server and the client.
// null = the route needs no CMS data beyond the site chrome (or is not a content route at all).
const RESERVED = new Set(['login', 'placement', 'panel', 'teacher', 'reception', 'assets', '__data', '__revalidate', 'support', 'api'])

export function resourceFor(pathname: string, search = ''): string | null {
  const p = pathname.replace(/\/+$/, '') || '/'
  const qs = new URLSearchParams(search)
  if (p === '/') return '/home'
  if (p === '/teachers') return '/teachers'
  if (p === '/magazine') {
    const q = new URLSearchParams()
    for (const k of ['page', 'category', 'tag']) { const v = qs.get(k); if (v) q.set(k, v) }
    return '/articles' + (q.size ? `?${q}` : '')
  }
  if (p === '/events') return '/events'
  if (p === '/courses') return '/courses'
  let m: RegExpMatchArray | null
  if ((m = p.match(/^\/teachers\/([^/]+)$/))) return `/teachers/${m[1]}`
  if ((m = p.match(/^\/magazine\/([^/]+)$/))) return `/articles/${m[1]}`
  if ((m = p.match(/^\/events\/([^/]+)$/))) return `/events/${m[1]}`
  if ((m = p.match(/^\/languages\/([^/]+)$/))) return `/languages/${m[1]}`
  if ((m = p.match(/^\/courses\/([^/]+)$/))) return `/courses/${m[1]}`
  if ((m = p.match(/^\/([^/]+)$/)) && !RESERVED.has(m[1])) return `/pages/${m[1]}`
  return null
}
/** Key used to store a route's data (path + the query that changes the data). */
export const routeKey = (pathname: string, search = '') => resourceFor(pathname, search) ?? (pathname.replace(/\/+$/, '') || '/')
