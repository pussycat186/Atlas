# Runbook: Crypto Key Rotation

## Overview
**Incident Type**: Scheduled Maintenance  
**Severity**: Medium  
**Estimated Time**: 30-60 minutes  
**Frequency**: Every 7 days (automated) or on-demand

## When to Execute
- Scheduled weekly rotation (automated via cron)
- Security incident requiring key invalidation
- Key compromise suspected or confirmed
- Compliance requirement (e.g., PCI-DSS)

## Prerequisites
- [ ] Access to production key management system
- [ ] Database backup completed
- [ ] Monitoring dashboard open
- [ ] Team notifications sent (if manual rotation)

## Step-by-Step Procedure

### 1. Pre-Rotation Checks
```bash
# Check current key status
kubectl exec -it atlas-gateway-0 -- \
  node -e "const {getActiveKeys} = require('@atlas/crypto'); console.log(getActiveKeys());"

# Verify no active incidents
curl https://status.atlas.dev/api/incidents

# Check system health
kubectl get pods -n atlas
```

### 2. Generate New Keys
```bash
# Generate new Ed25519 keypair
node scripts/generate-keypair.mjs --type ed25519 --output evidence/keys/new-keypair.json

# Verify key generation
cat evidence/keys/new-keypair.json | jq '.publicKey'
```

### 3. Update Key Management System
```bash
# Upload new public key to KMS
gcloud kms keys versions create \
  --location global \
  --keyring atlas-keys \
  --key atlas-signing-key \
  --primary \
  --import-only \
  --public-key-file evidence/keys/new-keypair.json

# Verify upload
gcloud kms keys versions list \
  --location global \
  --keyring atlas-keys \
  --key atlas-signing-key
```

### 4. Update JWKS Endpoint
```bash
# Update Trust Portal JWKS
cd apps/trust-portal/public/.well-known/
# Add new key to jwks.json
jq '.keys += [{"kty":"OKP","crv":"Ed25519","kid":"atlas-2024-'$(date +%s)'","use":"sig","alg":"EdDSA","x":"'$(cat ../../../../evidence/keys/new-keypair.json | jq -r .publicKey)'"}]' jwks.json > jwks.tmp.json
mv jwks.tmp.json jwks.json

# Deploy updated JWKS
git add jwks.json
git commit -m "chore: rotate signing keys"
git push origin main
```

### 5. Rolling Update Services
```bash
# Update gateway with new key
kubectl set env deployment/atlas-gateway \
  SIGNING_KEY_ID=atlas-2024-$(date +%s) \
  -n atlas

# Wait for rollout
kubectl rollout status deployment/atlas-gateway -n atlas

# Verify new key is active
kubectl exec -it atlas-gateway-0 -n atlas -- \
  curl localhost:3000/health | jq '.signingKeyId'
```

### 6. Deprecate Old Keys (After 24h Grace Period)
```bash
# Mark old key as deprecated (do not delete immediately)
jq '.keys[] | select(.kid == "atlas-2024-old") | .use = "deprecated"' \
  apps/trust-portal/public/.well-known/jwks.json > jwks.tmp.json
mv jwks.tmp.json apps/trust-portal/public/.well-known/jwks.json

# Schedule deletion after 30 days
echo "DELETE_KEY_ID=atlas-2024-old DELETE_DATE=$(date -d '+30 days' +%Y-%m-%d)" >> evidence/key-deletion-schedule.txt
```

## Verification
```bash
# Test DPoP proof with new key
curl -X POST https://api.atlas.dev/token \
  -H "DPoP: $(node scripts/create-dpop-proof.mjs --key-id atlas-2024-$(date +%s))"

# Verify HTTP signature
curl https://api.atlas.dev/messages \
  -H "Signature: sig1=:$(node scripts/sign-request.mjs --key-id atlas-2024-$(date +%s)):"

# Check metrics
curl http://localhost:9464/metrics | grep atlas_key_rotations_total
```

## Rollback Procedure
If new key causes issues:
```bash
# Revert to previous key
kubectl set env deployment/atlas-gateway \
  SIGNING_KEY_ID=atlas-2024-old \
  -n atlas

# Wait for rollout
kubectl rollout status deployment/atlas-gateway -n atlas

# Remove new key from JWKS
jq 'del(.keys[] | select(.kid == "atlas-2024-'$(date +%s)'"))' \
  apps/trust-portal/public/.well-known/jwks.json > jwks.tmp.json
mv jwks.tmp.json apps/trust-portal/public/.well-known/jwks.json
```

## Post-Rotation Tasks
- [ ] Update incident log: `evidence/incidents/key-rotation-$(date +%Y%m%d).md`
- [ ] Notify team in Slack: `#atlas-ops`
- [ ] Update compliance docs: `docs/compliance/key-management.md`
- [ ] Schedule next rotation: `crontab -e` (if not automated)

## Monitoring & Alerts
- **Metric**: `atlas_key_rotations_total` (should increment by 1)
- **Alert**: `NoKeyRotation` (should not fire for 7 days)
- **Dashboard**: https://grafana.atlas.dev/d/crypto-ops

## Contacts
- **On-Call Engineer**: Check PagerDuty
- **Security Team**: security@atlas.dev
- **Escalation**: CTO (if key compromise confirmed)

## Related Documents
- [Key Management Policy](../security/key-management-policy.md)
- [Security Incident Response](./security-incident-response.md)
- [Compliance Requirements](../compliance/key-rotation-requirements.md)
