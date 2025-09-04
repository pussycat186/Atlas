# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# ---------- deps ----------
FROM base AS deps
# copy service package.json for dependency installation
COPY services/witness-node/package.json ./package.json
# create a simple package.json with only external dependencies (no workspace deps)
RUN echo '{"dependencies":{"fastify":"^4.24.3","@fastify/cors":"^8.4.0","pino":"^8.17.0","pino-pretty":"^10.3.1","fs-extra":"^11.2.0","uuid":"^9.0.1"}}' > temp-package.json && \
    mv temp-package.json package.json
# install only external dependencies with npm (simpler than pnpm for production)
RUN npm install --only=production

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# copy external dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# copy built service files
COPY services/witness-node/package.json ./package.json
COPY services/witness-node/dist ./dist
# copy workspace packages manually
RUN mkdir -p ./node_modules/@atlas/fabric-protocol
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist
EXPOSE 8091
CMD ["node", "dist/index.js"]