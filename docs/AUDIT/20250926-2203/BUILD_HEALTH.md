# BUILD HEALTH ANALYSIS

**Generated:** 2025-09-26T22:03:57+07:00

## CRITICAL BUILD ISSUES

### 🚨 PRIMARY BLOCKER: Client-Side Config Import

**Issue:** Client components importing server-side configuration causing build failures.

**Affected Files:**
1. `apps/proof-messenger/app/page.tsx:4`
2. `apps/admin-insights/app/page.tsx:4`  
3. `apps/dev-portal/app/page.tsx:4`
4. `apps/admin-insights/app/metrics/page.tsx:6`
5. `apps/dev-portal/app/(legacy-src)/page-src.tsx:7`

**Root Cause:**
```typescript
// packages/config/src/index.ts:1
import LIVE from '../../../LIVE_URLS.json';

export function getGatewayUrl(): string {
  const gw = (LIVE as any)?.gateway;
  if (typeof gw === 'string' && gw.startsWith('https://')) return gw;
  throw new Error('BLOCKER_NO_LIVE_URLS');
}
```

**Problem Analysis:**
- `'use client'` components cannot import modules that read filesystem at build time
- `getGatewayUrl()` transitively imports `LIVE_URLS.json` via top-level import
- Next.js bundler fails when client code attempts server-side file operations
- Build error: "Module not found: Can't resolve '../../../LIVE_URLS.json'"

### CURRENT WORKAROUNDS (INSUFFICIENT)

**Existing Pattern in Code:**
```typescript
// Current workaround attempts (still problematic)
const gateway = useMemo(() => {
  if (typeof window === 'undefined') return 'https://atlas-gateway.sonthenguyen186.workers.dev';
  return getGatewayUrl(); // ❌ Still imports LIVE_URLS.json at build time
}, []);
```

**Why This Fails:**
- The import happens at module level, not runtime
- Build process analyzes all imports regardless of runtime conditions
- `getGatewayUrl()` function itself imports the JSON file

### REQUIRED FIXES

#### Option A: Runtime-Safe Config (RECOMMENDED)

**1. Create Browser-Safe Config Hook:**
```typescript
// packages/config/src/browser.ts
export function useGatewayUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://atlas-gateway.sonthenguyen186.workers.dev';
  }
  
  // Runtime fetch or hardcoded fallback
  return 'https://atlas-gateway.sonthenguyen186.workers.dev';
}
```

**2. Update Client Components:**
```typescript
// Replace this:
import { getGatewayUrl } from "@atlas/config";
const gateway = useMemo(() => {
  if (typeof window === 'undefined') return 'https://atlas-gateway.sonthenguyen186.workers.dev';
  return getGatewayUrl();
}, []);

// With this:
import { useGatewayUrl } from "@atlas/config/browser";
const gateway = useGatewayUrl();
```

#### Option B: Environment Variable Approach

**1. Use Next.js Environment Variables:**
```typescript
// next.config.js (each app)
module.exports = {
  env: {
    GATEWAY_URL: 'https://atlas-gateway.sonthenguyen186.workers.dev'
  }
}

// In client components:
const gateway = process.env.GATEWAY_URL || 'https://atlas-gateway.sonthenguyen186.workers.dev';
```

#### Option C: Dynamic Import (Advanced)

**1. Lazy Load Config:**
```typescript
const [gateway, setGateway] = useState('https://atlas-gateway.sonthenguyen186.workers.dev');

useEffect(() => {
  import('@atlas/config').then(config => {
    setGateway(config.getGatewayUrl());
  }).catch(() => {
    // Keep fallback
  });
}, []);
```

### IMPLEMENTATION STRATEGY

**Phase 1: Quick Fix (Hardcoded Fallback)**
- Replace `getGatewayUrl()` calls with hardcoded URLs in client components
- Maintains functionality while fixing build issues
- Low risk, immediate deployment capability

**Phase 2: Proper Solution (Runtime Config)**
- Implement browser-safe config system
- Add proper environment variable handling
- Maintain server-side config for SSR components

### BUILD SAFETY CHECKLIST

**✅ Completed Checks:**
- [x] No `fs`, `path`, `child_process` imports in client components
- [x] No direct Node.js API usage in browser code
- [x] Proper `'use client'` directive placement

**🚨 Failed Checks:**
- [ ] No build-time file reads in client components
- [ ] No server-side imports in client code

**⚠️ Additional Risks:**
- Dynamic imports of server-only modules
- Environment variable misuse in client code
- Build-time vs runtime configuration confusion

### RECOMMENDED IMMEDIATE ACTION

**1. Replace Problematic Imports:**
```bash
# Find and replace pattern:
# FROM: import { getGatewayUrl } from "@atlas/config";
# TO:   const GATEWAY_URL = 'https://atlas-gateway.sonthenguyen186.workers.dev';

# FROM: getGatewayUrl()
# TO:   GATEWAY_URL
```

**2. Files to Modify:**
- `apps/proof-messenger/app/page.tsx`
- `apps/admin-insights/app/page.tsx`
- `apps/dev-portal/app/page.tsx`  
- `apps/admin-insights/app/metrics/page.tsx`
- `apps/dev-portal/app/(legacy-src)/page-src.tsx`

**3. Test Build:**
```bash
pnpm --filter "./apps/*" build
```

This approach ensures immediate deployment capability while maintaining functionality.
