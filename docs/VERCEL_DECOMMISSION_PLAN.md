# Vercel Decommission Plan

**Document Version**: 1.0.0  
**Last Updated**: 2025-01-17  
**Migration Status**: Pre-Deployment (S16 planning stage)

---

## Current Status

- **Ready to Remove**: `false` (GCP migration not yet deployed)
- **Park Period**: 7 days (after GCP migration validation)
- **Decommission Date**: TBD (7 days after S17 completion)
- **Rollback Availability**: Full (during park period)

---

## Migration Timeline

| Stage | Date | Status | Action |
|-------|------|--------|--------|
| **S0-S5**: Preparation | 2025-01-17 | ✅ COMPLETE | Infrastructure-as-code created |
| **S6-S10**: Deployment & Validation | TBD | ⏳ BLOCKED | Requires GitHub secrets + GCP bootstrap |
| **S11-S17**: Operational Setup | In Progress | ⏳ IN PROGRESS | Observability, DR, decommission planning |
| **Park Period Start** | S17 + 0 days | ⏸️ PENDING | Vercel kept active, no changes |
| **Decommission** | S17 + 7 days | ⏸️ PENDING | Execute this plan |

---

## Pre-Decommission Checklist

**Do NOT decommission until all criteria met:**

- [ ] **GCP Deployment Complete** (S6-S9)
  - [ ] All 3 services deployed to Cloud Run (asia-southeast1)
  - [ ] Custom domains configured with managed SSL
  - [ ] DNS updated to point to GCP Load Balancer
  - [ ] SSL certificates active and verified

- [ ] **Quality Validation Passed** (S7-S9)
  - [ ] Security headers validated (CSP, HSTS, X-Frame-Options, COEP)
  - [ ] Quality gates passed (Lighthouse ≥0.90 perf, ≥0.95 a11y)
  - [ ] Supply chain validated (SBOM generated, images signed)

- [ ] **Traffic Verification** (S10)
  - [ ] 100% production traffic on GCP (canary promoted)
  - [ ] No rollbacks required in last 7 days
  - [ ] Error rate <0.5% on GCP services

- [ ] **Observability Operational** (S11)
  - [ ] Cloud Monitoring alerts configured
  - [ ] atlas-scheduled.yml workflows running successfully
  - [ ] No SLO breaches in last 7 days

- [ ] **Cost Validated** (S12)
  - [ ] Monthly GCP cost within budget ($100-150 actual, <$200 budget)
  - [ ] Budget alerts configured and tested
  - [ ] Cost tracking enabled for all 3 services

- [ ] **DR Tested** (S15)
  - [ ] atlas-rollback.yml workflow tested successfully
  - [ ] DR runbook reviewed by on-call team
  - [ ] Incident response procedures documented

- [ ] **Stakeholder Approval**
  - [ ] Engineering lead sign-off
  - [ ] Product owner notification
  - [ ] Finance approval (cost comparison validated)

- [ ] **7-Day Park Period Complete**
  - [ ] 0 critical incidents during park period
  - [ ] User acceptance validated (no complaints)
  - [ ] Vercel bill for park period reviewed

---

## Vercel Current Configuration

### Services Currently on Vercel

| Service | Vercel URL | Custom Domain | Last Deployed |
|---------|------------|---------------|---------------|
| **proof-messenger** | atlas-proof-messenger.vercel.app | proof.atlas.com | TBD |
| **admin-insights** | atlas-admin-insights.vercel.app | admin.atlas.com | TBD |
| **dev-portal** | atlas-dev-portal.vercel.app | dev.atlas.com | TBD |

### Vercel Plan Details

- **Plan**: Pro Plan (assumed)
- **Monthly Cost**: ~$20/month per member + overages
- **Bandwidth**: $40 per 100GB
- **Function Invocations**: $2 per 1M invocations
- **Total Estimated**: $100-200/month (unpredictable)

### Vercel Configuration to Archive

**Before decommissioning, archive the following**:

1. **Environment Variables** (Vercel Dashboard → Settings → Environment Variables):
   ```bash
   # Export all env vars to JSON
   vercel env pull .vercel/env-archive.json
   ```

2. **Deployment Logs** (Last 30 days):
   ```bash
   # Download via Vercel CLI
   vercel logs --output=.vercel/deployment-logs.txt
   ```

3. **Custom Domains Configuration**:
   - DNS CNAME records
   - SSL certificate details
   - Edge network configuration

4. **Build Configuration**:
   - `vercel.json` (if exists)
   - Build command overrides
   - Output directory settings

5. **Team & Access Control**:
   - Team members list
   - Role assignments
   - Integrations (GitHub, Slack, etc.)

---

## Decommission Steps

### Phase 1: Final Verification (Day 0 - Before Decommission)

**1. Verify GCP is Primary**
```bash
# Check DNS points to GCP
dig proof.atlas.com +short
# Should return GCP Load Balancer IP (not Vercel CNAME)

# Check traffic (Cloud Logging)
gcloud logging read "resource.type=cloud_run_revision" \
  --freshness=1h --limit=100
# Should show active traffic on GCP
```

**2. Verify Vercel is Idle**
```bash
# Check Vercel traffic (should be 0 or minimal)
vercel logs --since=24h
# Expect: No recent requests (traffic on GCP)
```

**3. Archive Vercel Configuration**
```bash
# Create archive directory
mkdir -p .vercel-archive/$(date +%Y%m%d)

# Export environment variables
vercel env pull .vercel-archive/$(date +%Y%m%d)/env.json

# Download deployment logs
vercel logs --output=.vercel-archive/$(date +%Y%m%d)/logs.txt

# Save domain configuration
vercel domains ls --output=json > .vercel-archive/$(date +%Y%m%d)/domains.json

# Save project settings
vercel inspect > .vercel-archive/$(date +%Y%m%d)/project-settings.json
```

---

### Phase 2: Remove Custom Domains (Day 1)

**1. Remove Domains from Vercel**
```bash
# Remove custom domains from Vercel projects
vercel domains rm proof.atlas.com
vercel domains rm admin.atlas.com
vercel domains rm dev.atlas.com

# Verify removal
vercel domains ls
# Should show no custom domains
```

**2. Verify DNS Still Points to GCP**
```bash
# Confirm DNS unchanged (should still point to GCP)
dig proof.atlas.com +short
# Should return GCP Load Balancer IP
```

---

### Phase 3: Set Deployments to Read-Only (Day 2)

**1. Disable Auto-Deployments**
```bash
# Via Vercel Dashboard:
# Settings → Git → Auto Deploy → Disable for all branches

# Or via CLI (if available):
vercel project set --auto-deploy=false
```

**2. Verify No New Deployments**
```bash
# Check recent deployments (should be none after disabling)
vercel ls --since=1d
```

---

### Phase 4: Cancel Vercel Subscription (Day 3)

**1. Download Final Invoice**
```bash
# Vercel Dashboard → Settings → Billing → Download Invoice
# Save to: .vercel-archive/$(date +%Y%m%d)/final-invoice.pdf
```

**2. Review Final Costs**
- Compare Vercel final month cost vs. GCP actual cost
- Document cost savings in migration summary (S17)

**3. Cancel Subscription**
```bash
# Vercel Dashboard → Settings → Billing → Cancel Subscription
# Reason: "Migrated to GCP Cloud Run"
```

**4. Confirm Cancellation**
- Save cancellation confirmation email
- Archive in: .vercel-archive/$(date +%Y%m%d)/cancellation-confirmation.pdf

---

### Phase 5: Archive Vercel Projects (Day 4-7)

**1. Set Projects to Archived**
```bash
# Vercel Dashboard → Settings → General → Archive Project
# Archive all 3 projects (proof-messenger, admin-insights, dev-portal)
```

**2. Remove GitHub Integration** (Optional)
```bash
# Vercel Dashboard → Settings → Git Integration → Disconnect
# This prevents accidental redeployments
```

**3. Final Cleanup**
```bash
# Delete .vercel directory from local repos (optional)
rm -rf .vercel

# Commit archive to git
git add .vercel-archive/
git commit -m "docs(vercel): archive Vercel configuration pre-decommission"
git push
```

---

## Rollback Plan (During Park Period Only)

**If critical issues with GCP within 7 days:**

### Emergency Vercel Reactivation (RTO: 15 minutes)

**1. Revert DNS to Vercel** (0-5 min)
```bash
# Update DNS CNAME records back to Vercel
# proof.atlas.com → cname.vercel-dns.com
# Wait for DNS propagation (5-15 min)
```

**2. Re-enable Vercel Deployments** (5-10 min)
```bash
# Vercel Dashboard → Settings → Git → Auto Deploy → Enable
# Trigger manual deployment:
vercel deploy --prod
```

**3. Verify Services Operational** (10-15 min)
```bash
# Test endpoints
curl -I https://proof.atlas.com/prism
curl -I https://admin.atlas.com/prism
curl -I https://dev.atlas.com/prism

# All should return 200 OK
```

**4. Investigate GCP Issues**
- Create incident report (docs/incidents/INC-YYYYMMDD-NNN.md)
- Schedule post-mortem
- Plan second GCP migration attempt (if needed)

**Note**: After 7-day park period, Vercel rollback is no longer viable (subscription canceled, domains removed).

---

## Post-Decommission Verification

**After completing decommission (Day 7+):**

### Verify No Vercel Traffic
```bash
# Check Vercel logs (should be 0 requests)
vercel logs --since=7d
# Expect: No logs (project archived/deleted)
```

### Verify GCP is Only Platform
```bash
# Check all traffic on GCP
gcloud logging read "resource.type=cloud_run_revision" \
  --freshness=7d --format="table(timestamp, httpRequest.requestUrl, httpRequest.status)"
# Should show all production traffic
```

### Verify Cost Savings
```bash
# Compare costs:
# - Last Vercel invoice (pre-migration): $X
# - First full GCP month: $Y
# - Savings: $X - $Y (should be positive)
```

### Update Documentation
- Update DR_RUNBOOK.md (remove Vercel fallback option after 7 days)
- Update COST_GUARDS.md (final cost comparison)
- Create final migration report (S17)

---

## Communication Plan

### Pre-Decommission Notifications

**Engineering Team** (7 days before):
- Slack: `#atlas-engineering`
- Message: "GCP migration park period ending in 7 days. Vercel decommission scheduled for YYYY-MM-DD."

**On-Call Team** (3 days before):
- Email + PagerDuty note
- Message: "Vercel decommission in 3 days. No rollback to Vercel available after YYYY-MM-DD."

**Finance** (1 day before):
- Email invoice summary
- Message: "Vercel subscription canceled. Final invoice: $X. Expected GCP savings: $Y/month."

### Post-Decommission Announcement

**All Stakeholders** (Day 7+):
- Email + Slack: `#atlas-general`
- Subject: "✅ GCP Cloud Run Migration Complete - Vercel Decommissioned"
- Content:
  ```
  The Atlas platform has successfully migrated from Vercel to GCP Cloud Run.
  
  **Migration Summary**:
  - Deployment Date: YYYY-MM-DD
  - Park Period: 7 days (no incidents)
  - Vercel Decommissioned: YYYY-MM-DD
  - Cost Savings: $X/month (Y% reduction)
  - Services: 100% operational on GCP
  
  **No Action Required** - All services continue operating normally.
  
  Full migration report: docs/evidence/gcp-migration/FINAL.json
  ```

---

## Success Criteria

**Decommission is successful if:**

- ✅ Vercel subscription canceled and confirmed
- ✅ All custom domains removed from Vercel
- ✅ Vercel projects archived/deleted
- ✅ GCP services operational with 100% traffic
- ✅ No incidents during 7-day park period
- ✅ Cost savings validated ($20-50/month reduction)
- ✅ All stakeholders notified
- ✅ Vercel configuration archived in `.vercel-archive/`
- ✅ DR runbook updated (Vercel fallback removed)
- ✅ Final migration report completed (S17)

---

## Risk Mitigation

### Risks

1. **DNS Propagation Delays**
   - **Mitigation**: Update DNS 24-48 hours before decommission, verify propagation before removing domains

2. **Unexpected Rollback Need**
   - **Mitigation**: 7-day park period allows time to identify issues before commitment

3. **Lost Configuration**
   - **Mitigation**: Archive all Vercel settings before decommission

4. **Accidental Domain Removal**
   - **Mitigation**: Verify DNS points to GCP BEFORE removing from Vercel

### Abort Conditions

**DO NOT PROCEED with decommission if:**

- ❌ GCP services have >3 incidents in park period
- ❌ Error rate >1% on GCP services
- ❌ Cost exceeds $200/month on GCP
- ❌ Rollback required during park period
- ❌ Stakeholder approval not obtained
- ❌ DNS not fully propagated to GCP

---

## References

- [GCP Migration Timeline](../ATLAS_GCP_CLOUD_RUN_MIGRATION_MAX.md)
- [DR Runbook](./DR_RUNBOOK.md)
- [Cost Guards](./COST_GUARDS.md)
- [Vercel Documentation](https://vercel.com/docs)
