# v11.5 fix: two-stage build for witness with OTel deps
FROM node:20-alpine AS deps
WORKDIR /app
# Use container-friendly dependency manifest (must include OTel deps)
COPY services/witness-node/package-docker.json ./package.json
RUN npm install --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# bring node_modules
COPY --from=deps /app/node_modules ./node_modules
# app bits
COPY services/witness-node/package.json ./
COPY services/witness-node/dist ./dist
# inline copy of fabric-protocol (no workspace in container)
RUN mkdir -p ./node_modules/@atlas/fabric-protocol
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist
# runtime
EXPOSE 8091
CMD ["node","dist/index.js"]
