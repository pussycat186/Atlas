# Disaster Recovery Runbook

**Version:** 1.0.0  
**Last Updated:** 2025-10-17  
**Review Cycle:** Quarterly

## Overview

This runbook provides step-by-step procedures for disaster recovery (DR) scenarios in the ATLAS platform. It covers service outages, data loss prevention, failover procedures, and rollback strategies.

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | GitHub Issues (tag @pussycat186) | Immediate |
| Platform Lead | @pussycat186 | Within 15 minutes |
| Security Team | security@atlas-platform.example | Within 30 minutes |
| Vercel Support | [Vercel Dashboard](https://vercel.com/support) | Via ticket |

## Service Level Objectives (SLOs)

- **RTO (Recovery Time Objective)**: 15 minutes
- **RPO (Recovery Point Objective)**: 0 (stateless applications)
- **Availability Target**: 99.95% (21.9 minutes downtime/month)

## Incident Severity Classification

### Severity 1 (Critical)
- Complete service outage (all apps down)
- Data breach or security compromise
- Uncontrolled data loss
- **Response Time**: Immediate
- **Resolution Target**: 15 minutes

### Severity 2 (High)
- Partial service degradation (1-2 apps affected)
- SLO breach (>2 consecutive failures)
- Security vulnerability discovered
- **Response Time**: 15 minutes
- **Resolution Target**: 1 hour

### Severity 3 (Medium)
- Single app experiencing elevated error rates
- Performance degradation (p95 > 500ms)
- Non-critical feature failures
- **Response Time**: 1 hour
- **Resolution Target**: 4 hours

### Severity 4 (Low)
- Minor UI issues
- Documentation gaps
- Non-urgent improvements
- **Response Time**: Next business day
- **Resolution Target**: 1 week

## Common DR Scenarios

### Scenario 1: Complete Vercel Outage

**Symptoms:**
- All 3 apps unreachable (504 Gateway Timeout)
- Vercel status page shows incident

**Diagnosis:**
```bash
# Check app health
curl -I https://atlas-proof-messenger.vercel.app
curl -I https://atlas-admin-insights.vercel.app
curl -I https://atlas-dev-portal.vercel.app

# Check Vercel status
curl -s https://www.vercel-status.com/api/v2/status.json | jq
```

**Response:**
1. **Confirm Outage** (1 min):
   - Verify all 3 apps down
   - Check Vercel status page
   - Create GitHub Issue (SEV-1)

2. **Communicate** (2 min):
   - Post status update on GitHub Issues
   - Notify users via social media/status page

3. **Monitor Vercel** (ongoing):
   - Watch Vercel status page for updates
   - No action required (infrastructure provider responsibility)

4. **Prepare Failover** (if outage >30 min):
   - Trigger failover to backup provider (future: Cloudflare Pages)
   - Update DNS records (see Scenario 2)

**Rollback:** N/A (wait for Vercel recovery)

**Post-Incident:**
- Document outage duration
- Review SLO compliance
- Consider multi-cloud strategy

---

### Scenario 2: DNS/CDN Failover (Multi-Cloud)

**Symptoms:**
- Vercel outage >30 minutes
- Need to failover to backup hosting

**Prerequisites:**
- Backup deployments on Cloudflare Pages (future)
- DNS TTL set to 60 seconds

**Procedure:**
1. **Verify Backup Healthy** (2 min):
   ```bash
   # Check backup deployment
   curl -I https://atlas-backup.pages.dev
   ```

2. **Update DNS** (3 min):
   - Log in to DNS provider (Cloudflare)
   - Change A/CNAME records:
     - `atlas-proof-messenger.vercel.app` → `atlas-backup.pages.dev`
   - Set TTL to 60 seconds

3. **Monitor Propagation** (5 min):
   ```bash
   # Check DNS propagation
   nslookup atlas-proof-messenger.vercel.app
   ```

4. **Verify Traffic** (5 min):
   - Monitor health probes
   - Check error rates on backup

**Rollback:**
1. Revert DNS changes to original Vercel endpoints
2. Wait 5 minutes for propagation
3. Verify traffic restored

**Estimated Downtime:** 10-15 minutes

---

### Scenario 3: Bad Deployment (Broken Code)

**Symptoms:**
- Sudden spike in error rates after deployment
- 500 errors on critical endpoints
- User reports of broken functionality

**Diagnosis:**
```bash
# Check recent deployments
gh api repos/pussycat186/Atlas/deployments | jq '.[0:3]'

# Check error rates
curl -s https://atlas-proof-messenger.vercel.app/api/health | jq
```

**Response:**
1. **Identify Bad Deployment** (2 min):
   - Check GitHub Actions for recent deployments
   - Compare timestamps with error spike

2. **Rollback via Vercel** (3 min):
   - Option A: Vercel Dashboard
     - Navigate to Deployments
     - Find last known good deployment
     - Click "Promote to Production"
   
   - Option B: GitHub Actions Workflow
     ```bash
     # Trigger one-click rollback workflow
     gh workflow run atlas-operate-lock.yml -f rollback=true
     ```

3. **Verify Rollback** (2 min):
   ```bash
   # Check current deployment
   curl -s https://atlas-proof-messenger.vercel.app/api/version | jq
   
   # Verify error rate decreased
   curl -s https://atlas-proof-messenger.vercel.app/api/health | jq '.error_rate'
   ```

4. **Root Cause Analysis** (within 24h):
   - Review failed deployment logs
   - Identify breaking change
   - Create hotfix PR with fix
   - Add regression test

**Rollback Time:** 5 minutes

**Prevention:**
- Automated testing in CI (unit, integration, E2E)
- Canary deployments (gradual rollout)
- Blue-green deployment strategy

---

### Scenario 4: Data Loss (Accidental Deletion)

**Symptoms:**
- User reports missing data
- Database query shows deleted records

**Response:**
1. **Assess Scope** (5 min):
   ```sql
   -- Check deletion audit logs
   SELECT * FROM audit_logs 
   WHERE action = 'DELETE' 
   AND timestamp > NOW() - INTERVAL '1 hour';
   ```

2. **Restore from Backup** (10 min):
   - Identify latest backup before deletion
   - Restore specific records:
     ```bash
     # Download backup
     vercel env pull .env.backup
     
     # Restore from backup snapshot (last 30 days)
     # (Specific commands depend on database provider)
     ```

3. **Verify Restoration** (3 min):
   - Confirm user's data is restored
   - Check data integrity

**RPO:** 0-24 hours (depends on backup schedule)

**Prevention:**
- Soft deletes (mark as deleted, don't remove)
- Automated daily backups (30-day retention)
- Require confirmation for bulk deletions

---

### Scenario 5: Security Breach (Compromised Secrets)

**Symptoms:**
- Unauthorized API calls detected
- Secrets leaked in logs or public repo
- WAF blocking unusual traffic patterns

**Response:**
1. **IMMEDIATE - Revoke Compromised Secrets** (5 min):
   ```bash
   # Rotate all secrets immediately
   # Vercel
   vercel env rm VERCEL_TOKEN
   vercel env add VERCEL_TOKEN
   
   # GitHub
   gh secret set VERCEL_TOKEN --body "new-token-value"
   
   # Cloudflare
   # (via dashboard or API)
   ```

2. **Assess Impact** (10 min):
   - Review access logs for unauthorized activity
   - Check for data exfiltration
   - Identify affected services

3. **Deploy with New Secrets** (5 min):
   ```bash
   # Trigger redeployment with new secrets
   git commit --allow-empty -m "chore: Rotate secrets after breach"
   git push origin main
   ```

4. **Monitor** (24h):
   - Watch for continued unauthorized access
   - Verify all services functioning with new secrets

5. **Post-Incident** (within 72h):
   - Document breach timeline
   - Identify root cause (how secrets were compromised)
   - Implement additional controls:
     - Secret scanning (GitHub Push Protection)
     - SIEM alerting
     - Principle of least privilege review

**RTO:** 15-20 minutes

**Legal Obligations:**
- If PII compromised: notify affected users within 72 hours (GDPR)
- Report to authorities if required by law

---

### Scenario 6: DDoS Attack

**Symptoms:**
- Sudden traffic spike (10x normal)
- Legitimate users unable to access service
- 429 (Too Many Requests) or 503 errors

**Response:**
1. **Verify DDoS** (2 min):
   - Check Cloudflare WAF dashboard
   - Look for patterns: single IP, geographic concentration, bot signatures

2. **Enable DDoS Protection** (3 min):
   - Cloudflare: Enable "Under Attack" mode
   - Vercel: Rate limiting already active (60 req/min)

3. **Block Malicious IPs** (5 min):
   ```bash
   # Add IP block rules via Cloudflare API
   curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/access_rules/rules" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -d '{"mode":"block","configuration":{"target":"ip","value":"1.2.3.4"}}'
   ```

4. **Monitor Traffic** (ongoing):
   - Watch for traffic normalization
   - Verify legitimate users can access

5. **Post-Attack** (within 24h):
   - Review attack patterns
   - Adjust WAF rules to prevent future attacks
   - Consider upgrading Cloudflare plan for advanced DDoS protection

**Mitigation Time:** 10-15 minutes

---

## Failover Drill Procedure

### Monthly Drill Schedule
- **Frequency**: Monthly (first Sunday at 02:00 UTC)
- **Scope**: 10% traffic failover simulation
- **Duration**: 30 minutes
- **Automated**: GitHub Actions workflow

### Drill Steps
1. **Pre-Drill** (T-5 min):
   - Announce drill in team channel
   - Verify backup deployment healthy

2. **Execute Failover** (T+0):
   - Redirect 10% of traffic to backup via DNS
   - Monitor health probes

3. **Monitor** (T+0 to T+15):
   - Check error rates on both primary and backup
   - Verify performance metrics (p95 < 300ms)

4. **Revert** (T+15):
   - Restore 100% traffic to primary
   - Wait for DNS propagation

5. **Post-Drill** (T+30):
   - Document drill results
   - Identify issues or improvements
   - Update runbook if needed

### Auto-Revert Conditions
If any of the following occur during drill:
- Error rate >5% on backup
- p95 TTFB >500ms on backup
- Availability <99%

→ Immediately revert to primary (auto-revert in workflow)

---

## Rollback Checklist

Use this checklist for any rollback scenario:

- [ ] **Identify**: Pinpoint the issue (deployment, config, infrastructure)
- [ ] **Communicate**: Create GitHub Issue (SEV-X), notify team
- [ ] **Rollback**:
  - [ ] Vercel deployment rollback OR
  - [ ] DNS failover OR
  - [ ] Secret rotation OR
  - [ ] Configuration revert
- [ ] **Verify**: Confirm rollback successful (health checks, error rates)
- [ ] **Monitor**: Watch metrics for 30 minutes post-rollback
- [ ] **RCA**: Schedule post-mortem within 24 hours
- [ ] **Document**: Update incident log and runbook

---

## Tools and Resources

### Health Check Endpoints
- **Proof Messenger**: `https://atlas-proof-messenger.vercel.app/api/health`
- **Admin Insights**: `https://atlas-admin-insights.vercel.app/api/health`
- **Dev Portal**: `https://atlas-dev-portal.vercel.app/api/health`

### Monitoring Dashboards
- **GitHub Actions**: https://github.com/pussycat186/Atlas/actions
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Cloudflare Dashboard**: https://dash.cloudflare.com

### One-Click Rollback
```bash
# Via GitHub CLI
gh workflow run atlas-operate-lock.yml -f rollback=true
```

### DNS Providers
- **Primary**: Cloudflare DNS
- **TTL**: 60 seconds (low for fast failover)

---

## Post-Incident Review Template

After any SEV-1 or SEV-2 incident:

```markdown
# Incident Post-Mortem: [TITLE]

**Date:** YYYY-MM-DD
**Severity:** SEV-X
**Duration:** X minutes
**Impact:** [Description]

## Timeline
- **HH:MM UTC** - Incident detected
- **HH:MM UTC** - Response initiated
- **HH:MM UTC** - Rollback/fix applied
- **HH:MM UTC** - Service restored

## Root Cause
[Detailed explanation]

## Resolution
[What was done to resolve]

## Action Items
- [ ] [Preventive measure 1] (Owner: @user, Due: YYYY-MM-DD)
- [ ] [Preventive measure 2] (Owner: @user, Due: YYYY-MM-DD)

## Lessons Learned
[What we learned, what we'll do differently]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-17 | Initial runbook |

**Next Review:** 2026-01-17
