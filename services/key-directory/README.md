# Key Directory Service

## Mô tả

Service quản lý JWKS và public keys của users.
Cung cấp endpoint `/.well-known/jwks.json` công khai.

## Chức năng chính

- **JWKS hosting**: Serve JWKS công khai
- **Key rotation**: Rotation khóa định kỳ (mặc định 30 ngày)
- **User key directory**: Tra cứu public keys của users
- **Prekey bundles**: Quản lý prekeys cho Double Ratchet

## Tech Stack

- Runtime: Node.js 20+
- Framework: Fastify
- Storage: Secret Manager (private keys), Firestore (public keys)
- Cache: Cloud CDN

## Endpoints

- `GET /.well-known/jwks.json` - JWKS công khai
- `GET /users/{userId}/keys` - Public keys của user
- `POST /keys/rotate` - Trigger rotation (admin only)

## Key Rotation

Rotation tự động mỗi 30 ngày:
- Tạo cặp khóa mới
- Publish kid mới trong JWKS
- Giữ kid cũ thêm 7 ngày (grace period)
- Xóa kid cũ sau grace period

## Environment Variables

- `KEY_ROTATION_DAYS` - Số ngày rotation (default: 30)
- `JWKS_CACHE_TTL` - TTL cache JWKS (default: 3600s)

## Deployment

```bash
gcloud run deploy key-directory \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

---

**Ngày tạo**: 2025-10-21  
**Trạng thái**: Stub - chưa triển khai
