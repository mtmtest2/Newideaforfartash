// Turns rendered app HTML into a complete page: head tags, theme/logo/hero preloads, font preloads, inline
// @font-face, critical CSS (beasties) and the embedded content payload. Shared by the build-time prerender
// (scripts/prerender.mjs) and the runtime content server (server/index.mjs) so both produce the same markup.
import fs from 'node:fs'
import path from 'node:path'
import Beasties from 'beasties'

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const LS = new RegExp('\\u2028', 'g'), PS = new RegExp('\\u2029', 'g')
const jsonScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(LS, '\\u2028').replace(PS, '\\u2029')

export function createPageBuilder({ dist, THEME_PRELOADS }) {
  const template = fs.readFileSync(path.join(dist, 'index.template.html'), 'utf8')
  // Inline (in the theme script, which already knows the theme before first paint): preload the active
  // theme's logo on every page and its hero on the home page, with the same srcset/sizes as the <img>.
  const preloadJs = (isHome) => `var P=${JSON.stringify({ logo: THEME_PRELOADS.logo, hero: isHome ? THEME_PRELOADS.hero : null })};` +
    `var pl=function(o){var l=document.createElement('link');l.rel='preload';l.as='image';l.fetchPriority='high';` +
    `if(typeof o==='string'){l.href=o}else{l.setAttribute('imagesrcset',o.srcset);l.setAttribute('imagesizes',o.sizes)}document.head.appendChild(l)};` +
    `pl(P.logo[t]);if(P.hero)pl(P.hero[t]);`
  // Both Vazirmatn subsets are needed for first paint (the Arabic-script subset has no space/basic punctuation).
  const assetFiles = fs.readdirSync(path.join(dist, 'assets'))
  const fontFiles = ['arabic', 'latin'].map((sub) => assetFiles.find((f) => new RegExp(`^vazirmatn-${sub}-wght-normal-.*\\.woff2$`).test(f)))
  if (fontFiles.some((f) => !f)) throw new Error('Vazirmatn woff2 files not found in dist/assets')
  const fontPreload = fontFiles.map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`).join('\n    ')
  // The font family is applied through var(--font), which beasties can't trace: inline the @font-face rules.
  const cssFile = assetFiles.find((f) => /^index-.*\.css$/.test(f))
  const fontFaces = (fs.readFileSync(path.join(dist, 'assets', cssFile), 'utf8').match(/@font-face\{[^}]*\}/g) || [])
    .map((r) => r.replace(/url\((['"]?)(?:\.\/|\/assets\/|assets\/)?([^)'"]+\.woff2)\1\)/g, 'url(/assets/$2)')).join('')
  if (!fontFaces.includes('vazirmatn-arabic')) throw new Error('could not extract @font-face rules')
  // Critical CSS: inline the rules each page needs for first paint; load the full stylesheet without blocking.
  const beasties = new Beasties({
    path: dist, publicPath: '/', preload: 'swap', noscriptFallback: true, inlineFonts: true, preloadFonts: false,
    keyframes: 'critical', allowRules: [/data-theme/, /theme-anim/, /prefers-reduced-motion/], logLevel: 'warn',
  })

  /**
   * @param {{ url: string, route: string, app: string, title: string, description: string, canonical: string, noindex?: boolean,
   *           image?: string|null, type?: string, jsonLd?: object[], payload?: object|null }} p
   */
  return async function buildPage(p) {
    // React 19 hoists a <link rel=preload as=image> for every eager <img>; the page declares its own preloads.
    const app = p.app.replace(/<link rel="preload" as="image"[^>]*\/>/g, '')
    const head = [
      `<title>${esc(p.title)}</title>`,
      `<meta name="description" content="${esc(p.description)}" />`,
      `<link rel="canonical" href="${esc(p.canonical)}" />`,
      p.noindex ? '<meta name="robots" content="noindex" />' : '',
      `<meta property="og:type" content="${esc(p.type ?? 'website')}" />`,
      `<meta property="og:locale" content="fa_IR" />`,
      `<meta property="og:site_name" content="فرتاش" />`,
      `<meta property="og:title" content="${esc(p.ogTitle ?? p.title)}" />`,
      `<meta property="og:description" content="${esc(p.ogDescription ?? p.description)}" />`,
      `<meta property="og:url" content="${esc(p.canonical)}" />`,
      p.image ? `<meta property="og:image" content="${esc(p.image)}" />\n    <meta name="twitter:card" content="summary_large_image" />` : '<meta name="twitter:card" content="summary" />',
      fontPreload,
      ...(p.jsonLd ?? []).map((j) => `<script type="application/ld+json">${jsonScript(j)}</script>`),
    ].filter(Boolean).join('\n    ')
    const data = p.payload ? `<script id="__content" type="application/json">${jsonScript(p.payload)}</script>` : ''
    let html = template
      .replace(/<title>[\s\S]*?<\/title>\s*/, '')
      .replace(/<meta name="description"[^>]*>\s*/, '')
      .replace('<!--head-->', head)
      .replace('/*__THEME_PRELOADS__*/', preloadJs(p.route === '/'))
      .replace('<div id="root"></div>', () => `<div id="root" data-route="${esc(p.route)}">${app}</div>${data}`)
    if (!html.includes('data-route=')) throw new Error('root placeholder not found in the page template')
    html = await beasties.process(html)
    // Added after beasties so it isn't merged with the critical <style> (noscript content is ignored with JS on).
    html = html.replace('</head>', `<style>${fontFaces}</style>\n</head>`)
    html = html.replace('</head>', '<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>\n</head>')
    return html
  }
}
