import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import App from './App'
export { THEME_PRELOADS } from './assets'
export { CONTACT } from './components/Footer'

/** Render a route to HTML at build time. Waits for lazy route chunks so their markup is included. */
export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  let html = ''
  for await (const chunk of prelude) html += chunk
  return html
}
