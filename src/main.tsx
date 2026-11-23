import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/vazirmatn'
import './styles.css'
import App from './App'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
// Production pages are prerendered per route (scripts/prerender.mjs). Hydrate only when the markup belongs to
// this URL: a server that falls back to index.html for /teachers would otherwise hydrate the wrong page.
const path = location.pathname.replace(/\/+$/, '') || '/'
if (container.firstElementChild && container.dataset.route === path) hydrateRoot(container, app)
else {
  container.textContent = ''
  createRoot(container).render(app)
}
