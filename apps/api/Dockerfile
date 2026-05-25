FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN npm install -g @nestjs/cli@10

# ── Development stage (hot-reload, no build step) ─────────────────
FROM base AS dev
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma/ ./apps/api/prisma/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3000 9229
CMD ["nest", "start", "--watch"]

# ── Builder stage ──────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma/ ./apps/api/prisma/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN pnpm build

# ── Production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl && addgroup -g 1001 nodejs && adduser -S nestjs -u 1001

ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./prisma

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]
