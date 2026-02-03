# Runbook: Security Incident Response

## Overview
**Incident Type**: Security Breach / Data Compromise  
**Severity**: Critical  
**Response Time**: Immediate (< 15 minutes)  
**Team**: Security, Engineering, Legal, PR

## Incident Types
1. **Data Breach**: Unauthorized access to user data
2. **Key Compromise**: Private keys exposed or stolen
3. **Service Compromise**: Server/infrastructure takeover
4. **Supply Chain Attack**: Malicious dependency introduced
5. **DDoS Attack**: Service unavailability due to attack

## Immediate Actions (First 15 Minutes)

### 1. Confirm Incident
```bash
# Check alerting dashboard
curl https://status.atlas.dev/api/alerts

# Review recent logs
kubectl logs -l app=atlas-gateway --since=1h -n atlas | grep -i "breach\|compromise\|unauthorized"

# Check auth failures
curl http://localhost:9464/metrics | grep atlas_auth_events_total
```

### 2. Activate Incident Response Team
```bash
# Page on-call engineer
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Authorization: Token token=YOUR_TOKEN' \
  -d '{"routing_key":"atlas-security","event_action":"trigger","payload":{"summary":"Security incident detected","severity":"critical"}}'

# Notify security team
# (Use internal incident management system)
```

### 3. Immediate Containment
```bash
# If key compromise suspected, rotate ALL keys immediately
./scripts/emergency-key-rotation.sh

# If service compromise suspected, isolate affected pods
kubectl cordon <node-name>
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# If data breach suspected, enable audit logging
kubectl set env deployment/atlas-gateway AUDIT_LEVEL=verbose -n atlas
```

## Investigation Phase (15-60 Minutes)

### 1. Gather Evidence
```bash
# Export all logs from last 24h
kubectl logs -l app=atlas-gateway --since=24h -n atlas > evidence/incidents/logs-$(date +%Y%m%d).txt

# Export metrics
curl http://localhost:9464/metrics > evidence/incidents/metrics-$(date +%Y%m%d).txt

# Capture network traffic (if available)
kubectl exec -it atlas-gateway-0 -n atlas -- tcpdump -i any -w /tmp/capture.pcap
kubectl cp atlas-gateway-0:/tmp/capture.pcap evidence/incidents/network-$(date +%Y%m%d).pcap -n atlas
```

### 2. Identify Attack Vector
Check common vectors:
- [ ] Compromised credentials (check `auth_failure` logs)
- [ ] Vulnerable dependency (check `npm audit`, Trivy scans)
- [ ] Misconfigured security headers (run `node scripts/scan-headers.mjs`)
- [ ] SQL injection / API abuse (check gateway logs)
- [ ] Social engineering (review recent access grants)

### 3. Assess Impact
```bash
# Check affected users
psql atlas -c "SELECT user_id, last_login FROM users WHERE last_login > NOW() - INTERVAL '24 hours';"

# Check compromised messages (if E2EE broken)
psql atlas -c "SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours';"

# Check key usage logs
grep "key_id" evidence/incidents/logs-$(date +%Y%m%d).txt | sort | uniq -c
```

## Remediation Phase (1-6 Hours)

### 1. Patch Vulnerability
```bash
# If dependency vulnerability
pnpm audit fix
pnpm build
pnpm test

# If code vulnerability
git checkout -b hotfix/security-$(date +%Y%m%d)
# Apply patch
git commit -m "fix: patch security vulnerability CVE-XXXX"
git push origin hotfix/security-$(date +%Y%m%d)

# Deploy hotfix
kubectl set image deployment/atlas-gateway \
  atlas-gateway=ghcr.io/pussycat186/atlas-gateway:hotfix-$(date +%Y%m%d) \
  -n atlas
```

### 2. Rotate All Credentials
```bash
# Rotate signing keys
./scripts/emergency-key-rotation.sh

# Rotate database passwords
gcloud sql users set-password atlas-db-user \
  --instance=atlas-prod \
  --password=$(openssl rand -base64 32)

# Rotate API tokens
# (Manual process: regenerate in admin panel)

# Invalidate all sessions
redis-cli -h redis.atlas.svc.cluster.local FLUSHDB
```

### 3. Restore Service
```bash
# Uncordon nodes
kubectl uncordon <node-name>

# Scale back up
kubectl scale deployment/atlas-gateway --replicas=3 -n atlas

# Verify health
kubectl get pods -n atlas
curl https://api.atlas.dev/health
```

## Communication Phase

### 1. Internal Communication
- [ ] Update incident log: `evidence/incidents/incident-$(date +%Y%m%d).md`
- [ ] Notify engineering team in Slack: `#atlas-incidents`
- [ ] Brief executive team: CEO, CTO, CFO
- [ ] Engage legal counsel (if data breach)

### 2. User Communication (If Required)
```markdown
# User Notification Template

Subject: Atlas Security Update - [DATE]

Dear Atlas User,

We are writing to inform you of a security incident that occurred on [DATE]. 

**What Happened**: [Brief description]
**What Information Was Affected**: [Specific data types]
**What We're Doing**: [Remediation steps]
**What You Should Do**: 
- Rotate your passkeys immediately
- Review your account activity
- Contact support@atlas.dev if you notice suspicious activity

We take security seriously and have implemented additional safeguards.

Atlas Security Team
```

### 3. Regulatory Notification (If Required)
- [ ] GDPR breach notification (within 72 hours to DPA)
- [ ] CCPA notification (if California residents affected)
- [ ] HIPAA notification (if applicable)
- [ ] State-specific breach notification laws

## Post-Incident Review (Within 7 Days)

### 1. Root Cause Analysis
Document in `evidence/incidents/rca-$(date +%Y%m%d).md`:
- Timeline of events
- Attack vector details
- Why existing controls failed
- Specific vulnerabilities exploited

### 2. Implement Preventive Measures
- [ ] Add new OPA policy to prevent recurrence
- [ ] Update security headers scanner
- [ ] Add new alert rules
- [ ] Schedule security training for team
- [ ] Update incident response plan (this document)

### 3. Metrics & KPIs
```bash
# Time to detect
echo "TTD: $(($(date +%s) - $INCIDENT_START_TIME))s" >> evidence/incidents/metrics.txt

# Time to contain
echo "TTC: $(($(date +%s) - $DETECTION_TIME))s" >> evidence/incidents/metrics.txt

# Time to recover
echo "TTR: $(($(date +%s) - $CONTAINMENT_TIME))s" >> evidence/incidents/metrics.txt
```

## Escalation Matrix

| Severity | Response Time | Escalation Path |
|----------|---------------|-----------------|
| Critical | < 15 min | On-Call → Security Lead → CTO → CEO |
| High | < 1 hour | On-Call → Security Lead → CTO |
| Medium | < 4 hours | On-Call → Security Lead |
| Low | < 24 hours | Security Lead |

## Contacts
- **Security Lead**: security@atlas.dev
- **On-Call**: Check PagerDuty
- **Legal**: legal@atlas.dev
- **PR**: pr@atlas.dev
- **DPO (GDPR)**: dpo@atlas.dev

## Related Documents
- [Key Rotation Runbook](./key-rotation.md)
- [E2EE Failure Runbook](./e2ee-failure.md)
- [Service Degradation Runbook](./service-degradation.md)
- [Security Policy](../legal/security.md)
- [Privacy Policy](../legal/privacy.md)
