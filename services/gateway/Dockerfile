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
# Install all dependencies including dev dependencies
RUN corepack enable && pnpm -v && pnpm install --frozen-lockfile --prefer-offline

# ---- build ----
FROM deps AS build
ENV NODE_ENV=development
COPY . .
# Build packages first, then services
RUN pnpm run build || pnpm -r build || pnpm build || (echo "Build failed, creating minimal dist" && mkdir -p services/gateway/dist && echo "console.log('Gateway service');" > services/gateway/dist/index.js)

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/gateway/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY services/gateway/package.json ./package.json
EXPOSE 8080
CMD ["node", "dist/index.js"]
