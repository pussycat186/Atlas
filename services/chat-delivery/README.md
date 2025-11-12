# Chat Delivery Service

## Mô tả

Service chịu trách nhiệm routing và delivery tin nhắn E2EE.
Tạo receipts ký số cho mỗi tin nhắn được gửi.

## Chức năng chính

- **Message routing**: Chuyển tin nhắn đến người nhận đúng
- **Receipt generation**: Tạo HTTP Message Signature receipts (RFC 9421)
- **Queue management**: Quản lý hàng đợi tin nhắn chưa gửi
- **Delivery tracking**: Theo dõi trạng thái gửi

## Tech Stack

- Runtime: Node.js 20+ hoặc Deno
- Framework: Hono hoặc Express
- Queue: Redis hoặc Cloud Pub/Sub
- Storage: Firestore (metadata only, no plaintext)

## Endpoints

- `POST /deliver` - Gửi tin nhắn
- `GET /status/{messageId}` - Trạng thái delivery
- `POST /receipt` - Tạo receipt

## Environment Variables

- `JWKS_PRIVATE_KEY_ID` - Kid của khóa ký receipt
- `REDIS_URL` - URL của Redis (queue)
- `FIRESTORE_PROJECT_ID` - GCP project ID

## Deployment

Cloud Run:
```bash
gcloud run deploy chat-delivery \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated=false
```

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration
```

---

**Ngày tạo**: 2025-10-21  
**Trạng thái**: Stub - chưa triển khai
