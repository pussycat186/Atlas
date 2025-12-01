# Privacy Policy

**Effective Date**: October 22, 2025  
**Last Updated**: October 22, 2025

## Overview

Atlas is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our end-to-end encrypted messaging service.

**Key Privacy Principles**:
- 🔐 **End-to-End Encryption**: All messages are encrypted on your device before transmission
- 🙈 **Zero-Knowledge Architecture**: We cannot read your messages
- 🔒 **Minimal Data Collection**: We only collect what's necessary for service operation
- 🗑️ **Data Deletion**: You control your data and can delete it anytime
- 📜 **Transparency**: We publish transparency reports on government data requests

## Information We Collect

### 1. Account Information
We collect minimal account information:
- **Username**: Public identifier you choose
- **Email** (optional): For account recovery only, not required
- **Passkey Credential ID**: WebAuthn credential identifier (no password stored)
- **Creation Date**: When you registered

**Storage**: Encrypted at rest in our database. Email (if provided) is hashed.

### 2. Cryptographic Material
- **Public Keys**: Ed25519/X25519 public keys for E2EE (publicly visible)
- **Encrypted Private Keys**: Encrypted with your device's key, we cannot decrypt
- **Key Metadata**: Key IDs, creation dates, rotation history

**Storage**: Public keys stored in plaintext (they're public). Private keys encrypted with your device key.

### 3. Message Metadata
We collect minimal metadata to route messages:
- **Sender/Recipient IDs**: Who sent/received the message
- **Timestamp**: When message was sent
- **Message Size**: Ciphertext length (not content)
- **Delivery Status**: Sent/delivered/read receipts (if enabled)

**NOT Collected**: Message content, subject lines, attachments (all encrypted).

**Retention**: Metadata retained for 30 days, then deleted.

### 4. Technical Information
- **IP Address**: For rate limiting and abuse prevention (hashed after 24 hours)
- **User Agent**: Browser/device type (anonymized after 7 days)
- **Error Logs**: Crash reports (no personal data included)

**Retention**: Raw IP addresses deleted after 24 hours. Anonymized analytics retained for 90 days.

### 5. Usage Analytics
We collect aggregated, anonymized analytics:
- Number of messages sent/received (no content)
- Feature usage (e.g., group chats, receipts)
- Performance metrics (latency, errors)

**No PII**: Analytics are aggregated and cannot be linked to individual users.

## How We Use Your Information

### 1. Service Operation
- Route encrypted messages between users
- Authenticate users via passkeys (WebAuthn)
- Prevent abuse and spam
- Provide delivery receipts

### 2. Security & Safety
- Detect and prevent unauthorized access
- Identify security incidents
- Rotate cryptographic keys
- Monitor for malicious activity

### 3. Service Improvement
- Analyze aggregated usage patterns
- Improve E2EE performance
- Fix bugs and errors
- Develop new features

**We NEVER**:
- Sell your data to third parties
- Use your data for advertising
- Read your message content (we can't, it's E2EE)
- Share data with governments without legal process

## Data Sharing & Disclosure

### 1. Third-Party Service Providers
We use minimal third parties:
- **Google Cloud Platform**: Infrastructure hosting (data encrypted at rest)
- **Cloudflare**: DDoS protection (no PII shared)
- **Sentry**: Error tracking (anonymized crash reports)

All third parties are under strict data processing agreements and cannot access message content.

### 2. Legal Requirements
We may disclose information if legally required:
- Valid subpoena or court order
- National security letter (to the extent permitted by law)
- Emergency situations (imminent danger)

**What We Can Provide**:
- Account creation date
- Last login IP address (if within 24 hours)
- Metadata (sender/recipient IDs, timestamps)

**What We CANNOT Provide**:
- Message content (we don't have it, E2EE)
- Private keys (encrypted, we can't decrypt)
- Contacts or social graph (not collected)

**Transparency Report**: We publish annual reports on government data requests at https://trust.atlas.dev/transparency

### 3. Business Transfers
If Atlas is acquired or merges with another company:
- Your encrypted data remains encrypted
- Acquiring company must honor this Privacy Policy
- You will be notified 30 days in advance
- You can delete your account before transfer

## Your Rights & Controls

### 1. Access Your Data
Request a copy of your data:
```bash
curl -X GET https://api.atlas.dev/account/export \
  -H 'Authorization: Bearer <YOUR_TOKEN>'
```
Includes: Account info, public keys, metadata (not message content, which is E2EE).

### 2. Delete Your Data
Delete your account and all associated data:
```bash
curl -X DELETE https://api.atlas.dev/account \
  -H 'Authorization: Bearer <YOUR_TOKEN>'
```
**Deletion Timeline**:
- Immediate: Account disabled, can't send/receive messages
- 7 days: Metadata deleted from database
- 30 days: Backups purged, complete deletion

### 3. Correct Your Data
Update account information:
- Change username via settings
- Update email via settings
- Rotate keys via security settings

### 4. Opt-Out of Analytics
Disable telemetry:
```javascript
// In app settings
Settings > Privacy > Analytics: OFF
```

### 5. Data Portability
Export your data in JSON format (account info, public keys, metadata).

## Children's Privacy

Atlas is not intended for users under 13 years old. We do not knowingly collect data from children. If you believe a child has created an account, contact privacy@atlas.dev.

## International Users & Data Transfers

### 1. Data Location
- **Primary**: United States (GCP us-central1)
- **Backup**: European Union (GCP europe-west1)

Data is encrypted in transit (TLS 1.3) and at rest (AES-256).

### 2. GDPR Compliance (EU Users)
If you're in the EU, you have additional rights under GDPR:
- **Right to be Forgotten**: Delete your data (see above)
- **Right to Rectification**: Correct inaccurate data
- **Right to Data Portability**: Export your data
- **Right to Object**: Object to certain processing
- **Right to Lodge a Complaint**: Contact your Data Protection Authority

**Data Protection Officer**: dpo@atlas.dev

### 3. CCPA Compliance (California Users)
California residents have rights under CCPA:
- **Right to Know**: What data we collect (see above)
- **Right to Delete**: Delete your data
- **Right to Opt-Out of Sale**: We don't sell data (no opt-out needed)
- **Right to Non-Discrimination**: We won't discriminate for exercising rights

**Contact**: privacy@atlas.dev

## Data Security

### 1. Encryption
- **In Transit**: TLS 1.3 with forward secrecy
- **At Rest**: AES-256-GCM encryption
- **E2EE**: Double Ratchet + MLS group encryption
- **Key Storage**: Hardware Security Modules (HSMs)

### 2. Access Controls
- **Principle of Least Privilege**: Employees have minimal access
- **Audit Logging**: All data access logged and monitored
- **Multi-Factor Authentication**: Required for all employee accounts
- **Zero-Knowledge**: Employees cannot read message content

### 3. Security Practices
- Annual third-party security audits
- Bug bounty program: https://trust.atlas.dev/security
- Responsible disclosure policy
- Incident response plan

## Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Account Info | Until account deletion |
| Public Keys | Until account deletion |
| Message Metadata | 30 days |
| IP Addresses (raw) | 24 hours |
| Error Logs | 90 days |
| Audit Logs | 7 years (compliance) |
| Backups | 30 days |

## Cookies & Tracking

### 1. Essential Cookies
- **Session Cookie**: Authentication (httpOnly, secure, sameSite)
- **CSRF Token**: Security (expires after session)

### 2. Analytics (Optional)
- **Usage Tracking**: Anonymized, can be disabled
- **No Third-Party Cookies**: We don't use Google Analytics, Facebook Pixel, etc.

## Changes to This Policy

We may update this Privacy Policy. Changes will be:
- Posted at https://atlas.dev/privacy
- Announced in-app notification
- Emailed to users (if email provided)

**Effective Date**: Changes effective 30 days after posting.

## Contact Us

**Privacy Questions**: privacy@atlas.dev  
**Data Protection Officer** (GDPR): dpo@atlas.dev  
**Security Issues**: security@atlas.dev  
**General Support**: support@atlas.dev

**Mail**:  
Atlas Privacy Team  
[Company Address]  
[City, State, ZIP]

## Transparency Commitments

We commit to:
- ✅ **Open Source**: Crypto code is open source for audit
- ✅ **Transparency Reports**: Annual reports on government requests
- ✅ **Third-Party Audits**: Annual security and privacy audits
- ✅ **No Backdoors**: We will never implement backdoors
- ✅ **User Control**: You own your data, we're just the messenger

---

**Last Updated**: October 22, 2025  
**Version**: 2.0
