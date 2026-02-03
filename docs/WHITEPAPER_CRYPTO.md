# Atlas Cryptography Whitepaper

## Abstract

Atlas Messenger sử dụng mật mã hiện đại để đảm bảo E2EE, PFS, PCS, và non-repudiation.

## 1. E2EE Protocol Stack

### 1.1 Double Ratchet (1-1 Chat)
- **Key Exchange**: X25519 (ECDH)
- **Key Derivation**: HKDF-SHA256
- **Symmetric Encryption**: ChaCha20-Poly1305 hoặc AES-256-GCM
- **Forward Secrecy**: ✓ (mỗi tin dùng key khác nhau)
- **Post-Compromise Security**: ✓ (DH ratchet steps)

### 1.2 MLS (Group Chat)
- **Protocol**: RFC 9420
- **Tree Structure**: TreeKEM (binary tree)
- **Efficiency**: O(log n) updates
- **Epochs**: Mỗi update tạo epoch mới

## 2. HTTP Message Signatures (RFC 9421)
- **Algorithm**: EdDSA (Ed25519)
- **Components**: @request-target, date, content-digest
- **Signature Base**: Canonical serialization
- **Verification**: JWKS công khai

## 3. DPoP (RFC 9449)
- **Proof**: JWT ký bằng ephemeral key
- **Binding**: htm + htu + iat + jti
- **Anti-replay**: JTI tracking (Redis)

## 4. Post-Quantum Cryptography (Canary)
- **KEM**: ML-KEM-768 (Kyber)
- **Signature**: ML-DSA-3 (Dilithium)
- **Hybrid**: Classical + PQC

## 5. Key Management
- **Generation**: crypto.subtle (Web Crypto API)
- **Storage**: IndexedDB (encrypted at rest)
- **Rotation**: JWKS 30 ngày, user keys theo demand

## 6. Security Proofs
- Forward Secrecy: Proof by construction (ratchet)
- Non-repudiation: Signature binding
- Confidentiality: AEAD guarantees

---

**Ngày tạo**: 2025-10-21  
**Tham khảo**: Signal Protocol, MLS RFC 9420, RFC 9421, RFC 9449
