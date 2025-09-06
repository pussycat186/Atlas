# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY services/witness-node/package-docker.json ./package.json
RUN npm install --only=production

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
LABEL org.opencontainers.image.source="https://github.com/pussycat186/Atlas" \
      org.opencontainers.image.title="atlas-witness" \
      org.opencontainers.image.description="Atlas Witness Node (attestation service)" \
      org.opencontainers.image.licenses="MIT"
COPY --from=deps /app/node_modules ./node_modules
COPY services/witness-node/package.json ./
COPY services/witness-node/dist ./dist
# workspace deps (compiled output already bundled via dist-first build)
RUN mkdir -p ./node_modules/@atlas/fabric-protocol
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist
EXPOSE 8091
CMD ["node", "dist/index.js"]