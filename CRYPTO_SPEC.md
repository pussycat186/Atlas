# ATLAS CRYPTOGRAPHIC SPECIFICATION

**Generated**: 2025-09-17T13:15:00Z  
**Version**: 1.0.0  
**Purpose**: End-to-End Encryption with Perfect Forward Secrecy

## Overview

This specification defines the cryptographic protocols for Atlas message encryption, key exchange, and integrity protection. All protocols are designed for backward compatibility with existing clients while providing strong security guarantees for new implementations.

## Key Exchange Protocol

### X3DH (Extended Triple Diffie-Hellman)

**Purpose**: Establish shared secret between two parties without prior communication

**Participants**:
- Alice (sender) with identity key pair (IK_A, IK_A_priv)
- Bob (receiver) with identity key pair (IK_B, IK_B_priv)
- Bob's signed prekey (SPK_B, SPK_B_priv) with signature Sig(IK_B_priv, SPK_B)
- Bob's one-time prekey (OPK_B, OPK_B_priv) [optional]

**Protocol Steps**:
1. Alice generates ephemeral key pair (EK_A, EK_A_priv)
2. Alice computes shared secrets:
   - DH1 = ECDH(EK_A_priv, IK_B)
   - DH2 = ECDH(IK_A_priv, SPK_B)
   - DH3 = ECDH(EK_A_priv, SPK_B)
   - DH4 = ECDH(EK_A_priv, OPK_B) [if OPK_B exists]
3. Alice computes master secret: K = KDF(DH1 || DH2 || DH3 || DH4)
4. Alice sends: (IK_A, EK_A, SPK_B, OPK_B, encrypted_message)

**Key Derivation Function (KDF)**:
```
KDF(input) = HKDF-SHA256(salt="AtlasX3DH", ikm=input, info="AtlasKeyExchange", L=32)
```

### Noise Protocol Framework

**Alternative**: Noise_XX_25519_ChaChaPoly_BLAKE2s

**Handshake Pattern**:
```
XX:
  -> e
  <- e, ee, s, es
  -> s, se
```

**Cipher Suite**:
- **Key Agreement**: X25519
- **Cipher**: ChaCha20-Poly1305
- **Hash**: BLAKE2s

## Double Ratchet

### State Variables

**Root Key (RK)**: 32-byte root key for key derivation
**Chain Keys**: Per-direction chain keys for message encryption
**Message Keys**: One-time keys for individual message encryption
**Header Keys**: Keys for encrypting message headers

### Key Derivation

**Root Key Update**:
```
RK_new = KDF(RK_old, DH_output)
```

**Chain Key Update**:
```
CK_new = KDF(CK_old, "AtlasChainKey")
```

**Message Key Derivation**:
```
MK = KDF(CK, "AtlasMessageKey")
```

**Header Key Derivation**:
```
HK = KDF(CK, "AtlasHeaderKey")
```

### Message Encryption

**Header Encryption**:
```
header = (sender_ratchet_key, message_number, previous_chain_length)
encrypted_header = ChaCha20-Poly1305(HK, header, AAD)
```

**Payload Encryption**:
```
encrypted_payload = ChaCha20-Poly1305(MK, payload, AAD)
```

**Additional Authenticated Data (AAD)**:
```
AAD = senderID || deviceID || quorum_params || timestamp || schema_version
```

## Message Envelope Schema

### Version 1.0 (Legacy - Backward Compatible)
```json
{
  "app": "string",
  "record_id": "uuid",
  "payload": "string",
  "meta": {
    "timestamp": "iso8601",
    "sender": "string"
  }
}
```

### Version 2.0 (Enhanced Security)
```json
{
  "schema_version": "2.0",
  "app": "string",
  "record_id": "uuid",
  "payload": "string",
  "meta": {
    "timestamp": "iso8601",
    "sender": "string"
  },
  "security": {
    "nonce": "base64",
    "counter": "number",
    "device_id": "string",
    "timestamp": "iso8601",
    "aad": "base64"
  },
  "encryption": {
    "header": "base64",
    "payload": "base64",
    "ratchet_key": "base64"
  }
}
```

### Backward Compatibility Rules

1. **Version Detection**: Check for `schema_version` field
2. **Legacy Support**: v1.0 messages processed without security controls
3. **Enhanced Processing**: v2.0 messages require all security validations
4. **Migration Path**: Gradual migration with feature flags

## Cryptographic Primitives

### Hash Functions
- **SHA-256**: General purpose hashing
- **BLAKE2s**: High-performance hashing for Noise protocol
- **HKDF-SHA256**: Key derivation function

### Symmetric Encryption
- **ChaCha20-Poly1305**: Authenticated encryption
- **AES-256-GCM**: Alternative authenticated encryption

### Asymmetric Cryptography
- **X25519**: Elliptic curve Diffie-Hellman
- **Ed25519**: Digital signatures
- **P-256**: NIST curve for WebAuthn compatibility

### Key Sizes
- **Symmetric Keys**: 256 bits (32 bytes)
- **X25519 Keys**: 256 bits (32 bytes)
- **Ed25519 Keys**: 256 bits (32 bytes)
- **Nonces**: 96 bits (12 bytes) for ChaCha20-Poly1305

## Key Lifecycle Management

### Key Rotation Triggers
1. **Time-based**: Rotate every 24 hours
2. **Volume-based**: Rotate after 1000 messages
3. **Security events**: Rotate on compromise detection
4. **Device revocation**: Rotate on device removal

### Key Storage
- **Device Keys**: Secure enclave when available
- **Session Keys**: Memory only, never persisted
- **Backup Keys**: Encrypted with user recovery key

### Key Recovery
1. **User Recovery Key**: Master key for backup decryption
2. **Device Recovery**: WebAuthn-based device restoration
3. **Admin Recovery**: Emergency access with audit trail

## Anti-Replay Protection

### Client-Side
- **Monotonic Counter**: Per-device message counter
- **Nonce Generation**: Cryptographically secure random nonce
- **Timestamp**: Current time in milliseconds
- **Device ID**: Unique device identifier

### Server-Side
- **Counter Validation**: Ensure counter > last seen counter
- **Nonce Tracking**: Reject duplicate nonces
- **Time Window**: Reject messages outside Δ time window
- **Device Binding**: Validate device ID against user

### Time Window (Δ)
- **Default**: 5 minutes (300 seconds)
- **Configurable**: Per-tenant settings
- **Clock Skew**: Allow ±30 seconds tolerance

## Error Handling

### Cryptographic Errors
- **Invalid Key**: Return 400 Bad Request
- **Decryption Failure**: Return 400 Bad Request
- **Replay Attack**: Return 409 Conflict
- **Time Skew**: Return 400 Bad Request

### Error Response Format
```json
{
  "error": "crypto_error",
  "code": "invalid_key",
  "message": "Invalid encryption key provided",
  "timestamp": "iso8601"
}
```

## Test Vectors

### X3DH Test Vector
```
Alice Identity Key: 0x1234...5678
Bob Identity Key: 0x9abc...def0
Bob Signed Prekey: 0x2468...ace0
Bob One-time Prekey: 0x1357...9bdf
Expected Shared Secret: 0xdead...beef
```

### Double Ratchet Test Vector
```
Initial Root Key: 0x0000...0001
Message 1 Chain Key: 0x1111...1111
Message 1 Key: 0x2222...2222
Message 2 Chain Key: 0x3333...3333
Message 2 Key: 0x4444...4444
```

### Known Answer Tests (KAT)

#### KAT 1: Key Derivation
```
Input: 0x0000...0000
Expected: 0x5d4d...7f8a
Actual: [To be computed]
Status: [PASS/FAIL]
```

#### KAT 2: Message Encryption
```
Plaintext: "Hello, Atlas!"
Key: 0x1111...1111
Nonce: 0x2222...2222
Expected Ciphertext: 0x3333...3333
Actual: [To be computed]
Status: [PASS/FAIL]
```

#### KAT 3: Header Encryption
```
Header: {"sender": "alice", "msg_num": 1}
Header Key: 0x4444...4444
Expected: 0x5555...5555
Actual: [To be computed]
Status: [PASS/FAIL]
```

## Implementation Notes

### Performance Considerations
- **Key Caching**: Cache derived keys for performance
- **Batch Operations**: Process multiple messages together
- **Async Operations**: Non-blocking cryptographic operations

### Security Considerations
- **Constant Time**: Use constant-time comparisons
- **Memory Clearing**: Clear sensitive data from memory
- **Side Channels**: Protect against timing attacks

### Compliance
- **FIPS 140-2**: Use FIPS-approved algorithms when required
- **Common Criteria**: Meet EAL4+ requirements
- **NIST Guidelines**: Follow NIST cryptographic guidelines

---

**Next Steps**: Implement cryptographic primitives, generate test vectors, and validate Known Answer Tests.
