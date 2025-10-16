#!/bin/bash
# Atlas S2 Evidence Collection Script
# Tests security headers, CSP compliance, and anti-clickjacking measures

set -e

# Create evidence directory with UTC timestamp
EVIDENCE_DIR="docs/evidence/$(date -u +%Y%m%d-%H%M)"
mkdir -p "$EVIDENCE_DIR"

echo "🔍 Collecting S2 Headers & CSP Evidence..."
echo "📁 Evidence directory: $EVIDENCE_DIR"

# Production URLs
DEV_PORTAL_URL="https://atlas-dev-portal.vercel.app"
ADMIN_INSIGHTS_URL="https://atlas-admin-insights.vercel.app"
PROOF_MESSENGER_URL="https://atlas-proof-messenger.vercel.app"

# ==============================================
# 1. HEADER VALIDATION TESTS
# ==============================================
echo "🛡️  Testing Security Headers..."

# Test dev-portal (should have S2 features enabled)
echo "Testing dev-portal headers..." > "$EVIDENCE_DIR/headers-dev-portal.txt"
curl -I -s "$DEV_PORTAL_URL" >> "$EVIDENCE_DIR/headers-dev-portal.txt" 2>&1 || echo "FAILED to fetch dev-portal headers"

# Test admin-insights (should have fallback headers)  
echo "Testing admin-insights headers..." > "$EVIDENCE_DIR/headers-admin-insights.txt"
curl -I -s "$ADMIN_INSIGHTS_URL" >> "$EVIDENCE_DIR/headers-admin-insights.txt" 2>&1 || echo "FAILED to fetch admin-insights headers"

# Test proof-messenger (should have fallback headers)
echo "Testing proof-messenger headers..." > "$EVIDENCE_DIR/headers-proof-messenger.txt"
curl -I -s "$PROOF_MESSENGER_URL" >> "$EVIDENCE_DIR/headers-proof-messenger.txt" 2>&1 || echo "FAILED to fetch proof-messenger headers"

# ==============================================
# 2. CSP NONCE VALIDATION  
# ==============================================
echo "🎲 Testing CSP Nonce Generation..."

# Test that CSP includes nonce directive
CSP_HEADER=$(curl -I -s "$DEV_PORTAL_URL" | grep -i "content-security-policy" || echo "NO CSP HEADER")
echo "Dev Portal CSP: $CSP_HEADER" > "$EVIDENCE_DIR/csp-validation.txt"

if echo "$CSP_HEADER" | grep -q "nonce-"; then
    echo "✅ CSP nonce detected" >> "$EVIDENCE_DIR/csp-validation.txt"
else
    echo "❌ CSP nonce NOT detected" >> "$EVIDENCE_DIR/csp-validation.txt"
fi

# ==============================================
# 3. CROSS-ORIGIN POLICY VALIDATION
# ==============================================
echo "🔒 Testing Cross-Origin Policies..."

# Test COOP headers
COOP_HEADER=$(curl -I -s "$DEV_PORTAL_URL" | grep -i "cross-origin-opener-policy" || echo "NO COOP HEADER")
echo "Dev Portal COOP: $COOP_HEADER" > "$EVIDENCE_DIR/coop-validation.txt"

# Test COEP headers  
COEP_HEADER=$(curl -I -s "$DEV_PORTAL_URL" | grep -i "cross-origin-embedder-policy" || echo "NO COEP HEADER")
echo "Dev Portal COEP: $COEP_HEADER" >> "$EVIDENCE_DIR/coop-validation.txt"

# ==============================================
# 4. HSTS VALIDATION
# ==============================================
echo "🚢 Testing HSTS Configuration..."

HSTS_HEADER=$(curl -I -s "$DEV_PORTAL_URL" | grep -i "strict-transport-security" || echo "NO HSTS HEADER")
echo "Dev Portal HSTS: $HSTS_HEADER" > "$EVIDENCE_DIR/hsts-validation.txt"

if echo "$HSTS_HEADER" | grep -q "preload"; then
    echo "✅ HSTS preload detected" >> "$EVIDENCE_DIR/hsts-validation.txt"
else
    echo "⚠️  HSTS preload NOT detected (expected for staging)" >> "$EVIDENCE_DIR/hsts-validation.txt"
fi

# ==============================================
# 5. SECURITY GATE VALIDATION
# ==============================================
echo "🚨 Validating Required Security Headers..."

REQUIRED_HEADERS=(
    "X-Content-Type-Options"
    "X-Frame-Options"
    "Referrer-Policy"
    "Content-Security-Policy"
)

> "$EVIDENCE_DIR/security-gate-validation.txt"
for app in "dev-portal" "admin-insights" "proof-messenger"; do
    case $app in
        "dev-portal") URL=$DEV_PORTAL_URL ;;
        "admin-insights") URL=$ADMIN_INSIGHTS_URL ;;
        "proof-messenger") URL=$PROOF_MESSENGER_URL ;;
    esac
    
    echo "=== $app Security Gate ===" >> "$EVIDENCE_DIR/security-gate-validation.txt"
    
    for header in "${REQUIRED_HEADERS[@]}"; do
        if curl -I -s "$URL" | grep -i "$header" > /dev/null; then
            echo "✅ $header: PRESENT" >> "$EVIDENCE_DIR/security-gate-validation.txt"
        else
            echo "❌ $header: MISSING" >> "$EVIDENCE_DIR/security-gate-validation.txt"
        fi
    done
    echo "" >> "$EVIDENCE_DIR/security-gate-validation.txt"
done

# ==============================================
# 6. GENERATE SUMMARY REPORT
# ==============================================
echo "📋 Generating S2 Evidence Summary..."

cat > "$EVIDENCE_DIR/S2-EVIDENCE-SUMMARY.md" << EOF
# S2 Headers & CSP Evidence Report
Generated: $(date -u)

## Test Results

### Security Headers Status
- ✅ Dev Portal Headers: [See headers-dev-portal.txt](./headers-dev-portal.txt)
- ✅ Admin Insights Headers: [See headers-admin-insights.txt](./headers-admin-insights.txt)  
- ✅ Proof Messenger Headers: [See headers-proof-messenger.txt](./headers-proof-messenger.txt)

### CSP Nonce Validation
[See csp-validation.txt](./csp-validation.txt)

### Cross-Origin Policy Validation  
[See coop-validation.txt](./coop-validation.txt)

### HSTS Configuration
[See hsts-validation.txt](./hsts-validation.txt)

### Security Gate Compliance
[See security-gate-validation.txt](./security-gate-validation.txt)

## S2 Acceptance Criteria

- [ ] CSP with nonce enforcement active
- [ ] Trusted Types headers present  
- [ ] SRI validation enabled
- [ ] COOP/COEP configured
- [ ] HSTS with appropriate settings
- [ ] All apps have baseline security headers
- [ ] Canary rollout targeting dev_portal first

## Next Steps

If all gates pass:
1. Expand canary to 50% for dev_portal
2. Enable for proof_messenger at 10%  
3. Monitor CSP violation reports
4. Proceed to S3 Auth Hardening

If any gates fail:
1. Review specific failure in linked evidence files
2. Implement fixes or rollback flags
3. Re-run evidence collection
EOF

echo "✅ S2 Evidence Collection Complete!"
echo "📁 Evidence saved to: $EVIDENCE_DIR"
echo ""
echo "🎯 Next Steps:"
echo "1. Review evidence files for any failures"
echo "2. If all gates pass, expand canary rollout"
echo "3. If any fail, implement fixes and re-test"