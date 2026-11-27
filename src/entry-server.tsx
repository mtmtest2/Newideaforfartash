import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import App from './App'
import { ContentProvider } from './content/context'
import type { SiteDTO } from './content/types'
export { resourceFor, routeKey } from './content/routes'
export { THEME_PRELOADS } from './assets'
export { CONTACT } from './components/Footer'

type Initial = { site: SiteDTO; routes: Record<string, unknown>; preview?: boolean }

/** Render a route to HTML (build-time prerender and the runtime server). Waits for lazy route chunks so their markup
 *  is included. Without `initial` the built-in fallback content is used. */
export async function render(url: string, initial?: Initial): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <ContentProvider initial={initial}>
          <App />
        </ContentProvider>
      </StaticRouter>
    </StrictMode>,
  )
  let html = ''
  for await (const chunk of prelude) html += chunk
  return html
}
