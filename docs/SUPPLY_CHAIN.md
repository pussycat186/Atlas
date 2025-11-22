# Atlas Supply Chain Security

## 1. SBOM (Software Bill of Materials)

Format: CycloneDX JSON  
Coverage: All packages, OS dependencies, container base images

## 2. SLSA Provenance

Level: SLSA L3  
Builder: GitHub Actions với OIDC  
Artifacts: Container images, binaries

## 3. Signing

Tool: Cosign (Sigstore)  
Keyless signing: ✓ (OIDC identity)  
Verification: Public transparency log

## 4. Policies (OPA/Rego)

- No unsigned images
- SBOM required
- Known vulnerabilities blocked (Trivy)
- License compliance

## 5. CI/CD Gates

| Gate | Tool | Threshold | Blocking |
|------|------|-----------|----------|
| Vulnerability Scan | Trivy | HIGH: 0 | ✓ |
| SBOM Generation | Syft | Required | ✓ |
| Signature | Cosign | Required | ✓ |
| License Check | OPA | Approved only | ✓ |

---

**Ngày tạo**: 2025-10-21  
**Tuân thủ**: SLSA L3, Sigstore
