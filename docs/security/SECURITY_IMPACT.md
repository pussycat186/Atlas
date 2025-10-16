# Atlas Security Hardening Impact Analysis

**Generated:** 2025-10-16 UTC  
**Scope:** Production frontends + Backend services  
**Rollout:** Staged canary deployment with feature flags

## Executive Summary

This document analyzes the security controls being implemented across the Atlas ecosystem. Each control follows a **explain-then-act** methodology with measurable gates and rollback procedures.

---

## 1. BROWSER POLICY HARDENING

### Content Security Policy (CSP) with Trusted Types
**WHAT:** Strict CSP with nonce-based script allowlisting and Trusted Types API enforcement
```http
Content-Security-Policy: default-src 'self'; script-src 'nonce-{random}' 'strict-dynamic'; require-trusted-types-for 'script'
```

**WHY:** Prevents XSS attacks, script injection, and malicious DOM manipulation. Trusted Types eliminate DOM-based XSS by requiring sanitized APIs for innerHTML/eval operations.

**BREAKAGE:** 
- ❌ Inline scripts without nonces will be blocked
- ❌ Third-party analytics (Google Analytics, HotJar) may break
- ❌ React apps using `dangerouslySetInnerHTML` will fail
- ❌ Legacy jQuery plugins with eval() calls blocked

**MITIGATION:**
- Generate cryptographic nonces in middleware
- Add SRI hashes for external scripts: `<script src="..." integrity="sha384-...">`
- Convert inline handlers to event listeners
- Allowlist specific trusted-types policies for React
```javascript
// Before (blocked)
element.innerHTML = userContent;

// After (allowed)
const policy = trustedTypes.createPolicy('atlas-policy', {
  createHTML: (string) => DOMPurify.sanitize(string)
});
element.innerHTML = policy.createHTML(userContent);
```

**ROLLBACK:** Set `SECURITY_CSP_STRICT=OFF` → reverts to report-only mode

---

### Cross-Origin Policies (COOP/COEP/CORP)
**WHAT:** 
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp` 
- `Cross-Origin-Resource-Policy: same-site`

**WHY:** Prevents Spectre-like attacks, ensures process isolation, blocks malicious cross-origin access to shared memory APIs.

**BREAKAGE:**
- ❌ External fonts from Google Fonts without CORP header
- ❌ Third-party iframes (YouTube embeds, maps) blocked
- ❌ SharedArrayBuffer APIs unavailable until COEP compliant

**MITIGATION:**
- Proxy external resources through same-origin endpoints
- Add `crossorigin="anonymous"` to font links
- Use `allow="cross-origin-isolated"` for trusted embeds
- Implement resource allowlist in middleware

**ROLLBACK:** Set `SECURITY_COOP_COEP=OFF` → removes isolation headers

---

### HTTP Strict Transport Security (HSTS) Preload
**WHAT:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

**WHY:** Prevents HTTPS downgrade attacks, ensures all subdomains use TLS, enables browser preload list inclusion.

**BREAKAGE:**
- ❌ HTTP-only development subdomains become unreachable
- ❌ Legacy integrations expecting HTTP connections fail
- ❌ Localhost development broken if subdomains enabled

**MITIGATION:**
- Scope to production domains only: `if (process.env.NODE_ENV === 'production')`
- Verify ALL subdomains support HTTPS before enabling
- Use separate staging domains without preload

**ROLLBACK:** Set `SECURITY_HSTS_PRELOAD=OFF` → removes HSTS headers

---

## 2. AUTHENTICATION/AUTHORIZATION HARDENING

### Demonstration of Proof-of-Possession (DPoP)
**WHAT:** OAuth 2.0 DPoP (RFC 9449) - cryptographically bound access tokens to prevent replay attacks
```
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2In0...
Authorization: DPoP eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**WHY:** Prevents token theft/replay attacks, provides proof that client possesses the private key bound to the access token.

**BREAKAGE:**
- ❌ Legacy API clients without DPoP support return 401
- ❌ Postman collections need DPoP header generation
- ❌ Mobile apps require crypto library integration

**MITIGATION:**
- Dual-accept window: check DPoP presence but don't enforce initially
- Provide SDK helpers for DPoP proof generation
- Create Postman pre-request scripts for DPoP
```javascript
// DPoP Helper
const dpopProof = await generateDPoPProof({
  method: 'POST',
  url: 'https://api.atlas.com/v1/resource',
  accessToken: token
});
```

**ROLLBACK:** Set `SECURITY_DPOP_ENFORCE=OFF` → accepts tokens without DPoP

---

### Mutual TLS (mTLS) for Internal Services
**WHAT:** Certificate-based authentication for service-to-service and admin endpoint access
```
client_certificate_required: true
ca_certificates: [atlas-internal-ca.pem]
```

**WHY:** Ensures only trusted services can communicate internally, prevents lateral movement in case of service compromise.

**BREAKAGE:**
- ❌ Health checks without client certs fail
- ❌ Load balancer probes blocked
- ❌ Developer tools/debugging endpoints inaccessible
- ❌ CI/CD pipelines need certificate provisioning

**MITIGATION:**
- Certificate bootstrap for development environments
- Health check exemptions with IP allowlist
- Step-up authentication for admin operations
- Automated cert rotation with ACME protocol

**ROLLBACK:** Set `SECURITY_MTLS_INTERNAL=OFF` → allows connections without client certs

---

## 3. CRYPTOGRAPHY & POST-QUANTUM CRYPTOGRAPHY

### Hybrid Key Encapsulation (X25519 + Kyber768)
**WHAT:** Combines classical elliptic curve with post-quantum lattice-based cryptography for future-proof encryption
```
DEK_wrap = Hybrid_KEM(X25519_pubkey || Kyber768_pubkey, DEK_plaintext)
```

**WHY:** Protects against both current cryptanalytic attacks and future quantum computer threats (Shor's algorithm).

**BREAKAGE:**
- ❌ Increased ciphertext size (X25519: 32 bytes → Hybrid: ~1100 bytes)
- ❌ Higher CPU/memory usage during key operations
- ❌ Legacy systems cannot decrypt hybrid-encrypted data

**MITIGATION:**
- Apply to at-rest DEK wrapping first (lower performance impact)
- Algorithm version metadata for gradual migration
- Fallback decryption for legacy ciphertexts
- Performance benchmarking in staging

**ROLLBACK:** Set `SECURITY_PQC_HYBRID_ENCRYPT=OFF` → uses X25519-only KEM

---

### Dual Signature Schemes (Ed25519 + Dilithium2)
**WHAT:** Sign receipts/proofs with both classical and post-quantum signature algorithms
```json
{
  "receipt_id": "uuid",
  "signatures": {
    "ed25519": "base64_signature_1",
    "dilithium2": "base64_signature_2"
  },
  "algorithm_version": "dual_v1"
}
```

**WHY:** Ensures signature validity even if one algorithm is compromised by quantum computers.

**BREAKAGE:**
- ❌ Doubled signature verification time
- ❌ Increased payload size (~2.5KB vs 64 bytes)
- ❌ Mobile clients may struggle with large signatures

**MITIGATION:**
- Batch verification for multiple signatures
- Compression for large Dilithium signatures
- Algorithm selection based on client capabilities
- Async verification for non-critical paths

**ROLLBACK:** Algorithm version metadata allows fallback to single-signature mode

---

## 4. DATA PROTECTION

### Field-Level Encryption with Deterministic Mode
**WHAT:** Encrypt PII columns using AES-GCM with deterministic encryption for indexed fields
```sql
-- Before
users: { email: "user@example.com", ssn: "123-45-6789" }

-- After  
users: { 
  email_enc: "det_encrypt(user@example.com)",  -- searchable
  ssn_enc: "rand_encrypt(123-45-6789)"        -- non-searchable
}
```

**WHY:** Protects PII at rest while maintaining query capabilities for indexed fields, enables compliance with GDPR/CCPA.

**BREAKAGE:**
- ❌ Raw SQL queries against PII columns fail
- ❌ Database analytics tools cannot read encrypted fields
- ❌ Legacy reports require decryption layer
- ❌ Full-text search across encrypted fields impossible

**MITIGATION:**
- Proxy layer for transparent encryption/decryption
- Search index tables for full-text capabilities
- Migration scripts for existing data
- Query allowlist for reporting tools

**ROLLBACK:** Set `SECURITY_FIELD_ENCRYPTION=OFF` → disables encryption middleware

---

## 5. EDGE PROTECTION & WAF

### Multi-Dimensional Rate Limiting
**WHAT:** Rate limiting by IP + token + device fingerprint with bot allowlisting
```yaml
rate_limits:
  - dimension: [ip, user_agent]
    limit: 1000/hour
  - dimension: [token_sub]  
    limit: 10000/hour
  - dimension: [device_id]
    limit: 5000/hour
allowlist:
  - user_agent: "GoogleBot/2.1"
  - ip_range: "webhook_providers"
```

**WHY:** Prevents abuse while allowing legitimate automated traffic, enables granular rate limiting per user/device.

**BREAKAGE:**
- ❌ Legitimate high-volume users may be rate-limited
- ❌ Bot detection false positives block real users
- ❌ Webhook providers may be blocked during traffic spikes
- ❌ Load testing requires allowlist configuration

**MITIGATION:**
- Maintain allowlist of known good bots/webhooks
- Graduated rate limits with burst capacity
- Customer-specific rate limit tiers
- Synthetic monitoring in CI to validate allowlists

**ROLLBACK:** Set `SECURITY_WAF_ADVANCED=OFF` → disables advanced rate limiting

---

## 6. SUPPLY CHAIN SECURITY

### SBOM + SLSA Provenance + Cosign Signing
**WHAT:** Generate CycloneDX SBOM, SLSA Build Level 3 provenance, and sign artifacts with Cosign
```json
{
  "sbom": "atlas-app-v1.2.3.cyclonedx.json",
  "provenance": "atlas-app-v1.2.3.slsa.json", 
  "signature": "cosign verify --key cosign.pub atlas-app:v1.2.3"
}
```

**WHY:** Provides software bill of materials for vulnerability tracking, build provenance for supply chain integrity, cryptographic signatures for tampering detection.

**BREAKAGE:**
- ❌ Increased build time (SBOM generation + signing)
- ❌ Deployment pipelines require signature verification
- ❌ Air-gapped environments need key provisioning
- ❌ Failed signatures block releases

**MITIGATION:**
- Dedicated security jobs in parallel with builds
- Cache SBOM components across builds
- Policy engine for signature requirements per environment
- Emergency bypass procedures with audit trails

**ROLLBACK:** Set `SUPPLY_CHAIN_SBOM_SLSA=OFF` → skips security artifact generation

---

## 7. OBSERVABILITY & PRIVACY

### OpenTelemetry with PII Redaction
**WHAT:** Trace key user flows with automatic PII redaction and sampling
```json
{
  "trace_id": "abc123",
  "spans": [{
    "operation": "user.login",
    "attributes": {
      "user.email": "[REDACTED]",
      "user.id": "hashed_id_123"
    }
  }],
  "sampling_rate": 0.1
}
```

**WHY:** Enables debugging and performance monitoring while protecting user privacy and reducing trace volume costs.

**BREAKAGE:**
- ❌ Reduced debugging capability due to PII redaction
- ❌ Performance overhead from trace collection
- ❌ High-cardinality attributes may be dropped
- ❌ Trace correlation across services may break

**MITIGATION:**
- Store one full-fidelity trace per flow type as evidence
- Configurable redaction patterns per data classification
- Sampling rate adjustment based on error rates
- Trace correlation IDs preserved across services

**ROLLBACK:** Set `OTEL_REDACTION_ENFORCE=OFF` → disables PII redaction

---

## COMPATIBILITY MATRIX

| Control | Chrome 120+ | Firefox 119+ | Safari 17+ | Mobile | API Clients | Legacy Systems |
|---------|-------------|--------------|------------|---------|-------------|----------------|
| CSP Strict | ✅ | ✅ | ✅ | ⚠️ WebView issues | ❌ Requires updates | ❌ Not supported |
| COOP/COEP | ✅ | ✅ | ✅ | ⚠️ Limited | N/A | ❌ Not supported |
| HSTS Preload | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ HTTP fallback |
| DPoP | ✅ Library | ✅ Library | ✅ Library | ⚠️ Integration needed | ❌ Requires updates | ❌ Not supported |
| mTLS | ✅ | ✅ | ✅ | ⚠️ Cert provisioning | ⚠️ Config needed | ❌ Legacy protocols |
| PQC Hybrid | ✅ WebCrypto | ✅ WebCrypto | ⚠️ Limited | ⚠️ Performance | ✅ Libraries exist | ❌ Crypto upgrade needed |

---

## ROLLBACK PROCEDURES

### Immediate Rollback (< 5 minutes)
```bash
# Environment variable rollback
export SECURITY_CSP_STRICT=OFF
export SECURITY_COOP_COEP=OFF
export SECURITY_HSTS_PRELOAD=OFF
export SECURITY_DPOP_ENFORCE=OFF
export SECURITY_MTLS_INTERNAL=OFF

# Restart services
kubectl rollout restart deployment/atlas-*
```

### Configuration Rollback (< 15 minutes)
```yaml
# Kubernetes ConfigMap update
apiVersion: v1
kind: ConfigMap
metadata:
  name: atlas-security-config
data:
  SECURITY_FLAGS: "all_off"
  CSP_MODE: "report-only"
```

### Code Rollback (< 30 minutes)
```bash
# Git revert to previous working state
git revert --mainline 1 {security_commit_sha}
git push origin main

# Trigger redeployment
gh workflow run deploy-atlas-frontends.yml
```

### Database Rollback (< 60 minutes)
```sql
-- Field encryption rollback
UPDATE users SET 
  email = decrypt_field(email_enc),
  ssn = decrypt_field(ssn_enc)
WHERE email_enc IS NOT NULL;

-- Drop encryption columns after verification
ALTER TABLE users DROP COLUMN email_enc, DROP COLUMN ssn_enc;
```

---

## EVIDENCE COLLECTION

Each security control implementation will generate measurable evidence:

### Automated Gates
- **Headers validation**: `curl -I` responses match expected CSP/COOP/COEP values
- **Lighthouse security audit**: Best Practices score ≥95 with security checks
- **Playwright security tests**: CSP enforcement, no unsafe-inline, prism markers
- **k6 performance**: Security headers don't degrade performance beyond thresholds
- **Supply chain verification**: `cosign verify` passes, SBOM contains expected components

### Manual Evidence
- **Penetration testing reports** for each control
- **Performance benchmarks** before/after security hardening
- **Compliance mapping** to SOC2/ISO27001/GDPR requirements
- **Incident response playbooks** updated for new security controls

---

## NEXT STEPS

1. **PR-1**: Feature flags implementation + CI security guards
2. **PR-2**: CSP/COOP/COEP headers with nonce generation
3. **PR-3**: DPoP implementation with dual-accept window
4. **PR-4**: mTLS for internal services with cert bootstrap
5. **PR-5**: PQC hybrid cryptography with algorithm versioning
6. **PR-6**: Field-level encryption with migration scripts
7. **PR-7**: WAF/rate limiting with bot allowlist
8. **PR-8**: SBOM/SLSA/Cosign with policy enforcement
9. **PR-9**: OTEL privacy with PII redaction + full-fidelity evidence

Each PR will include:
- Detailed explanation of changes and rationale
- Canary rollout plan (10% → 50% → 100%)
- Automated gate validation 
- Evidence artifacts demonstrating security improvement
- Rollback procedures tested in staging

**Ready to proceed with PR-1: Security Flags & CI Guards Implementation.**