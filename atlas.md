# Atlas Ecosystem — Đặc tả hợp nhất (Agent‑First, Security‑Core)

> Mục tiêu: mô tả đầy đủ sản phẩm, kiến trúc, bảo mật, vận hành, CI/CD, trách nhiệm và quy trình **Agent‑First** để tái dựng toàn bộ dự án ngay trong repo hiện tại. Tất cả công việc dev được ủy thác cho Agents theo chuẩn kiểm chứng. Không đạo nhái; chỉ học chuẩn mở và nâng tầm.

**Ngày**: 2025‑10‑21  
**Repo đích**: `pussycat186/Atlas`  
**Triết lý**: Security là "nhân", VN‑first, minh bạch kiểm chứng.

## 0) Tóm tắt sản phẩm

* **Atlas Messenger**: nền tảng nhắn tin E2EE bắt buộc, tự‑kiểm‑chứng bằng receipts ký số, JWKS công khai. UX mạch lạc, tin cậy cao.
* **Atlas Security Core**: lõi mật mã + hardening + chống lạm dụng + supply‑chain trust + SLO khắt khe.
* **Trust Portal**: công bố SBOM, SLSA provenance, Cosign verify, kết quả headers/LHCI/k6/Playwright, SLO.
* **Agent‑First**: Agents thực thi, con người duyệt. Mọi thay đổi có evidence.

**Ưu tiên M0**: E2EE 1‑1 (Double Ratchet), Receipts RFC 9421, DPoP RFC 9449, CSP/TT/COOP/COEP/HSTS, PoW/ratelimit/uy tín, OpenAPI, CI gates, canary Cloud Run.

## 1) Mục tiêu cạnh tranh

* Không sao chép tính năng Telegram/Signal; chỉ học chuẩn mở (IETF/W3C/Sigstore) rồi **nâng tầm**.
* Mục tiêu kỹ thuật: VN p95 ≤150 ms; error <1%; uptime 99.99%; verify receipt <5 s; TTI PWA <2 s; a11y AA.
* Mục tiêu sản phẩm: niềm tin kiểm chứng được, UX Việt hóa, minh bạch.

## 2) Mô hình đe dọa & phạm vi

Đe dọa: giả mạo/sửa đổi tin; XSS/phishing; replay/misuse tokens; supply‑chain chèn mã; spam/DoS; lộ khóa/metadata.  
Tài sản: nội dung, khóa, định danh, toàn vẹn lịch sử, bí mật build/deploy.  
Giới hạn: metadata tối thiểu, không lưu plaintext sau E2EE, không key dài hạn trong CI.

## 3) Kiến trúc tổng thể

Thành phần: Client (PWA: Passkey/WebAuthn, DPoP, receipt verify), API Gateway (TLS1.3, DPoP), Services: chat‑delivery, key‑directory, media, risk‑guard, identity.  
Hạ tầng: Cloud Run + HTTPS LB/CDN; Artifact Registry; Secret Manager; Logging/Monitoring.  
Luồng: Onboard Passkey→DPoP; Send E2EE→Receipt ký số; Verify qua JWKS tại `/verify`.

## 4) Mật mã & quản lý khóa

1‑1: Double Ratchet (X25519→HKDF; AEAD ChaCha20‑Poly1305/AES‑GCM). Nhóm: MLS (RFC 9420) TreeKEM/epochs/UpdatePath.  
PQC canary: ML‑KEM‑768 (KEM), ML‑DSA‑3 (chữ ký) qua flag `PQC=true`.  
JWKS: `kid,kty,alg,use,x/crv,…`; rotation có metadata; `/.well‑known/jwks.json`.  
Envelope:

```json
{"msg_id":"…","conv_id":"…","sender_id":"…","epoch":123,"ciphertext":"<AEAD>","aad":"<min>","ts":1739999999}
```

## 5) Receipts & DPoP

Receipts (RFC 9421): base=(request‑target,date,content‑digest,@signature‑params); chữ ký Ed25519; cờ PQC.  
DPoP (RFC 9449): proof `htm,htu,iat,jwk,jti`; server khớp htm/htu/time + anti‑replay.

## 6) Web hardening

CSP strict + Trusted Types; COOP same‑origin; COEP require‑corp; HSTS preload; SRI; SameSite=Strict; Referrer‑Policy no‑referrer; Permissions‑Policy tối thiểu.

## 7) Anti‑abuse

PoW nhẹ (Argon2id+khuếch đại, tiền tố 0); Token Bucket; uy tín Beta‑Bernoulli.

## 8) API (OpenAPI 3.1)

POST /messages; GET /receipts/{id}; POST /verify; GET /.well‑known/jwks.json; POST /dpop/nonce.  
Schemas: Envelope, Receipt, JWKS, Error.

## 9) Dữ liệu cốt lõi

User(id, public_keys[], passkey creds, devices); Conversation(id, members[], policy, epoch); Message(meta+envelope, receipt_ref); Attachment(ref,digest,size,class).

## 10) Supply chain & chính sách

SBOM CycloneDX; SLSA L3 provenance; Cosign sign/verify; OPA/Rego enforce; gate đỏ dừng.

## 11) CI/CD, Gates & DoD

Pipeline: inventory→build→test→sign→deploy→verify→evidence.  
Gates: LHCI≥0.90; k6 p95≤200ms,error<1%; Playwright luồng chuẩn; Headers PASS; Cosign/SLSA/SBOM PASS.  
Stop policy: BLOCKER_* khi thiếu secrets/gate đỏ.  
DoD: PWA prod; E2EE 1‑1 GA; `/verify` công khai; JWKS+rotation; canary/rollback; evidence đầy đủ; 30 ngày xanh; SOC2/ISO READY.

## 12) Hạ tầng & SLO

Cloud Run: canary 10%→50%→100%; rollback <60s; concurrency 80; CPU 1; RAM 512Mi; min 0; max 3; timeout 300s.  
Cron/monitoring: headers/15m, quality/daily, receipts+JWKS/hourly, supply_chain/weekly.  
SLO: VN p95≤150ms; SEA≤300ms; error<1%; uptime 99.99%.

## 13) Observability

Logs JSON có cấu trúc, redact PII; metrics p50/p95, error rate, CSP violations, TLS errors, queue depth; alerts LHCI/k6/Playwright/OPA/Cosign.

## 14) Quyền riêng tư

Minimization; không lưu plaintext; tách PII và logs; retention rõ; telemetry tối thiểu; opt‑out.

## 15) UX VN‑first

Onboarding 3 bước; text +20%, 44px touch; nhãn Việt hóa; PWA nhanh; offline cache 50 tin, chỉ báo sync.

## 16) Thiết kế giao diện (Atlas Secure Minimalist)

Màu: #0A2540 / #00D4AA / gray; Roboto VN; AA; micro‑animation <100ms.  
Màn hình: Onboarding; Chat View (lock badge tap‑to‑verify; tree epochs); Verify Portal (scan QR giả lập; filter kid/epoch); Settings (PQC toggle, JWKS rotation slider, Privacy slider, Eco‑Score).  
Chỉ tiêu UX: TTI <2s; p95 scroll <100ms; verify <5s.

## 17) Monetization

Basic (miễn phí); Pro (~$4.99/tháng); Enterprise; Pay‑per‑Verify; Verification Marketplace; Eco‑badges.

## 18) Trust Portal

Công bố: JWKS; 10 releases; SBOM; provenance; Cosign logs; kết quả gates; SLO; mẫu receipts.

## 19) Breakthroughs (nâng tầm)

PQC‑first canary; Meta‑Verification (Merkle receipts); Emotion‑Aware E2EE (local ML → PoW); Eco‑Trust Chain; Multidimensional Privacy (WebXR); Adaptive Encryption.

## 20) Agent‑First (vai trò & guardrails)

Agents: Security‑Crypto, UI/UX, API‑Spec, Infra‑CI, Trust‑Portal, Observability, Privacy‑Compliance.  
Guardrails: không secrets; OIDC cho GCP; tôn trọng license; output đúng paths; /evidence/validation.txt & /evidence/BLOCKER.md.

## 21) Prompts mẫu (rút gọn)

One‑shot Builder: sinh toàn bộ cây; refine‑crypto/UI/CI khi cần.

## 22) Quy trình reset repo an toàn

Nhánh orphan; xóa cây cũ; scaffold mới; giữ secrets; CODEOWNERS; OIDC.

## 23) Git/Issue/PR

Branching: main bảo vệ; feat/*, fix/*, sec/*, ops/*; Conventional Commits; templates; PR checks + 2 approvals (1 security).

## 24) Runbooks

Key leak; regression p95; supply‑chain alert → rotate/block/rollback/sign/announce.

## 25) Kiểm thử & chấp nhận

Unit crypto/http‑sig/dpop; E2E Passkey→send→verify; Perf k6; A11y cơ bản.

## 26) Lộ trình

M0: E2EE 1‑1, receipts, DPoP, hardening, CI, canary.  
M1: MLS GA, Transparency Log, Trust Portal mở.  
M2: Audit độc lập, SDK mở, residency, multi‑region.
