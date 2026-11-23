# syntax=docker/dockerfile:1
# Fartash — production image: build + prerender with Node, serve the static output with Caddy.

# ---- build ---------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install exactly what the lockfile says (cached unless package*.json change)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Public URL of the site: used for canonical/OG tags, robots.txt and sitemap.xml
ARG SITE_URL=https://mrmdev.xyz
ENV SITE_URL=${SITE_URL}

# type-check + client build + SSR build + prerender every route, then precompress text assets (.br/.gz)
RUN npm run build && node scripts/precompress.mjs dist

# ---- serve ---------------------------------------------------------------------------------
FROM caddy:2.11-alpine
COPY deploy/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
EXPOSE 80 443 443/udp
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q --spider http://127.0.0.1:8081/index.html || exit 1
