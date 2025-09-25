# Atlas v12 Operations Guide

This guide covers deployment, monitoring, and operational procedures for Atlas v12.

## 🚀 Deployment

### Prerequisites

- Docker & Docker Compose v2
- Node.js 20 LTS
- 4GB+ RAM, 2+ CPU cores
- 20GB+ disk space

### Quick Deployment

```bash
# Clone repository
git clone https://github.com/your-org/Atlas.git
cd Atlas

# Start observability stack
docker compose -f observability/docker-compose.yml up -d

# Start web application
cd apps/web
pnpm install
pnpm run build
pnpm run start
```

### Production Deployment

#### Docker Compose (Recommended for small deployments)

```bash
# Create production environment file
cat > .env.production << EOF
NODE_ENV=production
ATLAS_DEMO_MODE=false
ATLAS_LOG_LEVEL=info
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
PROMETHEUS_ENDPOINT=http://prometheus:9090
GRAFANA_ENDPOINT=http://grafana:3030
EOF

# Deploy with production compose file
docker compose -f infra/docker/compose.prod.yml up -d
```

#### Kubernetes (Recommended for large deployments)

```bash
# Install Helm chart
helm install atlas ./infra/k8s/atlas \
  --set image.tag=v1.0.0 \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=atlas.yourdomain.com \
  --set ingress.tls[0].secretName=atlas-tls

# Verify deployment
kubectl get pods -l app.kubernetes.io/name=atlas
```

### Environment Configuration

#### Required Environment Variables

```bash
# Core Configuration
NODE_ENV=production
ATLAS_LOG_LEVEL=info
ATLAS_DEMO_MODE=false

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/atlas

# Redis
REDIS_URL=redis://localhost:6379

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
PROMETHEUS_ENDPOINT=http://prometheus:9090
GRAFANA_ENDPOINT=http://grafana:3030

# Security
ATLAS_JWT_SECRET=your-super-secret-jwt-key
ATLAS_API_KEY_PREFIX=sk_live_
ATLAS_ENCRYPTION_KEY=your-32-character-encryption-key

# External Services
ATLAS_SMTP_HOST=smtp.yourdomain.com
ATLAS_SMTP_PORT=587
ATLAS_SMTP_USER=noreply@yourdomain.com
ATLAS_SMTP_PASS=your-smtp-password
```

## 📊 Monitoring

### Health Checks

#### Service Health Endpoints

| Service | Health Endpoint | Expected Response |
|---------|----------------|-------------------|
| Web App | `GET /api/health` | `{"status": "healthy", "timestamp": "..."}` |
| Gateway | `GET /health` | `{"status": "healthy", "witnesses": 4}` |
| Witness Nodes | `GET /witness/health` | `{"status": "healthy", "attestations": 12345}` |
| Grafana | `GET /api/health` | `{"database": "ok", "version": "..."}` |
| Prometheus | `GET /api/v1/targets` | `{"status": "success", "data": {...}}` |
| Tempo | `GET /ready` | `200 OK` |

#### Automated Health Monitoring

```bash
# Run health check script
bash scripts/smoke.sh

# Expected output
{
  "status": "success",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "prometheus": "healthy",
    "tempo": "healthy", 
    "grafana": "healthy",
    "otel-collector": "healthy"
  },
  "checks": {
    "http_health": "passed",
    "tcp_ports": "passed",
    "otlp_endpoints": "passed"
  }
}
```

### Grafana Dashboards

#### Access Grafana

```bash
# Local development
open http://localhost:3030

# Production (replace with your domain)
open https://grafana.yourdomain.com
```

**Default Credentials:**
- Username: `admin`
- Password: `admin` (change in production!)

#### Key Dashboards

1. **Atlas v12 Overview**
   - System health summary
   - Request rates and latency
   - Error rates and trends
   - Witness network status

2. **Application Performance**
   - Response time percentiles (P50, P95, P99)
   - Throughput (requests/second)
   - Error rates by endpoint
   - Database query performance

3. **Infrastructure Metrics**
   - CPU, memory, disk usage
   - Network I/O
   - Container health
   - Resource utilization trends

4. **Business Metrics**
   - User activity
   - API key usage
   - Data ingestion rates
   - Witness attestations

### Prometheus Alerts

#### Critical Alerts

```yaml
# Service Down Alert
- alert: AtlasServiceDown
  expr: up{job="atlas-gateway"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Atlas Gateway is down"
    description: "Atlas Gateway has been down for more than 1 minute"

# High Error Rate Alert  
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High error rate detected"
    description: "Error rate is above 10% for 2 minutes"

# Witness Quorum Lost
- alert: WitnessQuorumLost
  expr: atlas_witness_quorum_count < 4
  for: 30s
  labels:
    severity: critical
  annotations:
    summary: "Witness quorum lost"
    description: "Less than 4 witnesses are healthy"
```

#### Alert Channels

Configure alert channels in Grafana:

1. **Email Notifications**
   - SMTP server configuration
   - Recipient lists for different severity levels
   - Alert templates and formatting

2. **Slack Integration**
   - Webhook URL configuration
   - Channel routing by severity
   - Rich message formatting

3. **PagerDuty Integration**
   - Service key configuration
   - Escalation policies
   - Incident management

## 🔧 Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check service health status
- [ ] Review error logs and alerts
- [ ] Monitor resource utilization
- [ ] Verify witness network quorum

#### Weekly
- [ ] Review performance metrics trends
- [ ] Update security patches
- [ ] Backup configuration and data
- [ ] Review and rotate API keys

#### Monthly
- [ ] Capacity planning review
- [ ] Security audit and compliance check
- [ ] Update documentation
- [ ] Performance optimization review

### Backup Procedures

#### Configuration Backup

```bash
# Backup Docker Compose configurations
tar -czf atlas-config-backup-$(date +%Y%m%d).tar.gz \
  observability/ \
  infra/ \
  .env* \
  docker-compose*.yml

# Backup Grafana dashboards and datasources
docker exec grafana grafana-cli admin export-dashboard > grafana-dashboards.json
```

#### Data Backup

```bash
# Backup Prometheus data
docker exec prometheus tar -czf /tmp/prometheus-backup.tar.gz /prometheus
docker cp prometheus:/tmp/prometheus-backup.tar.gz ./prometheus-backup-$(date +%Y%m%d).tar.gz

# Backup Tempo traces
docker exec tempo tar -czf /tmp/tempo-backup.tar.gz /tmp/tempo
docker cp tempo:/tmp/tempo-backup.tar.gz ./tempo-backup-$(date +%Y%m%d).tar.gz
```

### Log Management

#### Log Rotation

```bash
# Configure logrotate for application logs
cat > /etc/logrotate.d/atlas << EOF
/var/log/atlas/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 atlas atlas
    postrotate
        docker restart atlas-web atlas-gateway
    endscript
}
EOF
```

#### Log Aggregation

For production deployments, consider centralized logging:

```yaml
# Add to docker-compose.yml
services:
  loki:
    image: grafana/loki:2.9.4
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.9.4
    volumes:
      - /var/log:/var/log:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check Docker status
docker ps -a
docker logs <container-name>

# Check resource usage
docker stats

# Check port conflicts
netstat -tulpn | grep :3006
```

#### High Memory Usage

```bash
# Check memory usage by container
docker stats --no-stream

# Check for memory leaks
docker exec <container> ps aux --sort=-%mem

# Restart services if needed
docker compose restart
```

#### Database Connection Issues

```bash
# Check database connectivity
docker exec atlas-web nc -zv database-host 5432

# Check database logs
docker logs atlas-database

# Verify connection string
echo $DATABASE_URL
```

#### Witness Network Issues

```bash
# Check witness node health
curl http://localhost:3001/witness/health
curl http://localhost:3002/witness/health
# ... repeat for all witness nodes

# Check quorum status
curl http://localhost:3000/admin/quorum

# Restart witness nodes if needed
docker compose restart witness-w1 witness-w2 witness-w3 witness-w4 witness-w5
```

### Performance Issues

#### Slow Response Times

1. **Check resource utilization**
   ```bash
   docker stats
   top
   ```

2. **Review application logs**
   ```bash
   docker logs atlas-web --tail 100
   docker logs atlas-gateway --tail 100
   ```

3. **Check database performance**
   ```bash
   # Connect to database and run
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

4. **Review Prometheus metrics**
   - Check `http_request_duration_seconds` histogram
   - Look for slow database queries
   - Identify resource bottlenecks

#### High Error Rates

1. **Check error logs**
   ```bash
   docker logs atlas-web 2>&1 | grep ERROR
   docker logs atlas-gateway 2>&1 | grep ERROR
   ```

2. **Review Grafana error rate dashboard**
   - Identify which endpoints are failing
   - Check error patterns and timing
   - Look for correlation with traffic spikes

3. **Check external dependencies**
   ```bash
   # Test external API connectivity
   curl -I https://api.external-service.com/health
   ```

### Security Issues

#### Unauthorized Access

1. **Check authentication logs**
   ```bash
   docker logs atlas-gateway | grep "authentication failed"
   ```

2. **Review API key usage**
   ```bash
   # Check API key access patterns in Grafana
   # Look for unusual IP addresses or request patterns
   ```

3. **Verify security headers**
   ```bash
   curl -I http://localhost:3006
   # Should include security headers like X-Frame-Options, CSP, etc.
   ```

#### Data Integrity Issues

1. **Check witness attestations**
   ```bash
   curl http://localhost:3000/admin/witness-status
   ```

2. **Verify data consistency**
   ```bash
   # Run data integrity checks
   docker exec atlas-gateway npm run data-integrity-check
   ```

## 📞 Support

### Escalation Procedures

1. **Level 1 - Basic Issues**
   - Check service health endpoints
   - Review recent deployments
   - Check resource utilization
   - Restart services if needed

2. **Level 2 - Complex Issues**
   - Deep dive into logs and metrics
   - Check external dependencies
   - Review configuration changes
   - Engage development team

3. **Level 3 - Critical Issues**
   - Immediate incident response
   - Coordinate with all teams
   - Implement emergency procedures
   - Post-incident review

### Contact Information

- **On-Call Engineer**: oncall@yourdomain.com
- **Development Team**: dev-team@yourdomain.com
- **Security Team**: security@yourdomain.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### Documentation Resources

- [Atlas v12 API Documentation](docs/api.md)
- [Security Best Practices](SECURITY.md)
- [Runbook for Common Issues](RUNBOOK.md)
- [Changelog and Updates](CHANGELOG.md)