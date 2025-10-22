# Runbook: E2EE Failure Diagnosis & Recovery

## Overview
**Incident Type**: E2EE Message Decryption Failure  
**Severity**: High  
**Response Time**: < 30 minutes  
**Impact**: Users cannot read messages

## Common E2EE Failure Scenarios

### 1. Message Decryption Failure
**Symptoms**:
- User sees "Unable to decrypt message" error
- Ciphertext displayed instead of plaintext
- E2EE badge shows warning icon

**Diagnosis**:
```bash
# Check user's key state
psql atlas -c "SELECT user_id, key_id, status, last_rotated FROM user_keys WHERE user_id='<USER_ID>';"

# Check message metadata
psql atlas -c "SELECT message_id, sender_id, recipient_id, encryption_algorithm, created_at FROM messages WHERE message_id='<MESSAGE_ID>';"

# Check logs for decryption errors
kubectl logs -l app=atlas-gateway -n atlas --since=1h | grep "decrypt" | grep "error"
```

**Common Causes**:
- Recipient's key rotated before message was received
- Double Ratchet state desynchronized
- Skipped message keys not stored
- Key material corrupted in database

**Recovery**:
```bash
# Option 1: Request message resend (if sender still has plaintext)
curl -X POST https://api.atlas.dev/messages/<MESSAGE_ID>/request-resend \
  -H 'Authorization: Bearer <TOKEN>'

# Option 2: Restore from backup key (if available)
node scripts/restore-user-keys.mjs --user-id <USER_ID> --date <BACKUP_DATE>

# Option 3: Reset Double Ratchet session
curl -X POST https://api.atlas.dev/sessions/<SESSION_ID>/reset \
  -H 'Authorization: Bearer <TOKEN>'
# Note: This invalidates all in-flight messages
```

### 2. MLS Group Message Failure
**Symptoms**:
- Group member cannot decrypt group messages
- "Outdated epoch" error
- Member stuck in old epoch

**Diagnosis**:
```bash
# Check member's epoch
psql atlas -c "SELECT group_id, member_id, epoch, last_commit FROM mls_group_members WHERE member_id='<MEMBER_ID>' AND group_id='<GROUP_ID>';"

# Check group's current epoch
psql atlas -c "SELECT group_id, current_epoch, last_epoch_change FROM mls_groups WHERE group_id='<GROUP_ID>';"

# Check pending commits
psql atlas -c "SELECT commit_id, sender_id, epoch, status FROM mls_commits WHERE group_id='<GROUP_ID>' AND status='pending';"
```

**Recovery**:
```bash
# Option 1: Send Update Proposal to advance member
node scripts/mls-send-update.mjs --group-id <GROUP_ID> --member-id <MEMBER_ID>

# Option 2: Re-add member to group (last resort)
node scripts/mls-rejoin-member.mjs --group-id <GROUP_ID> --member-id <MEMBER_ID>

# Option 3: Rollback group to previous epoch (emergency only)
node scripts/mls-rollback-epoch.mjs --group-id <GROUP_ID> --target-epoch <EPOCH-1>
```

### 3. DPoP Token Verification Failure
**Symptoms**:
- API returns 401 "Invalid DPoP proof"
- User cannot send messages
- "Token binding failed" error

**Diagnosis**:
```bash
# Check DPoP proof structure
echo '<DPOP_HEADER>' | base64 -d | jq .

# Verify token binding
node scripts/verify-dpop.mjs --proof '<DPOP_PROOF>' --token '<ACCESS_TOKEN>'

# Check JTI cache (for replay detection)
redis-cli -h redis.atlas.svc.cluster.local GET "dpop:jti:<JTI>"
```

**Recovery**:
```bash
# Clear JTI cache if replay detection false positive
redis-cli -h redis.atlas.svc.cluster.local DEL "dpop:jti:<JTI>"

# Regenerate DPoP key pair on client side
# (Client must call: await generateKeyPair())

# Verify new proof works
curl -X POST https://api.atlas.dev/messages \
  -H 'DPoP: <NEW_PROOF>' \
  -H 'Authorization: DPoP <TOKEN>' \
  -d '{"content":"test"}'
```

### 4. Receipt Verification Failure
**Symptoms**:
- User sees "Invalid receipt" error
- Receipt signature doesn't verify
- Receipt timestamp mismatch

**Diagnosis**:
```bash
# Parse receipt
echo '<RECEIPT_BASE64>' | base64 -d | jq .

# Verify signature
node scripts/verify-receipt.mjs --receipt '<RECEIPT_JSON>'

# Check JWKS for signing key
curl https://trust.atlas.dev/.well-known/jwks.json | jq '.keys[] | select(.kid=="<KID>")'
```

**Recovery**:
```bash
# If key rotated: Update JWKS endpoint
pnpm --filter @atlas/trust-portal build
pnpm --filter @atlas/trust-portal deploy

# If receipt expired: Extend validity window (emergency only)
psql atlas -c "UPDATE receipts SET expires_at=NOW() + INTERVAL '7 days' WHERE receipt_id='<RECEIPT_ID>';"

# Re-issue receipt
curl -X POST https://api.atlas.dev/receipts/<MESSAGE_ID>/reissue \
  -H 'Authorization: Bearer <TOKEN>'
```

## Systematic Diagnosis Flow

```
Message Decryption Failed
  ↓
Check Logs → Error: "KeyNotFound"
  ↓
Check user_keys table → Key exists?
  ↓ NO
  ├→ Restore from backup
  └→ Re-exchange keys with sender
  ↓ YES
Check key status → "active"?
  ↓ NO
  └→ Reactivate key (if valid)
  ↓ YES
Check Double Ratchet state → Synchronized?
  ↓ NO
  └→ Reset session (Option 3)
  ↓ YES
Check message chain → Missing skipped keys?
  ↓ YES
  └→ Request missing messages
  ↓ NO
  └→ Escalate to crypto team
```

## Prevention Measures

### 1. Implement Key Backup
```typescript
// In crypto package
export async function backupUserKeys(userId: string): Promise<void> {
  const keys = await getUserKeys(userId);
  await storeEncryptedBackup(keys, `backup-${userId}-${Date.now()}`);
}
```

### 2. Add Skipped Message Key Storage
```typescript
// In Double Ratchet implementation
export class DoubleRatchetSession {
  private skippedKeys: Map<number, Uint8Array> = new Map();
  
  async decrypt(ciphertext: Uint8Array): Promise<Uint8Array> {
    // Store skipped keys for future messages
    while (this.state.recvChainNumber < messageNumber) {
      const skippedKey = this.deriveMessageKey();
      this.skippedKeys.set(this.state.recvChainNumber, skippedKey);
      this.state.recvChainNumber++;
    }
    // ... rest of decrypt logic
  }
}
```

### 3. Add E2EE Health Checks
```bash
# Add to monitoring
curl https://api.atlas.dev/health/e2ee

# Expected response:
{
  "status": "healthy",
  "decryption_success_rate": 0.998,
  "avg_latency_ms": 45,
  "failed_decryptions_last_hour": 2
}
```

## Escalation

If recovery steps don't work:
1. **Check crypto implementation bugs**: Review recent commits to `packages/crypto`
2. **Consult crypto team**: Escalate to security@atlas.dev
3. **Consider emergency key rotation**: Follow [Key Rotation Runbook](./key-rotation.md)
4. **User communication**: Send notification about temporary E2EE issue

## Monitoring & Alerts

### Prometheus Alerts
```yaml
- alert: HighDecryptionFailureRate
  expr: rate(atlas_crypto_operations_total{operation="decrypt",status="failure"}[5m]) > 0.05
  for: 5m
  severity: critical
  annotations:
    summary: "E2EE decryption failure rate above 5%"

- alert: MLSEpochDesync
  expr: max(atlas_mls_group_epoch) - min(atlas_mls_group_member_epoch) > 2
  for: 10m
  severity: warning
  annotations:
    summary: "MLS group members desynchronized by >2 epochs"
```

## Related Documents
- [Crypto Architecture](../architecture/crypto-guide.md)
- [Double Ratchet Spec](../specs/double-ratchet.md)
- [MLS Implementation](../specs/mls.md)
- [Security Incident Response](./security-incident-response.md)
