# Atlas GCP Cloud Run Disaster Recovery Runbook

**Version**: 1.0.0 | **Platform**: Google Cloud Run | **RTO**: 15min | **RPO**: 0

---

## Quick Reference

| Scenario | Detection | Response Time | Primary Action |
|----------|-----------|---------------|----------------|
| **Service Down** | Health check fail, 5xx >1% | 15 min | Rollback to previous revision |
| **Bad Deployment** | Quality gates fail | 5 min | `gh workflow run atlas-rollback.yml` |
| **Regional Outage** | All services 503 | 30-60 min | Wait for GCP OR deploy to us-central1 |
| **Security Breach** | Anomalous traffic | Immediate | Block traffic, rotate secrets |
| **Cost Spike** | Budget alert >90% | 1 hour | Reduce max-instances to 20 |

---

## Emergency Rollback (Most Common)

### Automated Rollback (Recommended - 2-5 min)
```bash
# Rollback proof-messenger to previous stable
gh workflow run atlas-rollback.yml -f service=atlas-proof-messenger

# Rollback to specific revision
gh workflow run atlas-rollback.yml \
  -f service=atlas-proof-messenger \
  -f target_revision=atlas-proof-messenger-00042-abc
```

### Manual Rollback (If GitHub Actions down)
```bash
# 1. List revisions
gcloud run revisions list --service=atlas-proof-messenger \
  --region=asia-southeast1 --sort-by=~creationTimestamp

# 2. Shift traffic to previous
gcloud run services update-traffic atlas-proof-messenger \
  --region=asia-southeast1 \
  --to-revisions=PREVIOUS_REVISION=100

# 3. Verify
curl -I https://proof.atlas.com/prism
```

---

## Service Outage Response

### Detection
- atlas-scheduled.yml workflow alerts (headers/quality/receipts)
- Cloud Monitoring 5xx errors >1%
- User reports

### Response (15 min RTO)
```bash
# 1. Check service status (0-2 min)
gcloud run services describe atlas-proof-messenger \
  --region=asia-southeast1 --format=yaml

# 2. Check logs for errors (2-5 min)
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=atlas-proof-messenger \
  AND severity>=ERROR" --limit=50

# 3. Identify cause:
#    - Bad deployment → Rollback
#    - Resource issue → Increase memory/CPU
#    - Dependency → Wait or failover
#    - Config → Fix secrets

# 4. Execute fix (5-10 min)
# See rollback section above

# 5. Verify recovery (10-15 min)
curl -I https://proof.atlas.com/prism
gcloud logging read "resource.type=cloud_run_revision \
  AND httpRequest.status>=500" --limit=10
```

---

## Regional Outage (asia-southeast1)

### Option A: Wait for GCP (If ETA <1 hour)
- Monitor https://status.cloud.google.com
- Communicate to users
- Auto-recovery when region restored

### Option B: Multi-Region Deploy (If ETA >1 hour)
```bash
# Deploy to us-central1 (30-45 min)
export GCP_REGION=us-central1
gh workflow run deploy-cloudrun.yml

# Update domains (45-60 min)
bash infra/gcp/scripts/map-domains.sh
```

### Option C: Fallback to Vercel (<7 days post-migration)
```bash
# 1. Redeploy to Vercel (30-60 min)
vercel deploy --prod

# 2. Update DNS CNAMEs (60-90 min)
# proof.atlas.com → cname.vercel-dns.com
```

---

## Security Breach Response

### Immediate Actions (0-5 min)
```bash
# Block all traffic
gcloud run services update atlas-proof-messenger \
  --region=asia-southeast1 \
  --no-allow-unauthenticated
```

### Rotate Secrets (5-15 min)
```bash
# Sync new secrets
bash infra/gcp/scripts/secrets-sync.sh

# Force new revision
gcloud run services update atlas-proof-messenger \
  --region=asia-southeast1 \
  --update-env-vars=ROTATION_ID=$(date +%s)
```

### Audit Access (15-30 min)
```bash
# Query suspicious requests
gcloud logging read "resource.type=cloud_run_revision \
  AND httpRequest.remoteIp=SUSPICIOUS_IP" \
  --limit=1000 --format=json > breach-audit.json
```

### Enable DDoS Protection
```bash
# Create rate limiting policy
gcloud compute security-policies create atlas-ddos-protection \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60
```

---

## Cost Spike Emergency

### If Cost Exceeds 90% ($180)
```bash
# Reduce max-instances (cuts cost by 60%)
for service in atlas-proof-messenger atlas-admin-insights atlas-dev-portal; do
  gcloud run services update $service \
    --region=asia-southeast1 \
    --max-instances=20
done
```

### If Cost Exceeds 100% ($200)
```bash
# Disable non-essential services
gcloud run services update atlas-admin-insights --no-traffic
gcloud run services update atlas-dev-portal --no-traffic

# Reduce proof-messenger to minimum
gcloud run services update atlas-proof-messenger \
  --min-instances=0 --max-instances=10
```

---

## Post-Incident

### Create Incident Report
```bash
# Template: docs/incidents/INC-YYYYMMDD-NNN.md
- Incident ID, severity, affected services
- Timeline (start, detection, response, resolution)
- Root cause analysis
- Action items

# Schedule post-mortem within 24-48 hours
```

### Update Runbook
- Add new scenarios if not covered
- Improve detection/monitoring
- Automate response if repeatable

---

## Rollback Decision Matrix

| Scenario | Target | Traffic Split | Timeline |
|----------|--------|---------------|----------|
| Quality gate fail | Previous stable | 100% immediate | 2-5 min |
| Gradual errors | Previous stable | 90% → 100% over 15min | 15-30 min |
| Minor issue | Previous stable | 50% → 100% over 1hr | 1-2 hrs |
| Canary fail | Previous stable | 0% canary (no rollback) | 0 min |

---

## Health Check Verification

```bash
# Check all 3 services
for service in atlas-proof-messenger atlas-admin-insights atlas-dev-portal; do
  echo "=== $service ==="
  gcloud run services describe $service \
    --region=asia-southeast1 \
    --format="value(status.conditions[0].status)"
  
  URL=$(gcloud run services describe $service \
    --region=asia-southeast1 \
    --format="value(status.url)")
  curl -I "$URL/prism"
done
```

**Success Criteria**:
- ✅ All services status: True
- ✅ Health endpoints return 200 OK
- ✅ 5xx error rate <0.5% (last 15min)
- ✅ Security headers present

---

## References

- [atlas-rollback.yml](.github/workflows/atlas-rollback.yml) - Automated rollback workflow
- [COST_GUARDS.md](./COST_GUARDS.md) - Cost monitoring and alerts
- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [GCP Incident Response](https://cloud.google.com/architecture/framework/reliability/incident-response)
