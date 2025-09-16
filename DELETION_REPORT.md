# ATLAS v12 DELETION REPORT

## Overview
This report documents all proposed deletions for the ATLAS v12 hardening process. All deletions are implemented via the idempotent cleanup script `scripts/cleanup.sh` to ensure safe, reversible operations.

## Deletion Categories

### 1. Unused UI Components (apps/web/src/components/)
**Rationale**: These components are not imported or used anywhere in the codebase
- `ChatMessage.tsx` - Unused chat message component
- `IntegrityBadge.tsx` - Unused integrity badge component  
- `WitnessAttestationsModal.tsx` - Unused witness attestations modal
- `layout/Header.tsx` - Unused header layout component
- `layout/Navigation.tsx` - Unused navigation component
- `ui/Textarea.tsx` - Unused textarea component

### 2. Unused Test Files
**Rationale**: These are standalone test files not integrated into the CI pipeline
- `k6-cloud-v14.js` - Standalone k6 cloud test
- `k6-hard-target-v12.6.js` - Standalone k6 hard target test
- `k6-hard-target.js` - Standalone k6 hard target test
- `k6-performance-optimized.js` - Standalone k6 performance test
- `k6-performance-test-optimized.js` - Standalone k6 performance test
- `k6-performance-test.js` - Standalone k6 performance test
- `k6-v14-constant-arrival-rate.js` - Standalone k6 constant arrival test
- `k6-v14-dual-service-test.js` - Standalone k6 dual service test
- `k6-v14-priming-test.js` - Standalone k6 priming test
- `tests/performance/atlas-load-test.js` - Standalone load test

### 3. Unused Proxy/Server Scripts
**Rationale**: These are standalone optimization scripts not used in production
- `cluster-server.js` - Standalone cluster server
- `http2-proxy.js` - Standalone HTTP/2 proxy
- `proxy-native.js` - Standalone native proxy
- `proxy-optimized.js` - Standalone optimized proxy
- `proxy-simple.js` - Standalone simple proxy
- `server-optimized.js` - Standalone optimized server

### 4. Unused Protocol Files
**Rationale**: These are duplicate or unused protocol definition files
- `packages/fabric-protocol/src/api.d.ts` - Duplicate API definitions
- `packages/fabric-protocol/src/api.ts` - Unused API implementation
- `packages/fabric-protocol/src/index.d.ts` - Duplicate index definitions
- `packages/fabric-protocol/src/types.d.ts` - Duplicate type definitions
- `packages/fabric-protocol/src/types.ts` - Unused type definitions

### 5. Unused Client Library
**Rationale**: This is an unused client library file
- `apps/web/src/lib/atlas-client.ts` - Unused atlas client

### 6. Unused Documentation
**Rationale**: This is an unused SDK example
- `docs/sdk/atlas-sdk-example.js` - Unused SDK example

### 7. Unused CI Scripts
**Rationale**: These are unused CI utility scripts
- `scripts/ci/apply_fixes.mjs` - Unused CI fix script
- `scripts/ci/parse_ci_log.mjs` - Unused CI log parser

## Dependencies to Remove

### Production Dependencies
- `zod` (packages/fabric-client) - Unused validation library
- `@headlessui/react` (apps/admin, apps/web) - Unused UI library
- `lucide-react` (apps/admin) - Unused icon library
- `recharts` (apps/admin) - Unused chart library
- `clsx` (apps/admin) - Unused utility library
- `@atlas/fabric-protocol` (apps/web) - Unused protocol dependency
- `@atlas/fabric-client` (apps/web, services/gateway) - Unused client dependency
- `@radix-ui/react-slot` (apps/web) - Unused UI component
- `@heroicons/react` (apps/web) - Unused icon library
- `compression` (apps/web) - Unused compression middleware
- `date-fns` (apps/web) - Unused date utility library

### Development Dependencies
- `ts-jest` (services/witness-node, services/gateway) - Unused test framework
- `@typescript-eslint/eslint-plugin` (apps/admin, apps/web) - Unused ESLint plugin
- `@typescript-eslint/parser` (apps/admin, apps/web) - Unused ESLint parser
- `@storybook/*` (apps/web) - Unused Storybook dependencies
- `dependency-cruiser` (root) - Will be re-added as dev dependency

## Safety Measures

### Backup Strategy
- All deletions are logged in this report
- Cleanup script is idempotent and reversible
- Git history preserves all deleted files
- Branch-based approach allows easy rollback

### Verification Process
- Cleanup script includes dry-run mode
- CI pipeline validates cleanup results
- Manual verification before merge
- Rollback plan documented in ROLLBACK.md

## Impact Assessment

### Low Risk
- UI components: No runtime impact
- Test files: No production impact
- Proxy scripts: No production impact
- Documentation: No functional impact

### Medium Risk
- Protocol files: Verify no imports before deletion
- Client library: Verify no imports before deletion
- Dependencies: Verify no runtime usage before removal

### High Risk
- None identified

## Rollback Plan
1. Revert the cleanup commit
2. Restore files from git history
3. Reinstall dependencies from package.json
4. Verify system functionality
5. Document rollback in ROLLBACK.md

## Next Steps
1. Review and approve this deletion report
2. Execute cleanup script in dry-run mode
3. Verify no critical dependencies are affected
4. Execute cleanup script in production mode
5. Validate system functionality
6. Commit changes and create PR