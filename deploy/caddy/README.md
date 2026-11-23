# Deploying Fartash with Docker + Caddy

The image (`Dockerfile`) builds and prerenders the site with Node 22, precompresses text assets
(Brotli + gzip) and serves the static result with **Caddy 2.11** using `deploy/caddy/Caddyfile`:

| What | How |
|---|---|
| Caching | `/assets/*` (hashed JS/CSS/fonts/images/video) `public, max-age=31536000, immutable`; HTML `no-cache`; favicons/robots/sitemap 1 day; errors `no-store` |
| Compression | prebuilt `.br` / `.gz` for HTML/CSS/JS/XML (`precompressed br gzip`), zstd/gzip on the fly for the rest |
| Prerendered routes | `/teachers` → `teachers/index.html` (no redirect), unknown paths → SPA shell |
| Video streaming | byte-range requests (HTTP 206) — built into Caddy's `file_server` |
| Other | `/.well-known/*` → 404 (Caddy still answers ACME challenges itself), `nosniff`, `Referrer-Policy`, no `Server` header |
| Health | `http://127.0.0.1:8081/index.html` inside the container (loopback only, not published) |

There are two ways to run it. **Use Mode A if a Caddy already serves ports 80/443 on the VPS.**

---

## Mode A — behind your existing Caddy (default `docker-compose.yml`)

The container joins your Caddy's Docker network and serves plain HTTP on port 80 inside that network.
Your existing Caddy keeps handling HTTPS and forwards the domain to it.

```bash
# 1. get the branch
git clone --branch fartash-performance-caddy https://github.com/mtmtest2/Newideaforfartash.git fartash
cd fartash

# 2. configuration
cp .env.example .env
#    edit .env: SITE_URL (your public URL) and CADDY_NETWORK (the network your Caddy container is on):
docker inspect <your-caddy-container> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# 3. build and start
docker compose up -d --build
docker compose ps            # wait for "(healthy)"
```

Then point your existing Caddyfile at it and reload Caddy:

```caddyfile
mrmdev.xyz, www.mrmdev.xyz {
	reverse_proxy fartash-web:80
}
```

```bash
docker exec <your-caddy-container> caddy reload --config /etc/caddy/Caddyfile
```

Notes for the existing Caddy site block:
- Don't override `Cache-Control` there — the site container sets the right value per file.
- `encode` in the outer Caddy is optional (responses are already compressed and won't be re-encoded).
- If your Caddy runs **on the host** (not in Docker), uncomment the `ports: "127.0.0.1:8080:80"` lines in
  `docker-compose.yml`, remove the `networks` sections, and use `reverse_proxy 127.0.0.1:8080`.

## Mode B — standalone (this container is the public web server)

Only when nothing else listens on 80/443. Caddy gets Let's Encrypt certificates automatically
(DNS for the domain must point at the VPS, ports 80 and 443 open).

```bash
git clone --branch fartash-performance-caddy https://github.com/mtmtest2/Newideaforfartash.git fartash
cd fartash
cp .env.example .env         # set SITE_URL and SITE_ADDRESS (e.g. "mrmdev.xyz, www.mrmdev.xyz")
docker compose -f docker-compose.standalone.yml up -d --build
```

Certificates live in the `caddy_data` volume — keep it between deploys.

---

## Environment variables (`.env`)

| Variable | Used by | Default | Meaning |
|---|---|---|---|
| `SITE_URL` | build (both modes) | `https://mrmdev.xyz` | Public URL for canonical/OG tags, `robots.txt`, `sitemap.xml`. Baked in at build time — rebuild after changing. |
| `CADDY_NETWORK` | Mode A | `caddy` | External Docker network shared with your Caddy container. |
| `SITE_ADDRESS` | Mode B | `mrmdev.xyz` | Domain(s) the container serves with automatic HTTPS (comma-separated). Mode A always uses `:80`. |
| `IMAGE_TAG` | both | `performance-caddy` | Image tag; change per release to keep the previous image for rollback. |

## Verify after deploying

```bash
D=https://mrmdev.xyz
curl -sI -H 'Accept-Encoding: br' $D/teachers | grep -iE '^HTTP|cache-control|content-encoding'
#   -> 200, Cache-Control: no-cache, Content-Encoding: br
JS=$(curl -s --compressed $D/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
curl -sI $D$JS | grep -i cache-control
#   -> public, max-age=31536000, immutable
VID=$(curl -s --compressed $D$JS | grep -oE 'fartash-intro-720-[A-Za-z0-9_-]+\.mp4' | head -1)
curl -s -o /dev/null -D - -H 'Range: bytes=0-1023' $D/assets/$VID | grep -iE '^HTTP|content-range'
#   -> 206 Partial Content, Content-Range: bytes 0-1023/...
curl -s $D/robots.txt
```

Then run PageSpeed Insights on the domain.

## Update / rollback

```bash
git pull && sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=v2/' .env && docker compose up -d --build   # update
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=performance-caddy/' .env && docker compose up -d --no-build  # roll back to the previous image
```
