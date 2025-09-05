FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
LABEL org.opencontainers.image.source="https://github.com/pussycat186/Atlas" \
      org.opencontainers.image.title="atlas-witness" \
      org.opencontainers.image.description="Atlas Witness Node (append-only ledger)" \
      org.opencontainers.image.licenses="MIT"
COPY services/witness-node/package.json ./
COPY services/witness-node/dist ./dist
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist
EXPOSE 8091
CMD ["node", "dist/index.js"]