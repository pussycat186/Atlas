# S4 Cryptography & Post-Quantum Implementation Plan

## Overview
S4 implements advanced cryptographic controls building on S1-S3 foundation:
- S1: Infrastructure & flags ✅
- S2: Browser security (CSP, HSTS, COOP/COEP) ✅  
- S3: Authentication (DPoP, CSRF, mTLS) ✅
- S4: Cryptography & Post-Quantum 🔄

## S4 Components

### 1. Post-Quantum Cryptography (PQC) Hybrid Mode
**Purpose**: Quantum-resistant encryption using hybrid classical + PQC algorithms
**Implementation**:
- Hybrid KEM: X25519 (classical) + Kyber768 (post-quantum)
- Dual signatures: Ed25519 + Dilithium2
- Versioned metadata for algorithm agility

**Files to Create**:
- `libs/pqc-hybrid.ts` - Hybrid KEM implementation
- `libs/pqc-signatures.ts` - Dual signature system
- `crypto/key-derivation.ts` - HKDF key derivation

### 2. Field-Level Database Encryption
**Purpose**: Application-layer encryption of PII fields
**Implementation**:
- Deterministic encryption for indexed fields
- Randomized encryption for non-indexed fields
- Key rotation with backward compatibility

**Files to Create**:
- `libs/field-encryption.ts` - Field encryption engine
- `crypto/data-encryption-keys.ts` - DEK management
- `database/encrypted-fields.ts` - ORM integration

### 3. Key Management System Integration
**Purpose**: Secure key storage and rotation using HSM/KMS
**Implementation**:
- KEK (Key Encryption Key) in hardware HSM
- DEK (Data Encryption Key) per tenant/dataset
- Automatic key rotation ≤90 days

**Files to Create**:
- `crypto/kms-integration.ts` - HSM/KMS client
- `crypto/key-rotation.ts` - Automated rotation
- `crypto/key-derivation.ts` - HKDF implementation

### 4. Enhanced TLS Configuration
**Purpose**: TLS 1.3 only with modern cipher suites
**Implementation**:
- TLS 1.3 enforcement
- Perfect Forward Secrecy
- OCSP stapling

**Files to Create**:
- `config/tls-config.ts` - TLS configuration
- `middleware/tls-enforcer.ts` - TLS validation

## Security Flags for S4

```yaml
# Post-Quantum Cryptography hybrid mode
SECURITY_PQC_HYBRID_ENCRYPT:
  enabled: true
  canary_pct: 10
  apps: [dev_portal]
  description: "Hybrid classical + post-quantum encryption"

# Field-level database encryption  
SECURITY_FIELD_ENCRYPTION:
  enabled: true
  canary_pct: 10
  apps: [admin_insights]
  description: "Application-layer PII field encryption"

# TLS 1.3 strict enforcement
SECURITY_TLS13_STRICT:
  enabled: true
  canary_pct: 10
  apps: [admin_insights, dev_portal, proof_messenger]
  description: "TLS 1.3 only with modern ciphers"
```

## Implementation Order
1. PQC hybrid KEM with X25519+Kyber768
2. Field encryption for PII data
3. Key management system integration
4. TLS 1.3 enforcement
5. S4 evidence collection and validation
6. Canary rollout expansion

## Testing Strategy
- **Crypto Tests**: KEM encapsulation/decapsulation validation
- **Field Tests**: Encrypt/decrypt with key rotation
- **Integration Tests**: End-to-end PQC with field encryption
- **Performance Tests**: Crypto overhead measurement

## Rollback Plan
- Disable PQC flags → immediate classical fallback
- Field encryption rollback → plaintext compatibility mode
- TLS downgrade capability for legacy clients
- Emergency key rotation procedures