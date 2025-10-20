# Atlas Threat Model

## 1. Tổng quan hệ thống

Atlas Messenger là nền tảng nhắn tin E2EE với kiểm chứng receipts công khai.

**Thành phần chính**:
- Client (PWA): Passkey, E2EE engine, receipt verification
- API Gateway: TLS, DPoP, rate limiting
- Services: chat-delivery, key-directory, identity, media, risk-guard
- Storage: Firestore (metadata only), Secret Manager (keys)

## 2. Tài sản cần bảo vệ

| Tài sản | Giá trị | Tác động nếu mất |
|---------|---------|------------------|
| Nội dung tin nhắn | Cao | Mất quyền riêng tư người dùng |
| Khóa riêng (private keys) | Rất cao | Giả mạo receipts, đọc tin cũ |
| Metadata (ai nhắn với ai) | Trung bình | Phân tích mạng lưới xã hội |
| JWKS private keys | Rất cao | Giả mạo toàn bộ receipts |
| User identity (Passkeys) | Cao | Chiếm đoạt tài khoản |
| Source code & build artifacts | Trung bình | Supply-chain attacks |

## 3. Các đe dọa (STRIDE)

### 3.1 Spoofing (Giả mạo)
- **T1**: Giả mạo tin nhắn → Phòng chống: E2EE + receipts ký số
- **T2**: Giả mạo receipts → Phòng chống: HTTP Message Signature + JWKS công khai
- **T3**: Giả mạo user identity → Phòng chống: Passkey/WebAuthn

### 3.2 Tampering (Sửa đổi)
- **T4**: Sửa đổi tin nhắn đang transit → Phòng chống: TLS 1.3 + E2EE AEAD
- **T5**: Sửa đổi JWKS → Phòng chống: Immutable storage + rotation log
- **T6**: Sửa đổi container images → Phòng chống: Cosign signatures

### 3.3 Repudiation (Chối bỏ)
- **T7**: Người gửi chối tin → Phòng chống: Receipts ký số không thể chối cãi
- **T8**: Server chối delivery → Phòng chống: Transparency log (future)

### 3.4 Information Disclosure (Lộ thông tin)
- **T9**: Lộ nội dung tin nhắn → Phòng chống: E2EE bắt buộc
- **T10**: Lộ metadata → Giảm thiểu: Minimization, không log PII
- **T11**: Lộ khóa riêng → Phòng chống: Secret Manager, OIDC, no keys in CI

### 3.5 Denial of Service (DoS)
- **T12**: Spam tin nhắn → Phòng chống: PoW, rate limit, reputation
- **T13**: DDoS API → Phòng chống: Cloud Armor, rate limit, auto-scaling
- **T14**: Resource exhaustion → Phòng chống: Concurrency limits, timeouts

### 3.6 Elevation of Privilege (Leo thang đặc quyền)
- **T15**: XSS → Phòng chống: CSP strict + Trusted Types
- **T16**: CSRF → Phòng chống: SameSite cookies, DPoP binding
- **T17**: Supply-chain compromise → Phòng chống: SBOM, SLSA L3, Cosign

## 4. Attack Scenarios

### Scenario 1: Active Network Attacker
**Mục tiêu**: Đọc hoặc sửa tin nhắn  
**Mitigations**:
- TLS 1.3 (chống MITM)
- E2EE (chống decrypt)
- HTTP Message Signatures (chống tamper)

### Scenario 2: Compromised Server
**Mục tiêu**: Đọc tin nhắn của users  
**Mitigations**:
- Server không có plaintext (E2EE)
- Server không có private keys để decrypt
- Receipts chỉ chứng thực delivery, không cho phép đọc

### Scenario 3: Malicious Client
**Mục tiêu**: Spam, DDoS, abuse  
**Mitigations**:
- PoW (Proof of Work)
- Rate limiting (Token Bucket)
- Reputation scoring
- DPoP binding (chống token theft)

### Scenario 4: Supply-Chain Attack
**Mục tiêu**: Chèn backdoor vào code/dependencies  
**Mitigations**:
- SBOM + SLSA provenance
- Cosign signature verification
- OPA policy enforcement
- Dependabot alerts

## 5. Out of Scope

- Physical security (GCP infrastructure)
- Social engineering users
- Zero-day trong WebAuthn/browser
- Quantum computers (hiện tại - PQC là future work)

## 6. Risk Rating

| Threat | Likelihood | Impact | Risk | Mitigation Status |
|--------|-----------|--------|------|-------------------|
| T1: Giả mạo tin | Low | High | Medium | ✅ Mitigated (E2EE + receipts) |
| T2: Giả mạo receipts | Low | High | Medium | ✅ Mitigated (JWKS + sig verify) |
| T9: Lộ plaintext | Medium | Critical | High | ✅ Mitigated (E2EE bắt buộc) |
| T10: Lộ metadata | Medium | Medium | Medium | ⚠️ Partially (minimization) |
| T11: Lộ private keys | Low | Critical | Medium | ✅ Mitigated (Secret Manager + OIDC) |
| T12: Spam | High | Medium | High | ✅ Mitigated (PoW + rate limit) |
| T15: XSS | Medium | High | High | ✅ Mitigated (CSP + TT) |
| T17: Supply-chain | Low | High | Medium | ✅ Mitigated (SLSA + Cosign) |

## 7. Recommendations

1. **Ngắn hạn**:
   - ✅ Triển khai E2EE bắt buộc
   - ✅ HTTP Message Signatures
   - ✅ DPoP
   - ⏳ Hardening headers (CSP, HSTS)

2. **Trung hạn**:
   - MLS cho group chat
   - Transparency log cho receipts
   - PQC canary deployment

3. **Dài hạn**:
   - Formal security audit độc lập
   - Bug bounty program
   - SOC2/ISO27001 compliance

---

**Ngày tạo**: 2025-10-21  
**Phiên bản**: 1.0  
**Người review**: Security Team
