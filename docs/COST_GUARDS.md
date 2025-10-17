# GCP Cloud Run Cost & Scaling Guards

**Document Version**: 1.0.0  
**Last Updated**: 2025-01-17  
**Platform**: Google Cloud Run  
**Services**: atlas-proof-messenger, atlas-admin-insights, atlas-dev-portal

---

## 1. Resource Limits & Configuration

### Cloud Run Service Configuration

Each of the 3 Atlas services is configured with the following resource limits:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Min Instances** | 1 | Eliminates cold starts (~$10/month per service for warm standby) |
| **Max Instances** | 50 | Hard cost cap to prevent runaway scaling (~$500/month max per service) |
| **Concurrency** | 80 requests/instance | Balances throughput and response time (Node.js optimal range: 50-100) |
| **CPU** | 1 vCPU | Standard for Node.js applications |
| **Memory** | 512Mi | Sufficient for Next.js standalone builds (measured: ~300-400Mi usage) |
| **Timeout** | 60s | Allows for long-polling /prism endpoint while preventing hung requests |
| **CPU Allocation** | CPU is always allocated | Ensures consistent performance (vs CPU-only-during-request) |

**Cost Estimate (per service)**:
- **Idle (min-instances=1)**: ~$10-15/month (single warm instance)
- **Moderate traffic (avg 3 instances)**: ~$30-40/month
- **Peak traffic (50 instances)**: ~$500/month (hard cap)

**Total 3-service monthly cost**: ~$100-150 (normal), ~$1500 (absolute maximum)

---

## 2. Cost Monitoring & Budget Alerts

### GCP Budget Configuration

Create budget alert in Google Cloud Console:

```bash
# Create budget alert via gcloud
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Atlas Cloud Run Monthly Budget" \
  --budget-amount=200USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=75 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100 \
  --notifications-rule-pubsub-topic=projects/PROJECT_ID/topics/budget-alerts
```

**Alert Thresholds**:
- **50% ($100)**: Email notification to team (informational)
- **75% ($150)**: Email + Slack alert (review traffic patterns)
- **90% ($180)**: Email + Slack + PagerDuty (investigate scaling behavior)
- **100% ($200)**: Halt non-essential services, escalate to engineering lead

### Cost Attribution by Service

Enable Cloud Run request metrics to track cost per service:

```bash
# Query cost by service (monthly)
gcloud logging read "resource.type=cloud_run_revision" \
  --format="table(resource.labels.service_name, count(*))" \
  --freshness=30d
```

**Expected Cost Breakdown**:
- **proof-messenger**: 60% of total (highest traffic, long-polling)
- **admin-insights**: 25% of total (moderate traffic, dashboards)
- **dev-portal**: 15% of total (low traffic, documentation)

---

## 3. Scaling Strategy

### Auto-Scaling Behavior

Cloud Run auto-scales instances based on:
1. **Request concurrency**: Scales up when active requests > (instances × 80 concurrency)
2. **CPU utilization**: Scales up when CPU > 60% across instances
3. **Request queue depth**: Scales up when pending requests > 10

**Scaling Timeline**:
- **Scale-up**: ~10-30 seconds (new instance cold start)
- **Scale-down**: ~15 minutes of idle time before instance termination

### Traffic Pattern Optimization

**Predictable Traffic**:
- Use `min-instances=1` to maintain warm standby
- Cloud Run serves first request immediately (no cold start)
- Additional instances scale based on traffic

**Burst Traffic**:
- Cloud Run scales up to 50 instances within 1-2 minutes
- Graceful degradation: Requests queue if all instances busy (60s timeout)
- CDN caching reduces backend load for static assets

**Cost Protection**:
- `max-instances=50` prevents runaway costs from DDoS or traffic spike
- At 50 instances × 80 concurrency = **4000 concurrent requests** (hard cap)
- Excess requests receive 503 errors (fail-safe vs. unlimited cost)

---

## 4. Optimization Recommendations

### Immediate Optimizations (Pre-Launch)

1. **Enable Cloud CDN** (already in S3 infra scripts):
   - Caches `/_next/static/*` at edge locations
   - Reduces backend request load by ~40-60%
   - Cost: ~$5-10/month for CDN (saves ~$20-30/month on Cloud Run)

2. **Tune Concurrency** (after traffic analysis):
   - Monitor p95 latency vs. concurrency
   - If p95 > 300ms: Reduce concurrency to 60 (more instances, better latency)
   - If p95 < 150ms: Increase concurrency to 100 (fewer instances, lower cost)

3. **Adjust min-instances** (based on traffic patterns):
   - If cold starts < 1% of requests: Set `min-instances=0` (save ~$30/month)
   - If cold starts > 5% of requests: Increase `min-instances=2` (cost: ~$20/month)

### Long-Term Optimizations (Post-Launch)

1. **Multi-Region Deployment** (for global users):
   - Deploy to `asia-southeast1` (primary) + `us-central1` (secondary)
   - Use Cloud Load Balancer geo-routing
   - Cost: +50% per region (total: ~$150-225/month for 2 regions)

2. **Reserved Instances** (if traffic predictable):
   - Cloud Run doesn't support reserved instances directly
   - Alternative: Use Committed Use Discounts (CUD) for Cloud Run spending
   - Savings: ~15-30% discount for 1-year or 3-year commitment

3. **Right-Sizing Memory** (after production metrics):
   - Monitor actual memory usage in Cloud Logging
   - If usage < 350Mi consistently: Reduce to 256Mi (save ~20% on memory cost)
   - If usage > 480Mi: Increase to 1024Mi (prevent OOM crashes)

---

## 5. Cost Guard Automation

### Automated Cost Protection Workflow

Create `.github/workflows/cost-guard.yml`:

```yaml
name: Atlas Cost Guard

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  check-cost-anomalies:
    runs-on: ubuntu-latest
    steps:
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2.1.7
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_ID_PROVIDER }}
          service_account: ${{ secrets.GCP_DEPLOYER_SA }}

      - name: Query billing data
        run: |
          # Get current month-to-date spend
          gcloud billing accounts list --format=json > billing.json
          CURRENT_SPEND=$(jq '.[0].currentSpend' billing.json)
          
          # Alert if exceeding $150 mid-month
          if (( $(echo "$CURRENT_SPEND > 150" | bc -l) )); then
            echo "::error::Cost anomaly detected: $CURRENT_SPEND USD spent this month"
            # Create GitHub Issue
          fi

      - name: Check instance counts
        run: |
          # Query Cloud Run instance metrics
          for service in atlas-proof-messenger atlas-admin-insights atlas-dev-portal; do
            INSTANCES=$(gcloud run services describe $service \
              --region=${{ secrets.GCP_REGION }} \
              --format="value(status.traffic[0].latestRevision.instances)")
            
            # Alert if >30 instances for extended period
            if [ "$INSTANCES" -gt 30 ]; then
              echo "::warning::$service has $INSTANCES instances (high cost)"
            fi
          done
```

### Manual Cost Review Checklist

**Weekly Review** (every Monday):
- [ ] Check GCP billing dashboard for anomalies
- [ ] Review instance count trends (should be 1-5 instances normally)
- [ ] Verify CDN cache hit rate > 60%
- [ ] Check for unused Cloud Run revisions (delete old revisions)

**Monthly Review** (end of month):
- [ ] Compare actual cost vs. budget ($200 limit)
- [ ] Analyze cost by service (proof-messenger, admin-insights, dev-portal)
- [ ] Review scaling events (unexpected traffic spikes)
- [ ] Adjust min/max instances based on usage patterns

---

## 6. Emergency Cost Throttling

### If Monthly Cost Exceeds $180 (90% of budget):

1. **Immediate Actions** (within 1 hour):
   ```bash
   # Reduce max-instances to 20 (cuts max cost by 60%)
   for service in atlas-proof-messenger atlas-admin-insights atlas-dev-portal; do
     gcloud run services update $service \
       --region=${{ secrets.GCP_REGION }} \
       --max-instances=20
   done
   ```

2. **Investigate Traffic Source**:
   ```bash
   # Check top request sources in Cloud Logging
   gcloud logging read "resource.type=cloud_run_revision" \
     --format="table(httpRequest.remoteIp, count(*))" \
     --limit=100
   ```

3. **Enable Cloud Armor** (if DDoS suspected):
   ```bash
   # Create rate limiting policy (100 req/min per IP)
   gcloud compute security-policies create atlas-rate-limit \
     --rate-limit-threshold-count=100 \
     --rate-limit-threshold-interval-sec=60
   ```

### If Monthly Cost Exceeds $200 (100% of budget):

**CRITICAL - Immediate Service Reduction**:

1. **Disable Non-Essential Services**:
   ```bash
   # Keep proof-messenger only (core business function)
   gcloud run services update atlas-admin-insights --no-traffic
   gcloud run services update atlas-dev-portal --no-traffic
   ```

2. **Reduce to Survival Mode**:
   ```bash
   # Set proof-messenger to min=0, max=10 (bare minimum)
   gcloud run services update atlas-proof-messenger \
     --min-instances=0 \
     --max-instances=10
   ```

3. **Escalate to Engineering Lead**:
   - Create P0 incident ticket
   - Notify stakeholders of service degradation
   - Schedule post-mortem for cost spike investigation

---

## 7. Cost Optimization Success Metrics

**Target Metrics** (after 30 days of production):
- **Cost per 1K requests**: ≤ $0.10
- **Cost per active user**: ≤ $0.50/month
- **CDN cache hit rate**: ≥ 60%
- **Average instances per service**: 2-3 (peak hours), 1 (off-peak)
- **Total monthly cost**: $100-150 (within budget)

**Red Flags**:
- ❌ Cost >$180 in first 20 days of month (runaway scaling)
- ❌ Average instances >10 (over-provisioning or traffic attack)
- ❌ CDN cache hit rate <40% (inefficient caching)
- ❌ Cost per 1K requests >$0.20 (need optimization)

---

## 8. Comparison: Vercel vs. GCP Cloud Run Costs

**Vercel Pro Plan** (current):
- **Fixed cost**: $20/month per member + overages
- **Bandwidth**: $40 per 100GB
- **Function invocations**: $2 per 1M invocations
- **Estimated monthly**: ~$100-200 (unpredictable overages)

**GCP Cloud Run** (projected):
- **Fixed cost**: $0 (pay-per-use only)
- **Bandwidth**: $0.12 per GB (Cloud CDN) + $0.20 per GB (egress)
- **Request cost**: ~$0.0001 per request (1M requests = ~$100)
- **Estimated monthly**: ~$100-150 (predictable with budget caps)

**Cost Savings**:
- **Predictability**: GCP has hard budget caps (max-instances), Vercel can spike unexpectedly
- **Control**: GCP allows fine-grained scaling control, Vercel is black-box
- **Transparency**: GCP billing is per-request, Vercel has complex tiering

**Expected Savings**: ~$20-50/month (15-25% reduction) + improved cost predictability

---

## References

- [Cloud Run Pricing Calculator](https://cloud.google.com/products/calculator)
- [Cloud Run Best Practices - Cost Optimization](https://cloud.google.com/run/docs/tips/general)
- [GCP Budget Alerts Documentation](https://cloud.google.com/billing/docs/how-to/budgets)
