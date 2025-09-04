FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm -v && pnpm install --frozen-lockfile --prefer-offline

FROM deps AS build
ENV NODE_ENV=development
COPY . .
RUN pnpm -r build || pnpm build || true

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/services/witness-node/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY services/witness-node/package.json ./package.json
EXPOSE 8091
CMD ["node", "dist/server.js"]
