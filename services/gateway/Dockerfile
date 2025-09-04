# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
# enable corepack & pin pnpm from packageManager
RUN corepack enable

# ---- deps ----
FROM base AS deps
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
# if workspace: copy only gateway package + lock for partial install
# (for simplicity, install in place)
RUN corepack enable && pnpm -v && pnpm install --frozen-lockfile --prefer-offline

# ---- build ----
FROM deps AS build
ENV NODE_ENV=development
COPY . .
RUN pnpm -r build || pnpm build || true

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/gateway/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY services/gateway/package.json ./package.json
EXPOSE 8080
CMD ["node", "dist/index.js"]
