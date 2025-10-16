# S3 Authentication Hardening Implementation Plan

## Overview
S3 implements cryptographic authentication controls building on S2's browser security foundation.

## Components

### 1. DPoP Token Binding
**Purpose**: Cryptographically bind OAuth tokens to client keypairs
**Implementation**: 
- Generate client keypair (ES256)
- Create DPoP proof JWT for each API request
- Server validates proof against token binding

**Files to Create**:
- `libs/dpop-client.js` - Client-side DPoP implementation
- `libs/dpop-server.js` - Server-side validation
- `middleware/dpop-validator.ts` - Next.js middleware for DPoP checks

### 2. mTLS Client Certificates  
**Purpose**: Mutual authentication for admin surfaces and service-to-service
**Implementation**:
- Generate client certificates for admin users
- Configure TLS to require/validate client certs
- Bootstrap cert issuance workflow

**Files to Create**:
- `certs/ca-config.json` - Certificate Authority configuration
- `scripts/generate-client-cert.sh` - Client certificate generation
- `middleware/mtls-validator.ts` - Client certificate validation

### 3. CSRF Protection Enhanced
**Purpose**: Multi-layer request forgery prevention
**Implementation**:
- SameSite=Strict cookies with CSRF tokens
- Fetch Metadata header validation  
- Origin/Referer header checks

**Files to Create**:
- `libs/csrf-protection.js` - CSRF token generation/validation
- `middleware/csrf-validator.ts` - Request validation middleware

### 4. Security Flags for S3
**Flags to Add**:
```yaml
# S3 Authentication Hardening
SECURITY_DPOP_ENFORCE:
  enabled: false
  canary_pct: 10
  apps: [dev_portal]
  description: "Require DPoP proofs for API access"

SECURITY_MTLS_INTERNAL:
  enabled: false  
  canary_pct: 10
  apps: [admin_insights]
  description: "Require client certificates for admin"

SECURITY_CSRF_ENFORCE:
  enabled: false
  canary_pct: 10
  apps: [admin_insights, dev_portal, proof_messenger]
  description: "Strict CSRF protection with Fetch Metadata"
```

## Implementation Order
1. Update security/flags.yaml with S3 controls
2. Implement DPoP client/server libraries
3. Add CSRF protection with Fetch Metadata
4. Create mTLS certificate infrastructure 
5. Add middleware for all three apps
6. Create S3 evidence collection
7. Enable 10% canary rollout

## Testing Strategy
**Positive Tests**: Valid DPoP proofs, client certs, CSRF tokens pass
**Negative Tests**: Missing/invalid auth results in 401/403
**Integration Tests**: Full flow with all S3 controls enabled

## Rollback Plan
- Disable flags → immediate rollback
- Dual-accept window for 48h during rollout
- Client SDK helpers for DPoP integration
- Emergency override env vars