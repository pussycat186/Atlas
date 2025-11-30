# Security Policy

**Version**: 2.0  
**Effective Date**: October 22, 2025  
**Last Updated**: October 22, 2025

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO**:
- Email: **security@atlas.dev** (PGP key available)
- Include: Detailed description, reproduction steps, impact assessment
- Allow: 90 days for us to patch before public disclosure

**DON'T**:
- Post vulnerabilities publicly (Twitter, GitHub Issues, etc.)
- Exploit vulnerabilities beyond proof-of-concept
- Access other users' data without permission

### What to Expect

1. **Acknowledgment**: Within 24 hours
2. **Initial Assessment**: Within 48 hours (severity classification)
3. **Patch Development**: 7-30 days (depending on severity)
4. **Disclosure**: Coordinated disclosure after patch deployed
5. **Credit**: Public acknowledgment on our Security page (if desired)

### Bug Bounty Program

We offer rewards for qualifying vulnerabilities:

| Severity | Description | Reward |
|----------|-------------|--------|
| **Critical** | RCE, auth bypass, E2EE break | $5,000 - $10,000 |
| **High** | SQL injection, XSS, key extraction | $1,000 - $5,000 |
| **Medium** | CSRF, rate limit bypass, info disclosure | $250 - $1,000 |
| **Low** | Security misconfig, minor issues | $50 - $250 |

**Scope**: atlas.dev, api.atlas.dev, trust.atlas.dev, open source repositories

**Out of Scope**: Social engineering, physical attacks, DDoS, third-party services

## Security Architecture

### 1. End-to-End Encryption (E2EE)

**Message Encryption**:
- **Algorithm**: Double Ratchet (Signal Protocol variant)
- **Key Exchange**: X25519 Elliptic Curve Diffie-Hellman
- **Symmetric Cipher**: XChaCha20-Poly1305
- **Forward Secrecy**: Yes (new key for each message)
- **Post-Compromise Security**: Yes (heals after key compromise)

**Group Encryption**:
- **Algorithm**: MLS (Messaging Layer Security) RFC 9420
- **TreeKEM**: Efficient key updates for large groups
- **Epoch-based**: New encryption key per member change
- **Authentication**: Ed25519 signatures on all operations

### 2. Authentication

**Passkeys (WebAuthn)**:
- **Standard**: FIDO2 / WebAuthn Level 2
- **Authenticators**: Platform (FaceID, TouchID, Windows Hello) and roaming (YubiKey)
- **No Passwords**: Eliminates phishing attacks
- **User Verification**: Required for all operations

**DPoP (Demonstrating Proof-of-Possession)**:
- **RFC**: RFC 9449
- **Binding**: Access tokens bound to client public key
- **Replay Protection**: JTI (JWT ID) nonce tracking
- **Rotation**: Keys rotated every 7 days

### 3. Transport Security

**TLS Configuration**:
- **Protocol**: TLS 1.3 only (1.2 disabled)
- **Cipher Suites**: Only AEAD ciphers (ChaCha20-Poly1305, AES-256-GCM)
- **Forward Secrecy**: ECDHE key exchange
- **Certificate**: Let's Encrypt with OCSP stapling

**Security Headers**:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'strict-dynamic' 'nonce-{random}'; object-src 'none'; base-uri 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 4. Data Protection

**At Rest**:
- **Database Encryption**: AES-256-GCM (GCP-managed keys)
- **Private Key Storage**: Encrypted with user's device key
- **Backup Encryption**: Encrypted before leaving production environment

**In Transit**:
- **E2EE**: Client-to-client encryption
- **TLS 1.3**: All API communication
- **No Cleartext**: Message plaintext never touches servers

**Key Management**:
- **Rotation**: Signing keys rotated every 30 days
- **HSM**: Hardware Security Modules for production keys
- **Separation**: Different keys for signing, encryption, authentication
- **Backup**: Encrypted key backups stored in separate region

### 5. Infrastructure Security

**Cloud Environment**:
- **Provider**: Google Cloud Platform (GCP)
- **Region**: us-central1 (primary), europe-west1 (DR)
- **Network**: Private VPC with firewall rules
- **DDoS Protection**: Cloudflare + GCP Cloud Armor

**Kubernetes**:
- **RBAC**: Role-Based Access Control
- **Network Policies**: Deny-all default, explicit allow rules
- **Pod Security**: Restricted PSP, no privileged containers
- **Secrets**: Stored in GCP Secret Manager, not in Git

**CI/CD Security**:
- **SLSA L3**: Build provenance attestation
- **Cosign**: Keyless signing with OIDC
- **SBOM**: CycloneDX software bill of materials
- **Vulnerability Scanning**: Trivy on every build

## Security Practices

### 1. Development Security

**Code Review**:
- All code reviewed by 2+ engineers
- Security-sensitive code (crypto, auth) reviewed by security team
- Automated checks: ESLint, TypeScript strict mode, SonarQube

**Testing**:
- Unit tests: 31/31 passing (crypto + auth)
- E2E tests: Playwright for full workflows
- Security tests: OWASP ZAP, Burp Suite scans
- Penetration testing: Annual third-party pentests

**Dependencies**:
- Automated scanning: Dependabot, Snyk
- Minimal dependencies: Reduce attack surface
- License compliance: No AGPL/GPL in production
- SBOM: Published for transparency

### 2. Operational Security

**Access Control**:
- **Principle of Least Privilege**: Minimal access for employees
- **MFA Required**: All production access requires MFA
- **Audit Logging**: All access logged and monitored
- **Session Timeout**: 15 minutes idle timeout

**Monitoring & Alerting**:
- **Prometheus**: Metrics for crypto operations, auth events
- **Grafana**: Real-time dashboards
- **PagerDuty**: 24/7 on-call rotation
- **SIEM**: Security Information and Event Management

**Incident Response**:
- **Runbooks**: Documented procedures for common incidents
- **Response Time**: < 15 minutes for critical incidents
- **Communication**: Status page updates, user notifications
- **Post-Mortem**: Root cause analysis after every incident

### 3. Privacy & Compliance

**Data Minimization**:
- Collect only what's necessary
- Delete data when no longer needed
- Anonymize analytics

**Regulatory Compliance**:
- **GDPR**: EU General Data Protection Regulation
- **CCPA**: California Consumer Privacy Act
- **SOC 2 Type II**: (in progress)
- **HIPAA**: (not applicable, no health data)

**Transparency**:
- Open source crypto code: https://github.com/pussycat186/Atlas/tree/main/packages/crypto
- Transparency reports: Annual government data request reports
- Trust Portal: https://trust.atlas.dev (SBOM, provenance, verification)

## Security Audits & Certifications

### Third-Party Audits

| Audit Type | Frequency | Last Audit | Next Audit |
|------------|-----------|------------|------------|
| Penetration Test | Annual | (Pending) | Q1 2026 |
| Code Audit (Crypto) | Annual | (Pending) | Q4 2025 |
| SOC 2 Type II | Annual | (In Progress) | Q2 2026 |
| GDPR Compliance | Annual | (Pending) | Q1 2026 |

### Bug Bounty Statistics

- **Reports Received**: (Program launching Q4 2025)
- **Vulnerabilities Fixed**: 
- **Average Response Time**: < 24 hours
- **Bounties Paid**: 

## Security Contact

**Security Team**: security@atlas.dev  
**PGP Key**: Available at https://trust.atlas.dev/pgp  
**Response Time**: < 24 hours for acknowledgment

**Emergency**: For urgent security issues, include "[URGENT]" in subject line.

## Responsible Disclosure Policy

We follow coordinated disclosure:

1. **Report**: Submit vulnerability via security@atlas.dev
2. **Acknowledge**: We acknowledge within 24 hours
3. **Investigate**: We investigate and confirm the issue
4. **Fix**: We develop and deploy a fix (7-30 days)
5. **Notify**: We notify affected users (if needed)
6. **Disclose**: We publish advisory after fix deployed (90 days max)

**Public Disclosure**:
- After patch is deployed to all users
- Minimum 90 days from initial report
- Coordinated with reporter

## Security Commitments

We commit to:
- ✅ **No Backdoors**: We will never implement backdoors or golden keys
- ✅ **Open Crypto**: Cryptography code is open source
- ✅ **Transparency**: Publish security audits and transparency reports
- ✅ **Responsible Disclosure**: Coordinate with researchers
- ✅ **User First**: Prioritize user security over convenience
- ✅ **Continuous Improvement**: Regular audits and updates

## Security Roadmap

**Q4 2025**:
- [ ] Launch bug bounty program
- [ ] Complete first penetration test
- [ ] Achieve SOC 2 Type II certification (in progress)

**Q1 2026**:
- [ ] Implement key escrow (optional, user-controlled)
- [ ] Add secure multi-device sync
- [ ] Deploy hardware security key support

**Q2 2026**:
- [ ] Post-quantum cryptography (Kyber, Dilithium)
- [ ] Formal verification of crypto implementation

---

**Questions?** security@atlas.dev  
**Updates**: https://trust.atlas.dev/security  
**Version**: 2.0 (October 22, 2025)
