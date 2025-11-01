# Pull Request: Atlas v2 Security-Core (Agent-First)

## 📋 Summary

This PR introduces a complete scaffold for Atlas Messenger v2, rebuilt from scratch on an orphan branch with an **Agent-First** and **Security-Core** architecture. This is a clean slate rebuild that replaces the existing codebase while preserving repository secrets.

**Branch**: `reboot/atlas-security-core` → `main`  
**Type**: Major architectural change (M0 scaffold)  
**Status**: ✅ Ready for Review

---

## 🎯 Objectives

1. **Agent-First Development**: All code is designed to be built and verified by autonomous agents with guardrails
2. **Security-Core**: Security is the foundation, not an afterthought
3. **E2EE First**: End-to-end encryption is mandatory, not optional
4. **Verifiable Trust**: Public receipts, JWKS, SBOM, SLSA provenance, Cosign signatures
5. **Vietnamese-First**: All documentation and code comments in Vietnamese

---

## 📦 What's Included

### 1. Master Specification
- **`/atlas.md`**: Complete 26-section specification covering:
  - Product vision and competitive positioning
  - Threat model and security architecture
  - Cryptography stack (Double Ratchet, MLS, RFC 9421, RFC 9449)
  - Web hardening (CSP, HSTS, COOP, COEP)
  - Anti-abuse (PoW, rate limiting, reputation)
  - CI/CD gates and Definition of Done
  - Agent-First workflow and guardrails

### 2. Cryptography Stubs (`/crypto/`)
- **`double-ratchet.ts`**: Double Ratchet implementation stub with Vietnamese comments
  - Forward Secrecy (FS) and Post-Compromise Security (PCS)
  - X25519 key exchange, HKDF derivation, AEAD encryption
- **`dpop.ts`**: DPoP (RFC 9449) proof generation and verification
  - Anti-replay with JTI tracking
  - JWT-based proof-of-possession
- **`http-signature-verify.ts`**: HTTP Message Signatures (RFC 9421)
  - Receipt verification with JWKS lookup
  - PQC algorithm support (future)
- **`tests/double-ratchet.test.ts`**: Unit test skeleton

### 3. Architecture Diagrams (`/diagrams/`)
- **`mls-sequence.svg`**: MLS (RFC 9420) sequence diagram showing TreeKEM and epochs
- **`architecture-overview.svg`**: Complete system architecture (client, gateway, services, infra)

### 4. UI Components (`/ui/`)
- **`components/OnboardingPasskey.tsx`**: Passkey/WebAuthn onboarding flow
- **`components/ChatView.tsx`**: Chat interface with E2EE indicators and lock badge tap-to-verify
- **`components/VerifyPortal.tsx`**: Trust Portal for receipt verification with QR scan
- **`components/SettingsPanel.tsx`**: Settings with PQC toggle, JWKS rotation, privacy controls
- **`styles/tokens.json`**: Design tokens (colors #0A2540/#00D4AA, typography, spacing)
- **`a11y-checklist.md`**: WCAG 2.1 Level AA compliance checklist
- **`wireframes/`**: Placeholder wireframes for all screens

### 5. API Specification (`/api/`)
- **`openapi.yaml`**: OpenAPI 3.1 specification with:
  - `POST /messages`: Send E2EE messages
  - `GET /receipts/{id}`: Fetch receipts
  - `POST /verify`: Verify receipt signatures
  - `GET /.well-known/jwks.json`: Public JWKS
  - `POST /dpop/nonce`: Get DPoP nonce
  - Complete schemas: Envelope, Receipt, JWKS, Error
- **`README.md`**: API usage guide with curl examples

### 6. Microservices (`/services/`)
Documentation stubs for:
- **chat-delivery**: Message routing and receipt generation
- **key-directory**: JWKS hosting and key rotation
- **identity**: User management and Passkey registry
- **media**: E2EE attachment handling
- **risk-guard**: Anti-abuse and reputation scoring

### 7. Infrastructure (`/infra/cloud-run/`)
Cloud Run YAML configs for all services:
- CPU: 1, Memory: 512Mi
- Autoscaling: min 0, max 3
- Concurrency: 80, Timeout: 300s
- Environment variables with Secret Manager refs

### 8. Trust Portal (`/trust-portal/`)
- **`index.html`**: Static portal showing JWKS, SBOM, provenance, SLO, gates
- **`styles.css`**: Styling with Atlas design system
- Public transparency and verifiability

### 9. CI/CD Workflows (`/.github/workflows/`)
Placeholder workflows for:
- **lhci.yml**: Lighthouse CI (threshold ≥0.90)
- **k6.yml**: Performance tests (p95 ≤200ms, error <1%)
- **playwright.yml**: E2E tests (Passkey, Chat, Verify)
- **conftest-opa.yml**: Policy enforcement (CSP/HSTS required)
- **cosign-verify.yml**: Signature verification
- **CODEOWNERS**: Security team approval required

### 10. Documentation (`/docs/`)
- **THREAT_MODEL.md**: STRIDE analysis with risk ratings
- **WHITEPAPER_CRYPTO.md**: Cryptography design and proofs
- **SUPPLY_CHAIN.md**: SBOM, SLSA L3, Cosign workflow
- **RUNBOOKS.md**: Incident response procedures
- **PRIVACY.md**: Privacy policy (GDPR-ready)

### 11. Operations (`/ops/`)
- **cost_model.csv**: GCP cost estimates (~$237/month baseline)

### 12. Evidence (`/evidence/`)
- **validation.txt**: Comprehensive validation report (Vietnamese)
- **sources.txt**: Documentation of sources (no external network calls)

---

## ✅ Validation Results

### Static Checks
- ✅ OpenAPI 3.1 structure valid
- ✅ Cloud Run YAMLs valid (5/5 services)
- ✅ GitHub Workflow YAMLs valid (5/5 workflows)
- ✅ SVG diagrams valid XML
- ✅ All required paths present

### Security
- ✅ No secrets exposed
- ✅ No hardcoded credentials
- ✅ Placeholders only for sensitive data
- ✅ Secret Manager references configured

### Code Quality
- ✅ All crypto modules have Vietnamese comments
- ✅ TODOs clearly marked for production implementation
- ✅ No external network code
- ✅ Deterministic outputs

### Acceptance Criteria
- ✅ Exact directory tree exists
- ✅ Valid placeholders for all components
- ✅ OpenAPI 3.1 parses correctly
- ✅ Cloud Run YAMLs parse correctly
- ✅ No external network calls made
- ✅ Evidence files present
- ❌ **No blockers identified**

---

## 🚫 Out of Scope (by design)

This is a **scaffold/stub** PR. The following are intentionally NOT implemented yet:
- Actual crypto implementations (stubs only)
- Real Passkey/WebAuthn integration
- Actual JWKS generation and signing
- Container image builds
- Deployed infrastructure
- Real unit test execution
- Actual CI/CD pipeline runs

**Next steps** after PR merge:
1. Implement crypto with Web Crypto API
2. Build actual Passkey integration
3. Create container images with Cosign signing
4. Setup OIDC with GCP
5. Deploy to Cloud Run staging
6. Setup monitoring and SLO tracking

---

## 📊 Impact Analysis

### Breaking Changes
⚠️ **Yes - this replaces the entire codebase**
- Orphan branch created from scratch
- All previous code removed (kept in `main` history)
- New architecture and structure

### Migration Path
1. This PR gets reviewed and approved
2. Merge to `main` (or create new `v2` branch)
3. Archive old code in separate branch if needed
4. Implement production features incrementally
5. Deploy when DoD criteria met

### Repository Secrets
✅ **Preserved** - No secrets were modified or exposed

---

## 🔍 Review Focus Areas

Please pay special attention to:

1. **Architecture**: Is the overall structure sound?
2. **Security Design**: Are the crypto primitives and hardening measures appropriate?
3. **API Design**: Is the OpenAPI spec clear and complete?
4. **Completeness**: Are there any critical missing pieces for M0?
5. **Vietnamese Documentation**: Is the language clear and professional?

---

## 📝 Checklist

- [x] Branch created from orphan
- [x] All files created per specification
- [x] YAML files validated
- [x] No secrets exposed
- [x] Evidence documentation complete
- [x] Vietnamese comments in code
- [x] Validation report created
- [ ] Security team review (required)
- [ ] Architecture review (required)
- [ ] Final approval (2+ reviewers, 1 security)

---

## 🎉 Credits

**Agent**: GitHub Copilot  
**Specification**: Agent-First, Security-Core  
**Language**: Vietnamese-first with English docs where needed  
**Date**: 2025-10-21

**Validation Report**: See `/evidence/validation.txt`

---

## 🔗 References

- [RFC 9421 - HTTP Message Signatures](https://datatracker.ietf.org/doc/html/rfc9421)
- [RFC 9449 - DPoP](https://datatracker.ietf.org/doc/html/rfc9449)
- [RFC 9420 - MLS](https://datatracker.ietf.org/doc/html/rfc9420)
- [SLSA Framework](https://slsa.dev/)
- [Sigstore/Cosign](https://www.sigstore.dev/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Ready for Review**: ✅ YES  
**Blockers**: ❌ NONE  
**Estimated Review Time**: 2-4 hours
