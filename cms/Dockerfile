# syntax=docker/dockerfile:1
# Fartash CMS (Support Dashboard + content API). Next.js standalone output on Node 22.

# ---- build (also used as the one-off "tools" image: migrations, seed, create-support-admin) ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# next build needs a syntactically valid config; no database connection is made at build time
RUN PAYLOAD_SECRET=build-only-placeholder-0123456789abcdef0123 DATABASE_URL=postgres://build:build@localhost:5432/build NODE_ENV=production npx next build

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0 MEDIA_DIR=/data/media PRIVATE_FILES_DIR=/data/private
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
RUN mkdir -p /data/media /data/private && chown -R node:node /data
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
