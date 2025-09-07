FROM node:20-alpine AS deps
WORKDIR /app
COPY services/witness-node/package-docker.json ./package.json
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/witness-node/package.json ./
COPY services/witness-node/dist ./dist
# Copy fabric-protocol if needed
RUN mkdir -p ./node_modules/@atlas/fabric-protocol
COPY packages/fabric-protocol/package.json ./node_modules/@atlas/fabric-protocol/package.json
COPY packages/fabric-protocol/dist ./node_modules/@atlas/fabric-protocol/dist
CMD ["node", "dist/index.js"]
