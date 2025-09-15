#!/bin/bash
set -euo pipefail

echo "🧹 ATLAS v12 Cleanup Script - Phase 1"
echo "======================================"

# List of files to delete (from DELETION_REPORT.md)
DELETE_FILES=(
  # Generated test files
  "cluster-server.js"
  "http2-proxy.js"
  "proxy-native.js"
  "proxy-optimized.js"
  "proxy-simple.js"
  "server-optimized.js"
  "k6-cloud-v14.js"
  "k6-hard-target-v12.6.js"
  "k6-hard-target.js"
  "k6-performance-optimized.js"
  "k6-performance-test-optimized.js"
  "k6-performance-test.js"
  "k6-v14-constant-arrival-rate.js"
  "k6-v14-dual-service-test.js"
  "k6-v14-priming-test.js"
  "tests/performance/atlas-load-test.js"
  
  # Unused React components
  "apps/web/src/components/ChatMessage.tsx"
  "apps/web/src/components/IntegrityBadge.tsx"
  "apps/web/src/components/WitnessAttestationsModal.tsx"
  "apps/web/src/components/layout/Header.tsx"
  "apps/web/src/components/layout/Navigation.tsx"
  "apps/web/src/components/ui/Textarea.tsx"
  "apps/web/src/lib/atlas-client.ts"
  
  # Generated TypeScript files
  "packages/fabric-protocol/src/api.d.ts"
  "packages/fabric-protocol/src/api.ts"
  "packages/fabric-protocol/src/index.d.ts"
  "packages/fabric-protocol/src/types.d.ts"
  "packages/fabric-protocol/src/types.ts"
  
  # CI scripts
  "scripts/ci/apply_fixes.mjs"
  "scripts/ci/parse_ci_log.mjs"
  "docs/sdk/atlas-sdk-example.js"
)

# Counters
deleted_count=0
skipped_count=0

echo "📁 Deleting unused files..."
echo ""

for file in "${DELETE_FILES[@]}"; do
  if [ -e "$file" ]; then
    echo "🗑️  Deleting: $file"
    rm -rf "$file"
    ((deleted_count++))
  else
    echo "⏭️  Skipping (not found): $file"
    ((skipped_count++))
  fi
done

echo ""
echo "📊 Cleanup Summary:"
echo "  - Files deleted: $deleted_count"
echo "  - Files skipped: $skipped_count"
echo "  - Total processed: ${#DELETE_FILES[@]}"

echo ""
echo "✅ Cleanup script completed successfully!"
echo "💡 Note: OpenTelemetry dependencies will be re-added in Phase 3"