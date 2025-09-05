# ---------- runtime-only (dist-first) ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
LABEL org.opencontainers.image.source="https://github.com/pussycat186/Atlas" \
      org.opencontainers.image.title="atlas-gateway" \
      org.opencontainers.image.description="Atlas Gateway (quorum orchestrator)" \
      org.opencontainers.image.licenses="MIT"
COPY services/gateway/package.json ./
COPY services/gateway/dist ./dist
# workspace deps (compiled output already bundled via dist-first build)
COPY packages/fabric-client/package.json ./node_modules/@atlas/fabric-client/package.json
COPY packages/fabric-client/dist ./node_modules/@atlas/fabric-client/dist
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist
EXPOSE 8080
CMD ["node", "dist/index.js"]