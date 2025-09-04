FROM node:20-alpine AS artifacts
WORKDIR /app
# copy the service package.json and built dist
COPY services/witness-node/package.json ./
COPY services/witness-node/dist ./dist
# copy the full node_modules from the monorepo (includes external deps like fastify)
COPY node_modules ./node_modules
# copy workspace packages
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# copy everything from artifacts stage
COPY --from=artifacts /app/node_modules ./node_modules
COPY --from=artifacts /app/package.json ./package.json
COPY --from=artifacts /app/dist ./dist
EXPOSE 8091
CMD ["node", "dist/server.js"]