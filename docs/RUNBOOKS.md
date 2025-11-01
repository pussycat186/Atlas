# Atlas Runbooks

## 1. Key Leak Response

**Trigger**: Private key exposed in logs/code

**Actions**:
1. Rotate JWKS immediately (emergency rotation)
2. Revoke compromised kid
3. Notify users (in-app banner)
4. Audit all receipts signed with compromised key
5. Post-mortem within 24h

## 2. Performance Regression

**Trigger**: p95 latency > 200ms for 10 minutes

**Actions**:
1. Check Cloud Run metrics (CPU, memory, concurrency)
2. Review recent deployments (rollback if needed)
3. Check database queries (Firestore)
4. Scale up instances if needed
5. Create incident report

## 3. Supply-Chain Alert

**Trigger**: Trivy finds HIGH/CRITICAL vulnerability

**Actions**:
1. Block deployment (CI gate)
2. Assess impact (reachable? exploitable?)
3. Update dependency or apply patch
4. Re-scan and verify fix
5. Deploy patched version
6. Announce in Trust Portal

---

**Ngày tạo**: 2025-10-21  
**Cập nhật**: 2025-10-22

## 4. Preview Health & Security Validation

**Trigger**: After Vercel preview deployment

**Purpose**: Verify security headers, JWKS, and health endpoints are functional

**Prerequisites**:
- Vercel preview deployed (status "Ready")
- Preview URL available (e.g., `https://app-name-xyz.vercel.app`)
- `curl` and `jq` available

**Procedure**:

### Step 1: Obtain Preview URL
1. Go to Vercel dashboard: https://vercel.com/sonnguyen
2. Select the deployment
3. Copy the preview URL

### Step 2: Verify Security Headers
```bash
URL="https://app-name-xyz.vercel.app"
curl -sI "$URL" | tee headers.txt | grep -E "Strict-Transport|Content-Security|X-Content|Referrer|Permissions|Cross-Origin"
```

**Expected Output** (8 headers):
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

**Validation**:
```bash
# Count headers (should be 8)
curl -sI "$URL" | grep -cE "Strict-Transport|Content-Security|X-Content|Referrer|Permissions|Cross-Origin-(Opener|Embedder|Resource)"
```

### Step 3: Verify JWKS Endpoint
```bash
curl -s "$URL/.well-known/jwks.json" | tee jwks.json | jq
```

**Expected Output**:
```json
{
  "keys": [
    {
      "kid": "atlas-key-id",
      "kty": "RSA",
      "alg": "RS256",
      "use": "sig",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

**Validation**:
```bash
# Check keys array exists and has at least one key
jq -e '.keys | length > 0' jwks.json

# Check first key has required fields
jq -e '.keys[0] | has("kid") and has("kty") and has("alg") and has("use")' jwks.json
```

### Step 4: Verify Health Endpoint
```bash
curl -s "$URL/api/healthz" | tee healthz.json | jq
```

**Expected Output**:
```json
{
  "ok": true,
  "timestamp": "2025-10-22T...",
  "service": "app-name"
}
```

**Validation**:
```bash
# Check ok is true
jq -e '.ok == true' healthz.json
```

### Step 5: Create Validation Summary
```bash
# Create summary file
cat > validation_summary.txt <<EOF
App: $APP_NAME
URL: $URL
Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

Headers: $(curl -sI "$URL" | grep -cE "Strict-Transport|Content-Security|X-Content|Referrer|Permissions|Cross-Origin-(Opener|Embedder|Resource)") / 8
JWKS: $(curl -s "$URL/.well-known/jwks.json" | jq -e '.keys | length > 0' && echo "PASS" || echo "FAIL")
Health: $(curl -s "$URL/api/healthz" | jq -e '.ok == true' && echo "PASS" || echo "FAIL")
EOF

cat validation_summary.txt
```

### Step 6: Save Evidence
```bash
mkdir -p evidence/ga_final_run/verify/$APP_NAME
mv headers.txt jwks.json healthz.json validation_summary.txt evidence/ga_final_run/verify/$APP_NAME/
```

**Success Criteria**:
- ✅ 8/8 headers present
- ✅ JWKS returns valid JSON with `keys` array
- ✅ Health returns `{ ok: true }`

**Failure Actions**:
- If headers missing: Check `next.config.js` `async headers()` function
- If JWKS 404: Check route handler at `app/.well-known/jwks.json/route.ts`
- If health 404: Check route handler at `app/api/healthz/route.ts`
- If CSP too strict causing app to break: Adjust CSP in `next.config.js`

**Related**: See `evidence/ga_final_run/GA_SHIP_READINESS.md` for full context

---

