# ---------- build-artifacts stage (copy built artifacts and dependencies) ----------
FROM node:20-alpine AS artifacts
WORKDIR /app
# copy the service package.json and built dist
COPY services/gateway/package.json ./
COPY services/gateway/dist ./dist
# copy the full node_modules from the monorepo (includes external deps like fastify)
COPY node_modules ./node_modules
# copy workspace packages
COPY packages/fabric-client/package.json ./node_modules/@atlas/fabric-client/package.json
COPY packages/fabric-client/dist ./node_modules/@atlas/fabric-client/dist
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# copy everything from artifacts stage
COPY --from=artifacts /app/node_modules ./node_modules
COPY --from=artifacts /app/package.json ./package.json
COPY --from=artifacts /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]