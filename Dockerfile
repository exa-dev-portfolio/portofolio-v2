# ===============================
# 1️⃣ Builder
# ===============================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files only (better cache)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Nuxt
RUN npm run build


# ===============================
# 2️⃣ Runner (production)
# ===============================
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy build output, migrations, and package files
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/package*.json ./

# Install production deps only
RUN npm ci --omit=dev

EXPOSE 3000

# Auto-migrate database asynchronously in the background and start server
CMD ["sh", "-c", "export DATABASE_URL=\"${DATABASE_URL:-${NUXT_DATABASE_URL:-postgresql://${NUXT_PG_USER:-postgres}:${NUXT_PG_PASSWORD:-password}@${NUXT_PG_HOST:-localhost}:${NUXT_PG_PORT:-5432}/${NUXT_PG_DATABASE:-portfolio-v2}}}\" && (for i in 1 2 3 4 5; do npx node-pg-migrate up && break || sleep 2; done) & exec node .output/server/index.mjs"]
