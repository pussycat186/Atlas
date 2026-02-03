# TypeScript Compilation Blocker

## Status: ❌ BLOCKED

**Issue:** TypeScript 5.x ArrayBuffer/SharedArrayBuffer type incompatibility with Web Crypto API  
**Affected:** `packages/crypto` build fails  
**Impact:** Cannot compile, cannot run tests  
**Detected:** 2025-10-21 02:15:00  

---

## Root Cause

TypeScript 5.x has a known issue where `Uint8Array<ArrayBufferLike>` (from TextEncoder/decode operations) is not assignable to `BufferSource` (expected by Web Crypto API).

### Error Pattern
```
error TS2345: Argument of type 'Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'BufferSource'.
  Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'ArrayBufferView<ArrayBuffer>'.
    Types of property 'buffer' are incompatible.
      Type 'ArrayBufferLike' is not assignable to type 'ArrayBuffer'.
        Type 'SharedArrayBuffer' is not assignable to type 'ArrayBuffer'.
```

### Affected Locations
1. `packages/crypto/src/double-ratchet.ts:273,282,286` - crypto.subtle calls
2. `packages/crypto/src/dpop.ts:231,232` - crypto.subtle.verify
3. `packages/crypto/src/http-signatures.ts:131` - crypto.subtle.verify
4. `packages/crypto/src/dpop.ts:41` - JsonWebKey.kid property missing

---

## Quick Fix (Recommended)

Add `@ts-expect-error` directives to affected lines:

```typescript
// packages/crypto/src/dpop.ts line 227
// @ts-expect-error TS ArrayBuffer/SharedArrayBuffer DOM types issue
return crypto.subtle.verify(
  { name: 'ECDSA', hash: 'SHA-256' },
  publicKey,
  signatureBytes as any,
  dataBytes as any
);
```

Repeat for all affected `crypto.subtle` calls (approx. 8-10 locations).

**Estimated Time:** 10 minutes

---

## Alternative Fixes

### Option B: Use Node.js crypto instead of Web Crypto
```typescript
import { subtle } from 'node:crypto';
```
Requires changing tsconfig lib from `["ES2022", "DOM"]` to `["ES2022"]` and updating all crypto calls.

**Time:** 2 hours

### Option C: Create type compatibility wrapper
```typescript
type BufferSourceCompat = ArrayBuffer | ArrayBufferView;
const buf = signatureBytes as unknown as BufferSourceCompat;
```

**Time:** 30 minutes

---

## Current Workarounds Attempted

1. ❌ Downgraded TypeScript to 5.2.2 - issue persists
2. ❌ Set `strict: false` - no effect
3. ❌ Added `types: []` to tsconfig - no effect
4. ✅ Used `as any` assertions - works but need to apply to ALL locations

---

## Impact

- ❌ Cannot build packages/crypto
- ❌ Cannot build packages/auth (depends on crypto)
- ❌ Cannot run unit tests
- ❌ Cannot run E2E tests
- ⏸️ 70% of pipeline blocked

---

## Recommendation

Apply **Quick Fix** (Option A) - This is a known TypeScript/DOM types upstream issue. The runtime code is correct. Using `@ts-expect-error` documents the issue while unblocking the pipeline.

---

**Generated:** 2025-10-21 02:20:00  
**Priority:** HIGH - Blocks all downstream steps
