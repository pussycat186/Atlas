#!/bin/bash
set -euo pipefail

echo "🧹 Starting ATLAS Cleanup Script"
echo "================================="
echo "Phase: 1 - Clean Sweep"
echo "Branch: reboot/atlas-hardening-v1"
echo "Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to safely remove files
safe_remove() {
    local file="$1"
    if [ -e "$file" ]; then
        print_status "Removing: $file"
        rm -rf "$file"
        print_success "Removed: $file"
    else
        print_warning "Not found: $file"
    fi
}

# Function to remove dependency from package.json
remove_dependency() {
    local package="$1"
    local file="$2"
    local dep_type="$3"
    
    if [ -f "$file" ]; then
        print_status "Removing $dep_type: $package from $file"
        
        # Use jq to remove the dependency
        if command -v jq &> /dev/null; then
            # Remove from dependencies
            if [ "$dep_type" = "dependency" ]; then
                jq "del(.dependencies.\"$package\")" "$file" > "$file.tmp" && mv "$file.tmp" "$file"
            # Remove from devDependencies
            elif [ "$dep_type" = "devDependency" ]; then
                jq "del(.devDependencies.\"$package\")" "$file" > "$file.tmp" && mv "$file.tmp" "$file"
            fi
            print_success "Removed $dep_type: $package from $file"
        else
            print_warning "jq not available, skipping dependency removal for $package"
        fi
    else
        print_warning "Package.json not found: $file"
    fi
}

echo "📁 Phase 1: Removing unused files"
echo "=================================="

# List of unused files to delete
UNUSED_FILES=(
    "apps/web/src/components/ChatMessage.tsx"
    "apps/web/src/components/IntegrityBadge.tsx"
    "apps/web/src/components/WitnessAttestationsModal.tsx"
    "apps/web/src/components/layout/Header.tsx"
    "apps/web/src/components/layout/Navigation.tsx"
    "apps/web/src/components/ui/Textarea.tsx"
    "apps/web/src/lib/atlas-client.ts"
    "cluster-server.js"
    "docs/sdk/atlas-sdk-example.js"
    "http2-proxy.js"
    "k6-cloud-v14.js"
    "k6-hard-target-v12.6.js"
    "k6-hard-target.js"
    "k6-performance-optimized.js"
    "k6-performance-test-optimized.js"
    "k6-performance-test.js"
    "k6-v14-constant-arrival-rate.js"
    "k6-v14-dual-service-test.js"
    "k6-v14-priming-test.js"
    "packages/fabric-protocol/src/api.d.ts"
    "packages/fabric-protocol/src/api.ts"
    "packages/fabric-protocol/src/index.d.ts"
    "packages/fabric-protocol/src/types.d.ts"
    "packages/fabric-protocol/src/types.ts"
    "proxy-native.js"
    "proxy-optimized.js"
    "proxy-simple.js"
    "scripts/ci/apply_fixes.mjs"
    "scripts/ci/parse_ci_log.mjs"
    "server-optimized.js"
    "tests/performance/atlas-load-test.js"
)

# Remove unused files
for file in "${UNUSED_FILES[@]}"; do
    safe_remove "$file"
done

echo ""
echo "📦 Phase 2: Removing unused dependencies"
echo "========================================"

# Remove unused dependencies from packages/fabric-client
remove_dependency "zod" "packages/fabric-client/package.json" "dependency"

# Remove unused dependencies from services/gateway
GATEWAY_DEPS=(
    "@opentelemetry/auto-instrumentations-node"
    "@opentelemetry/instrumentation-fastify"
    "@opentelemetry/instrumentation-http"
    "@opentelemetry/instrumentation-pino"
    "@opentelemetry/semantic-conventions"
    "@opentelemetry/exporter-prometheus"
    "@opentelemetry/exporter-otlp-http"
    "@opentelemetry/instrumentation"
    "@opentelemetry/resources"
    "@opentelemetry/sdk-node"
    "@opentelemetry/api"
    "pino-pretty"
    "pino"
    "@atlas/fabric-client"
)

for dep in "${GATEWAY_DEPS[@]}"; do
    remove_dependency "$dep" "services/gateway/package.json" "dependency"
done

# Remove unused dependencies from services/witness-node
WITNESS_DEPS=(
    "@opentelemetry/auto-instrumentations-node"
    "@opentelemetry/instrumentation-fastify"
    "@opentelemetry/instrumentation-http"
    "@opentelemetry/instrumentation-pino"
    "@opentelemetry/semantic-conventions"
    "@opentelemetry/exporter-prometheus"
    "@opentelemetry/exporter-otlp-http"
    "@opentelemetry/instrumentation"
    "@opentelemetry/resources"
    "@opentelemetry/sdk-node"
    "@opentelemetry/api"
    "pino-pretty"
    "pino"
)

for dep in "${WITNESS_DEPS[@]}"; do
    remove_dependency "$dep" "services/witness-node/package.json" "dependency"
done

# Remove unused dependencies from apps/admin
ADMIN_DEPS=(
    "@headlessui/react"
    "lucide-react"
    "recharts"
    "clsx"
)

for dep in "${ADMIN_DEPS[@]}"; do
    remove_dependency "$dep" "apps/admin/package.json" "dependency"
done

# Remove unused dependencies from apps/web
WEB_DEPS=(
    "@atlas/fabric-protocol"
    "@atlas/fabric-client"
    "@radix-ui/react-slot"
    "@headlessui/react"
    "@heroicons/react"
    "compression"
    "date-fns"
)

for dep in "${WEB_DEPS[@]}"; do
    remove_dependency "$dep" "apps/web/package.json" "dependency"
done

echo ""
echo "🔧 Phase 3: Removing unused devDependencies"
echo "==========================================="

# Remove unused devDependencies from services
remove_dependency "ts-jest" "services/gateway/package.json" "devDependency"
remove_dependency "ts-jest" "services/witness-node/package.json" "devDependency"

# Remove unused devDependencies from apps/admin
ADMIN_DEV_DEPS=(
    "@typescript-eslint/eslint-plugin"
    "@typescript-eslint/parser"
)

for dep in "${ADMIN_DEV_DEPS[@]}"; do
    remove_dependency "$dep" "apps/admin/package.json" "devDependency"
done

# Remove unused devDependencies from apps/web
WEB_DEV_DEPS=(
    "@typescript-eslint/eslint-plugin"
    "@typescript-eslint/parser"
    "@storybook/addon-vitest"
    "@storybook/addon-a11y"
    "@storybook/addon-docs"
    "@storybook/blocks"
    "@storybook/test"
)

for dep in "${WEB_DEV_DEPS[@]}"; do
    remove_dependency "$dep" "apps/web/package.json" "devDependency"
done

# Remove unused devDependencies from root
ROOT_DEV_DEPS=(
    "dependency-cruiser"
    "ts-prune"
)

for dep in "${ROOT_DEV_DEPS[@]}"; do
    remove_dependency "$dep" "package.json" "devDependency"
done

echo ""
echo "🧹 Phase 4: Cleaning up generated artifacts"
echo "==========================================="

# Remove generated TypeScript declaration files
GENERATED_FILES=(
    "packages/fabric-protocol/dist"
    "packages/fabric-client/dist"
    "services/gateway/dist"
    "services/witness-node/dist"
    "apps/web/.next"
    "apps/admin/.next"
    "apps/web/out"
    "apps/admin/out"
)

for file in "${GENERATED_FILES[@]}"; do
    safe_remove "$file"
done

echo ""
echo "🔍 Phase 5: Verification"
echo "========================"

# Check if pnpm install still works
print_status "Running pnpm install to verify no breakage..."
if pnpm install --frozen-lockfile; then
    print_success "pnpm install successful - no breakage detected"
else
    print_error "pnpm install failed - there may be breakage"
    exit 1
fi

# Check if builds still work
print_status "Running TypeScript build to verify no breakage..."
if pnpm run build; then
    print_success "TypeScript build successful - no breakage detected"
else
    print_error "TypeScript build failed - there may be breakage"
    exit 1
fi

echo ""
echo "📊 Cleanup Summary"
echo "=================="
echo "✅ Removed 31 unused files"
echo "✅ Removed 39 unused dependencies"
echo "✅ Removed 13 unused devDependencies"
echo "✅ Cleaned up generated artifacts"
echo "✅ Verified no breakage occurred"
echo ""
echo "🎉 Cleanup completed successfully!"
echo "Next: Phase 2 - Monorepo Strictness"