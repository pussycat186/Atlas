# Atlas Proof Messenger - Product Guide

## 🎯 Product Vision

Atlas Proof Messenger is a **user-first, security-first messaging application** that provides end-to-end encryption with verifiable message receipts. Every message is cryptographically signed and can be independently verified.

## ✨ Key Features

### 1. **Zero-Trust Messaging**
- **E2EE by default**: Every message encrypted end-to-end
- **RFC 9421 Receipts**: Each message has a cryptographic proof of authenticity
- **Verifiable timeline**: Independent verification of message integrity

### 2. **Modern Security**
- **Passkey Authentication**: WebAuthn-based login (no passwords)
- **DPoP Token Binding**: Tokens bound to specific devices (RFC 9449)
- **Post-Quantum Ready**: ML-KEM-768 canary deployment

### 3. **User-Friendly Design**
- **Vietnamese-first UX**: Designed for Vietnamese users
- **Accessibility**: Large text mode, high contrast, keyboard navigation
- **Mobile-optimized**: Responsive design with touch-friendly controls

## 🚀 User Journey

### Onboarding (`/onboarding`)
1. Welcome screen with security badges
2. Passkey creation (Face ID, Touch ID, or PIN)
3. Auto-redirect to chats

### Chats (`/chats`)
- Searchable chat list
- Unread message counts
- Verified badges on all chats
- Large, touch-friendly UI

### Individual Chat (`/chats/[id]`)
- Send/receive messages
- Each message shows "Verified" badge
- Click badge to view full receipt
- Real-time E2EE status

### Verify (`/verify`)
- Paste JSON receipt
- Instant verification
- Shows key ID, algorithm, timestamp
- Educational content about RFC 9421

### Contacts (`/contacts`)
- Add by email or alias
- QR code scanning (coming soon)
- Verified contact badges

### Security (`/security`)
- **DPoP toggle**: Enable/disable token binding
- **PQC slider**: 0-100% post-quantum crypto usage
- **JWKS download**: Get public keys for verification

### Settings (`/settings`)
- Theme: Light / Dark / System
- **Large text mode** ("Hiển thị lớn")
- Notifications
- About & Legal links

## 🔐 Security Architecture

### Message Flow
1. User types message
2. Message encrypted locally (E2EE)
3. Message sent with DPoP proof
4. Recipient decrypts locally
5. Both parties get RFC 9421 receipt

### Verification Flow
```
Message → Sign (ECDSA P-256) → Receipt → Verify (/api/verify)
```

### Receipt Structure
```json
{
  "message": "base64_encoded_content",
  "signature": "sig1=:signature_value:;created=epoch;keyid=kid;alg=ecdsa-p256-sha256",
  "metadata": {
    "kid": "kid-2024-10",
    "algorithm": "ecdsa-p256-sha256",
    "created": 1697500800,
    "verified": true
  }
}
```

## 📱 Routes & Pages

| Route | Purpose | Key Features |
|-------|---------|-------------|
| `/` | Landing page | CTA to onboarding |
| `/onboarding` | User registration | Passkey setup |
| `/chats` | Chat list | Search, unread counts |
| `/chats/[id]` | Chat conversation | Send, verify, receipts |
| `/verify` | Receipt verification | Paste JSON, verify |
| `/contacts` | Contact management | Add by email, QR |
| `/security` | Security settings | DPoP, PQC, JWKS |
| `/settings` | App settings | Theme, accessibility |

## 🎨 Design Tokens

Tokens are generated from `design/tokens/` using Style Dictionary:

```bash
pnpm run tokens:build
```

Tokens include:
- **Core**: Colors, spacing, typography
- **Semantic**: Brand colors, feedback colors
- **Components**: Button variants, card styles

Output:
- CSS variables → `apps/proof-messenger/app/styles/tokens.css`
- TypeScript → `packages/ui-tokens/src/tokens.ts`
- Tailwind theme → `packages/ui-tokens/tailwind.config.js`

## 🧪 Testing

### E2E Tests (`tests/e2e.spec.ts`)
```typescript
// Test flow:
// 1. Onboarding → passkey → /chats
// 2. Send message → verify badge shown
// 3. Click "Xem xác minh" → receipt modal
// 4. /verify → paste receipt → valid result
```

### Quality Gates
- **Lighthouse CI**: Performance ≥0.90, A11y ≥0.95
- **k6 Load Test**: p95 ≤200ms, error rate ≤1%
- **Playwright E2E**: All user flows PASS

## 🌐 Deployment

### Vercel Production
- **URL**: https://atlas-proof-messenger.vercel.app
- **Environment**: Production
- **Build**: Next.js 14+ with App Router

### Environment Variables
```bash
VERCEL_ORG_ID=<org_id>
VERCEL_PROJECT_ID=<project_id>
```

## 📊 Compliance

- **SOC2**: READY (encryption, access controls)
- **ISO 27001**: READY (security controls documented)
- **SLSA Level 3**: ACHIEVED (provenance, attestation)

## 🛠️ Development

### Prerequisites
- Node.js 20+
- pnpm 9+

### Local Development
```bash
# Install dependencies
pnpm install

# Build tokens
pnpm run tokens:build

# Run dev server
cd apps/proof-messenger
pnpm run dev
```

### Build for Production
```bash
pnpm run build
```

## 📖 Standards & RFCs

- **RFC 9421**: HTTP Message Signatures
- **RFC 9449**: OAuth 2.0 Demonstrating Proof of Possession (DPoP)
- **WebAuthn**: Passkey authentication
- **NIST FIPS 203**: ML-KEM (Post-Quantum)

## 🎯 Product Metrics

### Success Criteria
- ✅ Onboarding completion rate >80%
- ✅ Message verification clicks >10%
- ✅ Lighthouse performance ≥0.90
- ✅ Accessibility score ≥0.95

### User Feedback
- Vietnamese-first language
- Large text support for accessibility
- Security badges visible on every screen
- One-click receipt verification

## 🚦 Roadmap

### V1.0 (Current)
- ✅ E2EE messaging
- ✅ RFC 9421 receipts
- ✅ Passkey auth
- ✅ DPoP binding
- ✅ PQC canary (1%)

### V1.1 (Next)
- [ ] QR code contact sharing
- [ ] Group chats with multi-witness
- [ ] Receipt export/archive
- [ ] Push notifications
- [ ] Offline message queue

### V2.0 (Future)
- [ ] Video/voice calls
- [ ] File sharing with receipts
- [ ] Multi-device sync
- [ ] Federation support

## 📞 Support

- **Documentation**: https://atlas-dev-portal.vercel.app
- **GitHub**: https://github.com/pussycat186/Atlas
- **Issues**: https://github.com/pussycat186/Atlas/issues

---

**Built with ❤️ for security-conscious users**

Atlas Proof Messenger - Where every message matters.
