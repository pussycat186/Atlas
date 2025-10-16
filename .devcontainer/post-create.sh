#!/bin/bash
set -euo pipefail

echo "🚀 Atlas Codespace Post-Create Setup"
echo "Node: $(node --version)"
echo "Working in: $(pwd)"

# Install pnpm globally with specific version
echo "📦 Installing pnpm 9..."
npm install -g pnpm@9

# Verify pnpm installation
echo "pnpm: $(pnpm --version)"

# Install workspace dependencies
echo "📥 Installing Atlas workspace dependencies..."
pnpm install --frozen-lockfile

# Install Playwright browsers (for security testing)
echo "🎭 Installing Playwright browsers..."
pnpm exec playwright install --with-deps

# Install k6 for performance testing
echo "⚡ Installing k6..."
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Install Vercel CLI
echo "▲ Installing Vercel CLI..."
pnpm add -g vercel@latest

# Verify installations
echo ""
echo "✅ Installation Summary:"
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Playwright: $(pnpm exec playwright --version)"
echo "k6: $(k6 --version)"
echo "Vercel: $(vercel --version)"

# Set up git config for Codespace
git config --global user.name "Atlas Codespace"
git config --global user.email "atlas@codespace.local" 

# Create evidence directory structure
mkdir -p docs/evidence
mkdir -p tools/net-diagnose

echo ""
echo "🎯 Atlas Codespace Ready!"
echo "Run 'pnpm dev' to start development servers"
echo "Run 'pnpm build' to build all applications"
echo "Run 'pnpm test' to run quality gates"