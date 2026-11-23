# Deploying Fartash

`npm run build` produces a fully static site in `dist/`:

- `dist/index.html`, `dist/teachers/index.html`, `dist/blog/index.html`, `dist/placement/index.html`,
  `dist/login/index.html` — prerendered pages (content is in the HTML; React hydrates it).
- `dist/assets/*` — JS, CSS, fonts, images and video with **content-hashed filenames**.

## Required server behaviour

| Path | Cache-Control | Notes |
|---|---|---|
| `/assets/*` | `public, max-age=31536000, immutable` | only on 200 responses (never cache a 404) |
| HTML (`/`, `/teachers`, …) | `no-cache` | revalidates on every visit so new deploys show immediately |
| `/favicon-*.png`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` | `public, max-age=86400` | |

- `/teachers` must serve `teachers/index.html` (no redirect needed); unknown paths fall back to `/index.html`.
- **Byte-range requests must work for `.mp4`** (HTTP 206). Without them browsers download the whole intro
  video instead of streaming it — this is what the PageSpeed report showed (10 MB transferred).
- Enable gzip or brotli for HTML, CSS, JS, JSON, SVG and XML.

## Ready-made configs (tested where noted)

- **Docker + Caddy** — `Dockerfile`, `docker-compose.yml` (behind an existing Caddy), `docker-compose.standalone.yml`,
  `deploy/caddy/Caddyfile`; full guide in **`deploy/caddy/README.md`** (tested: image build, both modes, Caddy 2.11)

- **nginx** — `deploy/nginx.conf` (tested with nginx 1.24: headers, routes, 404s, ranges, gzip)
- **Apache / cPanel** — `public/.htaccess`, copied into `dist/` by the build (tested with Apache 2.4)
- **Netlify / Cloudflare Pages** — `public/_headers` (not tested here)
- **Vercel** — `vercel.json` (not tested here)

Set `SITE_URL` when building if the site is not served from `https://mrmdev.xyz`
(used for canonical/OG URLs and the sitemap): `SITE_URL=https://example.com npm run build`.
