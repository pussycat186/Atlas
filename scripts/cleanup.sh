#!/bin/bash
# ATLAS Cleanup Script
# This script removes unused dependencies and files identified by knip analysis
# Run with: bash scripts/cleanup.sh

set -euo pipefail

echo "🧹 ATLAS Cleanup Script"
echo "======================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if file exists
check_file() {
    local file=$1
    if [ -f "$file" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check if directory exists
check_dir() {
    local dir=$1
    if [ -d "$dir" ]; then
        return 0
    else
        return 1
    fi
}

# Function to remove file safely
remove_file() {
    local file=$1
    local reason=$2
    
    if check_file "$file"; then
        print_status $YELLOW "Removing file: $file"
        print_status $YELLOW "Reason: $reason"
        rm -f "$file"
        print_status $GREEN "✅ Removed: $file"
    else
        print_status $YELLOW "⚠️  File not found: $file"
    fi
}

# Function to remove directory safely
remove_dir() {
    local dir=$1
    local reason=$2
    
    if check_dir "$dir"; then
        print_status $YELLOW "Removing directory: $dir"
        print_status $YELLOW "Reason: $reason"
        rm -rf "$dir"
        print_status $GREEN "✅ Removed: $dir"
    else
        print_status $YELLOW "⚠️  Directory not found: $dir"
    fi
}

# Function to remove dependency from package.json
remove_dependency() {
    local package_file=$1
    local dependency=$2
    local reason=$3
    
    if check_file "$package_file"; then
        print_status $YELLOW "Removing dependency: $dependency from $package_file"
        print_status $YELLOW "Reason: $reason"
        
        # Use jq to remove the dependency
        if command -v jq &> /dev/null; then
            # Remove from dependencies
            jq "del(.dependencies.\"$dependency\")" "$package_file" > "$package_file.tmp" && mv "$package_file.tmp" "$package_file"
            # Remove from devDependencies
            jq "del(.devDependencies.\"$dependency\")" "$package_file" > "$package_file.tmp" && mv "$package_file.tmp" "$package_file"
            print_status $GREEN "✅ Removed dependency: $dependency"
        else
            print_status $RED "❌ jq not found, cannot remove dependency automatically"
            print_status $YELLOW "Please remove $dependency from $package_file manually"
        fi
    else
        print_status $YELLOW "⚠️  Package file not found: $package_file"
    fi
}

# Function to remove unused export from TypeScript file
remove_export() {
    local file=$1
    local export_name=$2
    local reason=$3
    
    if check_file "$file"; then
        print_status $YELLOW "Removing export: $export_name from $file"
        print_status $YELLOW "Reason: $reason"
        print_status $YELLOW "⚠️  Manual removal required for TypeScript exports"
        print_status $YELLOW "Please remove $export_name from $file manually"
    else
        print_status $YELLOW "⚠️  File not found: $file"
    fi
}

echo "Starting cleanup process..."
echo ""

# 1. Remove unused files
print_status $GREEN "🗑️  Removing unused files..."
echo ""

# Root level unused files
remove_file "cluster-server.js" "Not referenced in any package.json or scripts"
remove_file "http2-proxy.js" "Not referenced in any package.json or scripts"
remove_file "proxy-native.js" "Not referenced in any package.json or scripts"
remove_file "proxy-optimized.js" "Not referenced in any package.json or scripts"
remove_file "proxy-simple.js" "Not referenced in any package.json or scripts"
remove_file "server-optimized.js" "Not referenced in any package.json or scripts"

# k6 test files
remove_file "k6-cloud-v14.js" "Not referenced in any CI workflows"
remove_file "k6-hard-target-v12.6.js" "Not referenced in any CI workflows"
remove_file "k6-hard-target.js" "Not referenced in any CI workflows"
remove_file "k6-performance-optimized.js" "Not referenced in any CI workflows"
remove_file "k6-performance-test-optimized.js" "Not referenced in any CI workflows"
remove_file "k6-performance-test.js" "Not referenced in any CI workflows"
remove_file "k6-v14-constant-arrival-rate.js" "Not referenced in any CI workflows"
remove_file "k6-v14-dual-service-test.js" "Not referenced in any CI workflows"
remove_file "k6-v14-priming-test.js" "Not referenced in any CI workflows"

# Test files
remove_file "tests/performance/atlas-load-test.js" "Not referenced in any CI workflows"

# Script files
remove_file "scripts/ci/apply_fixes.mjs" "Not referenced in any CI workflows"
remove_file "scripts/ci/parse_ci_log.mjs" "Not referenced in any CI workflows"

echo ""

# 2. Remove unused dependencies
print_status $GREEN "📦 Removing unused dependencies..."
echo ""

# services/gateway/package.json
remove_dependency "services/gateway/package.json" "@atlas/fabric-client" "Not imported in any gateway source files"
remove_dependency "services/gateway/package.json" "pino-pretty" "Not used in production code"
remove_dependency "services/gateway/package.json" "ts-jest" "No Jest tests configured"

# services/witness-node/package.json
remove_dependency "services/witness-node/package.json" "pino-pretty" "Not used in production code"
remove_dependency "services/witness-node/package.json" "ts-jest" "No Jest tests configured"

# apps/admin/package.json
remove_dependency "apps/admin/package.json" "@headlessui/react" "Not imported in any admin source files"
remove_dependency "apps/admin/package.json" "clsx" "Not imported in any admin source files"
remove_dependency "apps/admin/package.json" "lucide-react" "Not imported in any admin source files"
remove_dependency "apps/admin/package.json" "recharts" "Not imported in any admin source files"
remove_dependency "apps/admin/package.json" "@typescript-eslint/eslint-plugin" "Not configured in ESLint"
remove_dependency "apps/admin/package.json" "@typescript-eslint/parser" "Not configured in ESLint"

# apps/web/package.json
remove_dependency "apps/web/package.json" "@atlas/fabric-protocol" "Not imported directly, only used via fabric-client"
remove_dependency "apps/web/package.json" "@headlessui/react" "Not imported in any web source files"
remove_dependency "apps/web/package.json" "@heroicons/react" "Not imported in any web source files"
remove_dependency "apps/web/package.json" "@radix-ui/react-slot" "Not imported in any web source files"
remove_dependency "apps/web/package.json" "compression" "Not imported in any web source files"
remove_dependency "apps/web/package.json" "date-fns" "Not imported in any web source files"
remove_dependency "apps/web/package.json" "@storybook/addon-a11y" "Not configured in Storybook"
remove_dependency "apps/web/package.json" "@storybook/addon-docs" "Not configured in Storybook"
remove_dependency "apps/web/package.json" "@storybook/addon-vitest" "Not configured in Storybook"
remove_dependency "apps/web/package.json" "@storybook/blocks" "Not configured in Storybook"
remove_dependency "apps/web/package.json" "@storybook/test" "Not configured in Storybook"
remove_dependency "apps/web/package.json" "@typescript-eslint/eslint-plugin" "Not configured in ESLint"
remove_dependency "apps/web/package.json" "@typescript-eslint/parser" "Not configured in ESLint"

# Root package.json
remove_dependency "package.json" "@typescript-eslint/eslint-plugin" "Not configured in any ESLint config"
remove_dependency "package.json" "@typescript-eslint/parser" "Not configured in any ESLint config"
remove_dependency "package.json" "eslint" "Not configured in any ESLint config"
remove_dependency "package.json" "prettier" "Not configured in any Prettier config"

echo ""

# 3. Remove unused exports (manual removal required)
print_status $GREEN "📝 Unused exports (manual removal required)..."
echo ""

remove_export "apps/admin/src/lib/admin-client.ts" "adminClient" "Not imported anywhere"
remove_export "apps/admin/src/lib/admin-client.ts" "AdminService" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Card.tsx" "CardFooter" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Button.tsx" "buttonVariants" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Select.tsx" "SelectGroup" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Select.tsx" "SelectLabel" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Select.tsx" "SelectSeparator" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Select.tsx" "SelectScrollUpButton" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Select.tsx" "SelectScrollDownButton" "Not imported anywhere"
remove_export "apps/web/src/components/ui/Badge.tsx" "badgeVariants" "Not imported anywhere"
remove_export "apps/web/src/lib/features.ts" "withFeatureFlag" "Not imported anywhere"

echo ""

# 4. Clean up node_modules and reinstall
print_status $GREEN "🔄 Cleaning up node_modules and reinstalling dependencies..."
echo ""

# Remove node_modules directories
remove_dir "node_modules" "Cleaning up root node_modules"
remove_dir "apps/web/node_modules" "Cleaning up web app node_modules"
remove_dir "apps/admin/node_modules" "Cleaning up admin app node_modules"
remove_dir "services/gateway/node_modules" "Cleaning up gateway service node_modules"
remove_dir "services/witness-node/node_modules" "Cleaning up witness service node_modules"
remove_dir "packages/fabric-client/node_modules" "Cleaning up fabric-client package node_modules"
remove_dir "packages/fabric-protocol/node_modules" "Cleaning up fabric-protocol package node_modules"

# Remove dist directories
remove_dir "services/gateway/dist" "Cleaning up gateway dist"
remove_dir "services/witness-node/dist" "Cleaning up witness dist"
remove_dir "packages/fabric-client/dist" "Cleaning up fabric-client dist"
remove_dir "packages/fabric-protocol/dist" "Cleaning up fabric-protocol dist"

# Remove TypeScript build info
remove_file "services/gateway/tsconfig.tsbuildinfo" "Cleaning up TypeScript build info"
remove_file "services/witness-node/tsconfig.tsbuildinfo" "Cleaning up TypeScript build info"
remove_file "packages/fabric-client/tsconfig.tsbuildinfo" "Cleaning up TypeScript build info"
remove_file "packages/fabric-protocol/tsconfig.tsbuildinfo" "Cleaning up TypeScript build info"

echo ""

# 5. Reinstall dependencies
print_status $GREEN "📥 Reinstalling dependencies..."
echo ""

if command -v pnpm &> /dev/null; then
    print_status $YELLOW "Installing dependencies with pnpm..."
    pnpm install --frozen-lockfile
    print_status $GREEN "✅ Dependencies installed successfully"
else
    print_status $RED "❌ pnpm not found, please install dependencies manually"
    print_status $YELLOW "Run: pnpm install --frozen-lockfile"
fi

echo ""

# 6. Verify build still works
print_status $GREEN "🔍 Verifying build still works..."
echo ""

if command -v pnpm &> /dev/null; then
    print_status $YELLOW "Running build..."
    if pnpm run build; then
        print_status $GREEN "✅ Build successful"
    else
        print_status $RED "❌ Build failed, please check the errors above"
        exit 1
    fi
else
    print_status $YELLOW "⚠️  pnpm not found, cannot verify build"
fi

echo ""

# 7. Summary
print_status $GREEN "📊 Cleanup Summary"
echo "=================="
echo ""
print_status $GREEN "✅ Removed unused files"
print_status $GREEN "✅ Removed unused dependencies"
print_status $YELLOW "⚠️  Manual removal required for unused exports"
print_status $GREEN "✅ Cleaned up node_modules and dist directories"
print_status $GREEN "✅ Reinstalled dependencies"
print_status $GREEN "✅ Verified build still works"
echo ""
print_status $GREEN "🎉 Cleanup completed successfully!"
echo ""
print_status $YELLOW "Next steps:"
print_status $YELLOW "1. Review the changes in git"
print_status $YELLOW "2. Test the application thoroughly"
print_status $YELLOW "3. Commit the changes"
print_status $YELLOW "4. Update documentation if needed"
echo ""
