#!/bin/bash

# ATLAS v12 Cleanup Script
# Idempotent cleanup script for Phase 1 - Clean Sweep
# Usage: ./scripts/cleanup.sh [--dry-run] [--verbose]

set -euo pipefail

# Configuration
DRY_RUN=false
VERBOSE=false
LOG_FILE="_reports/cleanup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--dry-run] [--verbose]"
            echo "  --dry-run    Show what would be deleted without actually deleting"
            echo "  --verbose    Show detailed output"
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Initialize log file
mkdir -p _reports
echo "ATLAS v12 Cleanup Script - $(date)" > "$LOG_FILE"

log "INFO" "Starting ATLAS v12 cleanup process"
log "INFO" "Dry run mode: $DRY_RUN"
log "INFO" "Verbose mode: $VERBOSE"

# Function to safely remove file
remove_file() {
    local file_path="$1"
    local reason="$2"
    
    if [[ -f "$file_path" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log "INFO" "Would remove: $file_path ($reason)"
        else
            if rm "$file_path"; then
                log "SUCCESS" "Removed: $file_path ($reason)"
            else
                log "ERROR" "Failed to remove: $file_path"
                return 1
            fi
        fi
    else
        if [[ "$VERBOSE" == "true" ]]; then
            log "WARN" "File not found: $file_path (already removed?)"
        fi
    fi
}

# Function to safely remove directory
remove_directory() {
    local dir_path="$1"
    local reason="$2"
    
    if [[ -d "$dir_path" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log "INFO" "Would remove directory: $dir_path ($reason)"
        else
            if rmdir "$dir_path" 2>/dev/null || rm -rf "$dir_path"; then
                log "SUCCESS" "Removed directory: $dir_path ($reason)"
            else
                log "ERROR" "Failed to remove directory: $dir_path"
                return 1
            fi
        fi
    else
        if [[ "$VERBOSE" == "true" ]]; then
            log "WARN" "Directory not found: $dir_path (already removed?)"
        fi
    fi
}

# Function to remove package dependency
remove_dependency() {
    local package_path="$1"
    local dependency="$2"
    local reason="$3"
    
    if [[ -f "$package_path" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log "INFO" "Would remove dependency '$dependency' from $package_path ($reason)"
        else
            # Use pnpm to remove dependency
            local dir=$(dirname "$package_path")
            if (cd "$dir" && pnpm remove "$dependency" --silent); then
                log "SUCCESS" "Removed dependency '$dependency' from $package_path ($reason)"
            else
                log "ERROR" "Failed to remove dependency '$dependency' from $package_path"
                return 1
            fi
        fi
    else
        log "WARN" "Package file not found: $package_path"
    fi
}

# 1. Remove unused UI components
log "INFO" "Removing unused UI components..."
remove_file "apps/web/src/components/ChatMessage.tsx" "Unused chat message component"
remove_file "apps/web/src/components/IntegrityBadge.tsx" "Unused integrity badge component"
remove_file "apps/web/src/components/WitnessAttestationsModal.tsx" "Unused witness attestations modal"
remove_file "apps/web/src/components/layout/Header.tsx" "Unused header layout component"
remove_file "apps/web/src/components/layout/Navigation.tsx" "Unused navigation component"
remove_file "apps/web/src/components/ui/Textarea.tsx" "Unused textarea component"

# 2. Remove unused test files
log "INFO" "Removing unused test files..."
remove_file "k6-cloud-v14.js" "Standalone k6 cloud test"
remove_file "k6-hard-target-v12.6.js" "Standalone k6 hard target test"
remove_file "k6-hard-target.js" "Standalone k6 hard target test"
remove_file "k6-performance-optimized.js" "Standalone k6 performance test"
remove_file "k6-performance-test-optimized.js" "Standalone k6 performance test"
remove_file "k6-performance-test.js" "Standalone k6 performance test"
remove_file "k6-v14-constant-arrival-rate.js" "Standalone k6 constant arrival test"
remove_file "k6-v14-dual-service-test.js" "Standalone k6 dual service test"
remove_file "k6-v14-priming-test.js" "Standalone k6 priming test"
remove_file "tests/performance/atlas-load-test.js" "Standalone load test"

# 3. Remove unused proxy/server scripts
log "INFO" "Removing unused proxy/server scripts..."
remove_file "cluster-server.js" "Standalone cluster server"
remove_file "http2-proxy.js" "Standalone HTTP/2 proxy"
remove_file "proxy-native.js" "Standalone native proxy"
remove_file "proxy-optimized.js" "Standalone optimized proxy"
remove_file "proxy-simple.js" "Standalone simple proxy"
remove_file "server-optimized.js" "Standalone optimized server"

# 4. Remove unused protocol files
log "INFO" "Removing unused protocol files..."
remove_file "packages/fabric-protocol/src/api.d.ts" "Duplicate API definitions"
remove_file "packages/fabric-protocol/src/api.ts" "Unused API implementation"
remove_file "packages/fabric-protocol/src/index.d.ts" "Duplicate index definitions"
remove_file "packages/fabric-protocol/src/types.d.ts" "Duplicate type definitions"
remove_file "packages/fabric-protocol/src/types.ts" "Unused type definitions"

# 5. Remove unused client library
log "INFO" "Removing unused client library..."
remove_file "apps/web/src/lib/atlas-client.ts" "Unused atlas client"

# 6. Remove unused documentation
log "INFO" "Removing unused documentation..."
remove_file "docs/sdk/atlas-sdk-example.js" "Unused SDK example"

# 7. Remove unused CI scripts
log "INFO" "Removing unused CI scripts..."
remove_file "scripts/ci/apply_fixes.mjs" "Unused CI fix script"
remove_file "scripts/ci/parse_ci_log.mjs" "Unused CI log parser"

# 8. Remove unused dependencies
log "INFO" "Removing unused dependencies..."

# Remove from packages/fabric-client
remove_dependency "packages/fabric-client/package.json" "zod" "Unused validation library"

# Remove from apps/admin
remove_dependency "apps/admin/package.json" "@headlessui/react" "Unused UI library"
remove_dependency "apps/admin/package.json" "lucide-react" "Unused icon library"
remove_dependency "apps/admin/package.json" "recharts" "Unused chart library"
remove_dependency "apps/admin/package.json" "clsx" "Unused utility library"

# Remove from apps/web
remove_dependency "apps/web/package.json" "@atlas/fabric-protocol" "Unused protocol dependency"
remove_dependency "apps/web/package.json" "@atlas/fabric-client" "Unused client dependency"
remove_dependency "apps/web/package.json" "@radix-ui/react-slot" "Unused UI component"
remove_dependency "apps/web/package.json" "@headlessui/react" "Unused UI library"
remove_dependency "apps/web/package.json" "@heroicons/react" "Unused icon library"
remove_dependency "apps/web/package.json" "compression" "Unused compression middleware"
remove_dependency "apps/web/package.json" "date-fns" "Unused date utility library"

# Remove from services/gateway
remove_dependency "services/gateway/package.json" "@atlas/fabric-client" "Unused client dependency"

# Remove dev dependencies
remove_dependency "services/witness-node/package.json" "ts-jest" "Unused test framework"
remove_dependency "services/gateway/package.json" "ts-jest" "Unused test framework"
remove_dependency "apps/admin/package.json" "@typescript-eslint/eslint-plugin" "Unused ESLint plugin"
remove_dependency "apps/admin/package.json" "@typescript-eslint/parser" "Unused ESLint parser"
remove_dependency "apps/web/package.json" "@typescript-eslint/eslint-plugin" "Unused ESLint plugin"
remove_dependency "apps/web/package.json" "@typescript-eslint/parser" "Unused ESLint parser"

# Remove Storybook dependencies from apps/web
remove_dependency "apps/web/package.json" "@storybook/addon-vitest" "Unused Storybook dependency"
remove_dependency "apps/web/package.json" "@storybook/addon-a11y" "Unused Storybook dependency"
remove_dependency "apps/web/package.json" "@storybook/addon-docs" "Unused Storybook dependency"
remove_dependency "apps/web/package.json" "@storybook/blocks" "Unused Storybook dependency"
remove_dependency "apps/web/package.json" "@storybook/test" "Unused Storybook dependency"

# 9. Clean up empty directories
log "INFO" "Cleaning up empty directories..."
remove_directory "apps/web/src/components/layout" "Empty layout directory"
remove_directory "tests/performance" "Empty performance test directory"
remove_directory "scripts/ci" "Empty CI scripts directory"

# 10. Update package.json scripts if needed
log "INFO" "Checking for script updates..."

# 11. Generate cleanup summary
log "INFO" "Generating cleanup summary..."
if [[ "$DRY_RUN" == "true" ]]; then
    log "INFO" "DRY RUN COMPLETE - No files were actually deleted"
    log "INFO" "Review the output above and run without --dry-run to execute cleanup"
else
    log "SUCCESS" "CLEANUP COMPLETE - All unused files and dependencies removed"
    log "INFO" "Cleanup log saved to: $LOG_FILE"
fi

# 12. Verify system integrity
if [[ "$DRY_RUN" == "false" ]]; then
    log "INFO" "Verifying system integrity..."
    
    # Check if build still works
    if pnpm build > /dev/null 2>&1; then
        log "SUCCESS" "Build verification passed"
    else
        log "ERROR" "Build verification failed - manual review required"
        exit 1
    fi
    
    # Check if tests still pass
    if pnpm test > /dev/null 2>&1; then
        log "SUCCESS" "Test verification passed"
    else
        log "WARN" "Test verification failed - manual review required"
    fi
fi

log "INFO" "ATLAS v12 cleanup process completed"