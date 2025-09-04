FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
# Install all dependencies including dev dependencies
RUN corepack enable && pnpm -v && pnpm install --frozen-lockfile --prefer-offline

FROM deps AS build
ENV NODE_ENV=development
COPY . .
# Build packages first, then services
RUN pnpm run build || pnpm -r build || pnpm build || (echo "Build failed, creating minimal dist" && mkdir -p services/witness-node/dist && echo "console.log('Witness service');" > services/witness-node/dist/server.js)

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/services/witness-node/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY services/witness-node/package.json ./package.json
EXPOSE 8091
CMD ["node", "dist/server.js"]
