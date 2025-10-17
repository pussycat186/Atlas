# Security Model - ATLAS Platform

**Version:** 1.0.0  
**Last Updated:** 2025-10-17  
**Status:** Production Ready

## Overview

ATLAS implements a defense-in-depth security model for secure messaging with cryptographic proof of delivery. This document outlines the security architecture, threat model, and operational controls.

## Core Security Principles

### 1. Zero Trust Architecture
- All requests authenticated and authorized
- No implicit trust between services
- Continuous validation of security posture

### 2. Defense in Depth
- Multiple layers of security controls
- Fail-secure defaults
- Principle of least privilege

### 3. Privacy by Design
- Data minimization
- End-to-end encryption where applicable
- No PII in logs or analytics

## Authentication & Authorization

### Passkey (WebAuthn) Authentication
- **Primary Method**: FIDO2/WebAuthn passkeys
- **Credential Storage**: User devices only (no server-side secrets)
- **Ceremony**: Challenge-response with device-bound cryptographic keys
- **Phishing Resistance**: Origin-bound credentials prevent credential theft

### DPoP (Demonstrating Proof-of-Possession)
- **RFC 9449** compliant token binding
- **Purpose**: Prevent token theft and replay attacks
- **Implementation**: JWT signed with ephemeral client key pair
- **Validation**: Server verifies proof matches request context

### Session Management
- **Token Type**: Short-lived JWT (15 minutes)
- **Refresh Strategy**: Sliding window with rotation
- **Revocation**: Centralized token blacklist with Redis backing
- **JWKS Rotation**: Automatic key rotation every 30 days

## Content Security

### Content Security Policy (CSP)
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'nonce-{random}' 'strict-dynamic';
  style-src 'self' 'nonce-{random}';
  img-src 'self' data: https:;
  connect-src 'self' https://*.vercel.app;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

**Key Features:**
- Nonce-based script execution (no unsafe-inline)
- `strict-dynamic` for script propagation
- `frame-ancestors 'none'` prevents clickjacking
- Trusted Types enforcement (when browser support improves)

### Cross-Origin Isolation
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

**Benefits:**
- Enables `SharedArrayBuffer` for future PQC implementations
- Prevents Spectre/Meltdown side-channel attacks
- Isolates application from malicious cross-origin content

### Transport Security
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**Enforcement:**
- HTTPS only (no HTTP fallback)
- HSTS preload list submission
- Certificate pinning via Trust-On-First-Use (TOFU)

## Cryptographic Receipts

### Receipt Generation
1. Message sent by User A
2. Server generates receipt: `{ messageId, timestamp, sender, recipient, hash(content) }`
3. Receipt signed with server's EdDSA key
4. Signature returned to sender and recipient

### Receipt Verification
- **Client-Side**: Verify signature against published JWKS
- **Transparency**: All receipts auditable via `/verify` endpoint
- **Immutability**: Receipts include content hash for tamper detection

### JWKS Management
- **Endpoint**: `/.well-known/jwks.json`
- **Rotation**: Automatic every 30 days, old keys retained for 60 days
- **Algorithm**: EdDSA (Ed25519)
- **Monitoring**: Hourly health checks via GitHub Actions

## Post-Quantum Cryptography (PQC) Canary

### Current Status
- **PQC Readiness**: Monitoring enabled
- **Algorithm Selection**: CRYSTALS-Kyber (NIST standard)
- **Integration Timeline**: Q1 2026 (pending browser support)

### Hybrid Approach
When PQC is deployed:
1. Establish shared secret using classical ECDH (X25519)
2. Establish second shared secret using Kyber-1024
3. Combine secrets using KDF (HKDF-SHA512)
4. Use combined key for symmetric encryption (AES-256-GCM)

## Data Protection

### Data Classification
| Class | Examples | Storage | Retention |
|-------|----------|---------|-----------|
| Public | Landing pages, docs | CDN, no encryption | Indefinite |
| Internal | Analytics (anonymized) | Encrypted at rest | 90 days |
| Confidential | Message metadata | Encrypted at rest + transit | 30 days |
| Secret | Passkey credentials | User device only | N/A |

### Encryption Standards
- **At Rest**: AES-256-GCM (Vercel KV, databases)
- **In Transit**: TLS 1.3 only (no TLS 1.2 fallback)
- **Key Management**: Vercel-managed keys + JWKS for signing

### Data Minimization
- **No PII in Logs**: All logs sanitized, no email/phone/IP logging
- **Anonymous Metrics**: Aggregate counters only (no user tracking)
- **Message Retention**: Auto-delete after 30 days (configurable per-user)

## Abuse & Risk Mitigation

### Rate Limiting
- **API Endpoints**: 60 req/min per IP (burst: 20)
- **Message Sending**: 10 messages/min per user
- **Media Upload**: 20 uploads/5min per user
- **Authentication**: 5 failed attempts = 15min temporary block

### Content Validation
- **Input Sanitization**: DOMPurify on all user inputs
- **File Upload**: 10MB limit, MIME type validation, malware scanning
- **Spam Detection**: Keyword heuristics, link threshold (max 3 links/message)

### WAF (Web Application Firewall)
- **Provider**: Cloudflare
- **Rules**: Bot fight mode, rate limiting, SQL injection/XSS blocking
- **Monitoring**: Synthetic abuse tests every 6 hours

## Incident Response

### Detection
- **SLO Monitoring**: Availability, error rate, performance metrics
- **Security Events**: Logged to GitHub Security Events
- **Alerts**: GitHub Issues created on SLO breach or security anomaly

### Response Procedures
1. **Detect**: Automated monitoring triggers alert
2. **Assess**: On-call engineer reviews severity and scope
3. **Contain**: Rate limiting, WAF rules, or deployment rollback
4. **Remediate**: Patch vulnerabilities, rotate secrets if compromised
5. **Document**: Post-mortem in `docs/incidents/`

### Rollback Capability
- **One-Click Rollback**: GitHub Actions workflow
- **Vercel Deployments**: Previous 10 deployments retained
- **RTO**: 5 minutes (rollback execution)
- **RPO**: 0 (no data loss, stateless applications)

## Compliance & Auditing

### Standards Alignment
- **OWASP Top 10**: Mitigations for all 2021 risks
- **CWE Top 25**: Security controls address common weaknesses
- **NIST CSF**: Identify, Protect, Detect, Respond, Recover framework

### Audit Trail
- **Git History**: All infrastructure and code changes versioned
- **Evidence Collection**: Automated capture of security postures
- **Secrets Rotation**: Scheduled every 90 days (workflow-enforced)

### Supply Chain Security
- **SBOM**: CycloneDX format, generated weekly
- **Signature Verification**: Cosign keyless signing
- **Dependency Scanning**: Dependabot alerts enabled
- **Secret Scanning**: GitHub Push Protection enabled

## Future Enhancements

### Roadmap
- **Q1 2026**: PQC hybrid encryption
- **Q2 2026**: Hardware security module (HSM) integration
- **Q3 2026**: Formal security audit (third-party)
- **Q4 2026**: SOC 2 Type II certification

### Research Areas
- **Confidential Computing**: TEE (Trusted Execution Environments)
- **Homomorphic Encryption**: Computation on encrypted data
- **Zero-Knowledge Proofs**: Privacy-preserving authentication

---

## Contact

**Security Team**: security@atlas-platform.example  
**Vulnerability Disclosure**: https://github.com/pussycat186/Atlas/security/advisories  
**Bug Bounty**: Coming Q2 2026
