#!/bin/bash
set -e

echo "Building Atlas packages in dependency order..."

# Build packages first
echo "Building @atlas/fabric-protocol..."
cd packages/fabric-protocol
pnpm build
cd ../..

echo "Building @atlas/fabric-client..."
cd packages/fabric-client
pnpm build
cd ../..

# Build services
echo "Building services..."
cd services/gateway
pnpm build
cd ../..

cd services/witness-node
pnpm build
cd ../..

# Build apps
echo "Building apps..."
cd apps/web
pnpm build
cd ../..

cd apps/admin
pnpm build
cd ../..

echo "Build completed successfully!"
