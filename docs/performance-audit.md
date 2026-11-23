# Performance audit — Fartash (Nov 2026)

Source: Google PageSpeed Insights reports (mobile + desktop, Lighthouse 13.6.0). Backup before any change:
tag `backup/pre-perf-audit` (= `d0067d6`, also on the remote branch).

## Results (same nginx server, same Lighthouse 13.6.0, simulated Slow 4G, median of 3 runs)

| | Before | After |
|---|---|---|
| Mobile Performance | 85 | **96** |
| Mobile LCP | 4.28 s | **2.70 s** |
| Mobile Speed Index | 1.39 s | **1.07 s** |
| Mobile TBT / CLS | 60 ms / 0 | **0 ms / 0** |
| Desktop Performance / LCP | 99 / 0.90 s | **100 / 0.56 s** |
| First-load transfer (home) | 646 KiB | **354 KiB** |
| Accessibility | 90 | **100** (all pages) |
| SEO | 92 (live report) | **100** (`/login` intentionally `noindex`) |
| Agentic browsing | 1/4 (live report) | **100** |
| Cache audit | failing (TTL "None") | **passing** |

Local measurements are not identical to PageSpeed on the live server (network, server speed), but the
same audits that failed in the report now pass.

## Problems, root causes and fixes

| Problem (report) | Root cause | Fix |
|---|---|---|
| Mobile LCP 3.2 s, "LCP request discovery" | Client-only SPA: empty HTML, nothing discoverable until 93 KiB of JS ran | Every route prerendered to static HTML at build (`scripts/prerender.mjs`), hydrated on the client; inner pages are lazy chunks |
| Improve image delivery (216 KiB) | Both theme variants of hero (148+98 KiB) and logo downloaded; logo was a 900×228 PNG shown at ~44 px; one 733×1200 hero for all screens | Inactive theme `display:none` + lazy (never fetched); head script preloads the active theme's logo/hero; other theme fetched when idle; hero `srcset` 480/640/full (WebP q85, visually identical); logo 352×89 lossless WebP (8–11 KiB) |
| Enormous payload (10.7 MB), video | Video + poster loaded with the page; server apparently doesn't serve byte ranges, so the whole MP4 was downloaded | Video/poster attach only ~1 screen before the section; 720p (6 MB) for ≤900 px / Data Saver, 1080p otherwise; WebP posters (9/18 KiB vs 36 KiB) |
| Cache TTL "None" on every file | No Cache-Control from the server; images in `public/` had fixed names (unsafe to cache long) | All assets imported → content-hashed names; configs for nginx / Apache (.htaccess) / Netlify / Cloudflare / Vercel: `/assets/*` 1 year immutable, HTML `no-cache` (see `deploy/README.md`) |
| Render-blocking CSS, network dependency tree | HTML → CSS → layout → font chain; fonts requested only after layout | Critical CSS inlined per page (beasties), full sheet loaded async; both needed Vazirmatn subsets preloaded; `@font-face` inlined (family is set via `var(--font)`) |
| (found) ~95 KiB carousel photos in the initial load | Chrome widens native lazy-load distance on slow/unknown connections | Carousel photos attach when the carousel is ~1 screen away |
| Unsized images | Missing `width`/`height` | Added to every content image |
| robots.txt invalid, ARD manifest invalid | No robots.txt; SPA fallback answered machine-readable URLs with HTML | `robots.txt` + `sitemap.xml` generated at build; `/.well-known/*` → 404 |
| Accessibility 90 | Star rating `aria-label` without role; icon-only login link (phone) without name; muted text 3.1–3.6:1 | `role="img"`; `aria-label`; light-theme `--muted` `#7b8399` → `#61697d` (4.5–5.2:1, same hue) |
| (found) Scroll-to-top stopped ~11 px short | Sticky header grows 12 px at the top; scroll anchoring compensated | `overflow-anchor: none` on the root scroller |

Tried and reverted: `fetchpriority="low"` on the JS bundle — no measurable LCP gain.

## Verification

- `npm run build` (type-check + client build + SSR build + prerender) — clean.
- Hydration: no errors/warnings on all routes, both themes, with and without trailing slash (`scripts/hydration-check.cjs`).
- Visual regression: 20 full-page snapshots (5 pages × 2 themes × desktop/phone) vs baseline. Only differences:
  logo resampling, hero re-encode (indistinguishable at 2× zoom) and the darker muted text color.
- Critical CSS: with the external stylesheet blocked, first paint is pixel-identical to the full render on all 20 combinations (`scripts/critcheck.cjs`).
- Network: one request per image, only the active theme on first load (`scripts/netcheck.cjs`).
- Accessibility: axe-core WCAG 2 A/AA, 0 violations on all 20 combinations (`scripts/axe.cjs`).
- Interactions: 54/54 end-to-end checks, two consecutive runs (`scripts/e2e.cjs`).
- Server configs: nginx 1.24 and Apache 2.4 tested (headers, routes, 404s, gzip, HTTP 206 for video).

## Not changed / remaining

- Unused JS (~43 KiB): mostly React DOM itself, required for hydration; removing it would mean changing frameworks.
- The live server's cache headers and byte-range support depend on your hosting — use the configs in `deploy/`.
- Repeat `npm run build` with `SITE_URL=…` if the production domain is not `https://mrmdev.xyz`.
