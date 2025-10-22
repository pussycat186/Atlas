# Stage 1: Dependencies (shared layer for caching)
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/proof-messenger/package.json ./apps/proof-messenger/
COPY packages/*/package.json ./packages/*/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile --filter=@atlas/proof-messenger...

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/proof-messenger/node_modules ./apps/proof-messenger/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY apps/proof-messenger ./apps/proof-messenger
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Build workspace packages first (config, ui, etc.)
RUN pnpm --filter=@atlas/config build || true
RUN pnpm --filter=@atlas/ui-tokens build || true
RUN pnpm --filter=@atlas/design-system build || true

# Build the proof-messenger app (creates .next/standalone)
WORKDIR /app/apps/proof-messenger
RUN pnpm build

# Stage 3: Runner (minimal production image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/proof-messenger/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/proof-messenger/.next/static ./apps/proof-messenger/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/proof-messenger/public ./apps/proof-messenger/public

USER nextjs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/proof-messenger/server.js"]
