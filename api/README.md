# Atlas API

## Giới thiệu

Thư mục này chứa đặc tả OpenAPI 3.1 cho Atlas Messenger API.

## File chính

- `openapi.yaml`: Đặc tả API đầy đủ

## Cách sử dụng

### 1. Lint OpenAPI spec

Sử dụng `@stoplight/spectral-cli`:

```bash
npm install -g @stoplight/spectral-cli
spectral lint openapi.yaml
```

### 2. Generate docs

Sử dụng `redoc-cli`:

```bash
npm install -g redoc-cli
redoc-cli bundle openapi.yaml -o api-docs.html
```

### 3. Mock server

Sử dụng `prism`:

```bash
npm install -g @stoplight/prism-cli
prism mock openapi.yaml
```

Server sẽ chạy ở `http://localhost:4010`

### 4. Validate requests

```bash
# Validate request body
prism mock openapi.yaml --errors
```

## Endpoints chính

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/messages` | Gửi tin nhắn E2EE |
| GET | `/receipts/{id}` | Lấy receipt theo ID |
| POST | `/verify` | Xác thực receipt/chữ ký |
| GET | `/.well-known/jwks.json` | JWKS công khai |
| POST | `/dpop/nonce` | Lấy DPoP nonce |

## Security

Tất cả endpoints (trừ `/.well-known/jwks.json` và `/dpop/nonce`) yêu cầu:

1. **DPoP proof** trong header `DPoP`
2. **Access token** trong header `Authorization: DPoP <token>`

### DPoP Header Example

```
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwieCI6Imw4dEZyaHgtMzR0VjNoUklDUkRZOXpDa0RscEJoRjQyVVFVZldWQVdCRnMiLCJ5IjoiOVZFNGpmX09rX282NHpiVFRsY3VOSmFqSG10NnY5VERWclUwQ2R2R1JEQSIsImNydiI6IlAtMjU2In19.eyJqdGkiOiItQnd...
```

## Testing

### cURL examples

```bash
# 1. Lấy DPoP nonce
curl -X POST https://api.atlas.example/dpop/nonce

# 2. Gửi tin nhắn (cần DPoP proof)
curl -X POST https://api.atlas.example/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: DPoP <access_token>" \
  -H "DPoP: <dpop_proof_jwt>" \
  -d '{
    "msg_id": "msg_123",
    "conv_id": "conv_abc",
    "sender_id": "user_alice",
    "epoch": 0,
    "ciphertext": "base64_encrypted",
    "aad": "base64_aad",
    "ts": 1729533600
  }'

# 3. Lấy JWKS
curl https://api.atlas.example/.well-known/jwks.json

# 4. Xác thực receipt
curl -X POST https://api.atlas.example/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receipt_id": "receipt_abc123"
  }'
```

## Schemas

### Envelope

Envelope chứa tin nhắn E2EE:

```json
{
  "msg_id": "msg_20251021_abc123",
  "conv_id": "conv_xyz789",
  "sender_id": "user_alice",
  "epoch": 0,
  "ciphertext": "base64_encrypted_content",
  "aad": "base64_additional_auth_data",
  "ts": 1729533600
}
```

### Receipt

Receipt ký số:

```json
{
  "receipt_id": "receipt_abc123xyz",
  "message_id": "msg_20251021_abc123",
  "signature": "base64_signature",
  "signature_input": "sig1=(\"@request-target\" \"date\");created=1234;keyid=\"key-2025-01\"",
  "kid": "key-2025-01",
  "algorithm": "ed25519",
  "created_at": 1729533600,
  "pqc": false
}
```

### JWKS

```json
{
  "keys": [
    {
      "kid": "key-2025-01",
      "kty": "OKP",
      "alg": "EdDSA",
      "use": "sig",
      "crv": "Ed25519",
      "x": "base64_public_key"
    }
  ]
}
```

## Rate Limiting

Default limits:
- `/messages`: 10 req/min per user
- `/verify`: 100 req/min
- `/.well-known/jwks.json`: 1000 req/min (cached)

Headers trả về khi rate limited:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1729533660
```

## Versioning

API sử dụng URL versioning: `/v1/...`

Breaking changes sẽ tạo version mới.

## References

- [RFC 9421 - HTTP Message Signatures](https://datatracker.ietf.org/doc/html/rfc9421)
- [RFC 9449 - DPoP](https://datatracker.ietf.org/doc/html/rfc9449)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)

---

**Ngày tạo**: 2025-10-21  
**Phiên bản**: 1.0.0
