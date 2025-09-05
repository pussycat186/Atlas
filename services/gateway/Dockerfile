# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY services/gateway/package.json ./package.json
RUN echo '{"dependencies":{"fastify":"^4.24.3","@fastify/cors":"^8.4.0","@fastify/websocket":"^8.3.1","pino":"^8.17.0","pino-pretty":"^10.3.1","uuid":"^9.0.1"}}' > temp-package.json && \
    mv temp-package.json package.json
RUN npm install --only=production

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
LABEL org.opencontainers.image.source="https://github.com/pussycat186/Atlas" \
      org.opencontainers.image.title="atlas-gateway" \
      org.opencontainers.image.description="Atlas Gateway (quorum orchestrator)" \
      org.opencontainers.image.licenses="MIT"
COPY --from=deps /app/node_modules ./node_modules
COPY services/gateway/package.json ./
COPY services/gateway/dist ./dist
# workspace deps (compiled output already bundled via dist-first build)
RUN mkdir -p ./node_modules/@atlas/fabric-client ./node_modules/@atlas/fabric-protocol
COPY packages/fabric-client/package.json ./node_modules/@atlas/fabric-client/package.json
COPY packages/fabric-client/dist ./node_modules/@atlas/fabric-client/dist
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist
EXPOSE 8080
CMD ["node", "dist/index.js"]