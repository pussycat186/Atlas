# Atlas v12 Runbook

This runbook provides step-by-step procedures for common operational tasks and incident response.

## 🚨 Emergency Procedures

### Service Down - Immediate Response

#### 1. Assess the Situation (2 minutes)

```bash
# Check service status
curl -f http://localhost:3006/api/health || echo "Web app down"
curl -f http://localhost:3000/health || echo "Gateway down"
curl -f http://localhost:3030/api/health || echo "Grafana down"

# Check Docker containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check system resources
free -h
df -h
top -bn1 | head -20
```

#### 2. Quick Recovery (5 minutes)

```bash
# Restart all services
docker compose -f observability/docker-compose.yml restart

# Wait for services to come up
sleep 30

# Verify recovery
bash scripts/smoke.sh
```

#### 3. If Quick Recovery Fails (10 minutes)

```bash
# Check logs for errors
docker logs atlas-web --tail 50
docker logs atlas-gateway --tail 50
docker logs grafana --tail 50

# Check for resource issues
docker stats --no-stream

# Restart individual services
docker compose -f observability/docker-compose.yml stop grafana
docker compose -f observability/docker-compose.yml start grafana
```

### High Error Rate - Response Procedure

#### 1. Identify the Source (3 minutes)

```bash
# Check error logs
docker logs atlas-web 2>&1 | grep -i error | tail -20
docker logs atlas-gateway 2>&1 | grep -i error | tail -20

# Check Prometheus metrics
curl -s http://localhost:9090/api/v1/query?query=rate\(http_requests_total\{status=~"5.."\}\[5m\]\) | jq

# Check Grafana dashboard
open http://localhost:3030/d/atlas-overview
```

#### 2. Mitigate Impact (5 minutes)

```bash
# If database issues
docker restart atlas-database

# If external API issues
# Check external service status
curl -I https://api.external-service.com/health

# If memory issues
docker restart atlas-web atlas-gateway
```

#### 3. Monitor Recovery (10 minutes)

```bash
# Watch error rate in real-time
watch -n 5 'curl -s http://localhost:9090/api/v1/query?query=rate\(http_requests_total\{status=~"5.."\}\[5m\]\) | jq'

# Check service health
watch -n 10 'bash scripts/smoke.sh'
```

### Witness Network Issues

#### 1. Check Witness Status (2 minutes)

```bash
# Check all witness nodes
for i in {1..5}; do
  echo "Witness w$i:"
  curl -s http://localhost:300$i/witness/health | jq
done

# Check quorum status
curl -s http://localhost:3000/admin/quorum | jq
```

#### 2. Restart Failed Witnesses (5 minutes)

```bash
# Restart specific witness nodes
docker compose restart witness-w1 witness-w2

# Wait for quorum recovery
sleep 30

# Verify quorum
curl -s http://localhost:3000/admin/quorum | jq
```

#### 3. If Quorum Lost (10 minutes)

```bash
# Emergency: Restart all witness nodes
docker compose restart witness-w1 witness-w2 witness-w3 witness-w4 witness-w5

# Wait for network stabilization
sleep 60

# Verify full quorum
curl -s http://localhost:3000/admin/quorum | jq
```

## 🔧 Routine Maintenance

### Daily Health Checks

#### Morning Checklist (5 minutes)

```bash
#!/bin/bash
# daily-health-check.sh

echo "=== Atlas v12 Daily Health Check ==="
echo "Timestamp: $(date)"

# Service health
echo "1. Checking service health..."
curl -f http://localhost:3006/api/health && echo "✅ Web app healthy" || echo "❌ Web app unhealthy"
curl -f http://localhost:3000/health && echo "✅ Gateway healthy" || echo "❌ Gateway unhealthy"
curl -f http://localhost:3030/api/health && echo "✅ Grafana healthy" || echo "❌ Grafana unhealthy"

# Resource usage
echo "2. Checking resource usage..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')

echo "Memory: $MEMORY_USAGE"
echo "CPU: $CPU_USAGE%"
echo "Disk: $DISK_USAGE"

# Witness network
echo "3. Checking witness network..."
QUORUM_COUNT=$(curl -s http://localhost:3000/admin/quorum | jq '.quorumCount')
echo "Witness quorum: $QUORUM_COUNT/5"

# Recent errors
echo "4. Checking recent errors..."
ERROR_COUNT=$(docker logs atlas-web --since 1h 2>&1 | grep -i error | wc -l)
echo "Errors in last hour: $ERROR_COUNT"

echo "=== Health Check Complete ==="
```

#### Weekly Maintenance (30 minutes)

```bash
#!/bin/bash
# weekly-maintenance.sh

echo "=== Atlas v12 Weekly Maintenance ==="

# 1. Update system packages
echo "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Clean up Docker
echo "2. Cleaning up Docker..."
docker system prune -f
docker volume prune -f

# 3. Backup configurations
echo "3. Backing up configurations..."
tar -czf atlas-config-backup-$(date +%Y%m%d).tar.gz \
  observability/ \
  infra/ \
  .env* \
  docker-compose*.yml

# 4. Check disk space
echo "4. Checking disk space..."
df -h

# 5. Review logs for issues
echo "5. Reviewing logs for issues..."
docker logs atlas-web --since 7d 2>&1 | grep -i error | tail -10
docker logs atlas-gateway --since 7d 2>&1 | grep -i error | tail -10

# 6. Performance review
echo "6. Performance review..."
curl -s http://localhost:9090/api/v1/query?query=rate\(http_requests_total\[1d\]\) | jq

echo "=== Weekly Maintenance Complete ==="
```

### Backup Procedures

#### Configuration Backup

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/backups/atlas"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating configuration backup..."

# Backup Docker Compose files
tar -czf $BACKUP_DIR/atlas-config-$DATE.tar.gz \
  observability/ \
  infra/ \
  .env* \
  docker-compose*.yml \
  scripts/ \
  tests/

# Backup Grafana dashboards
docker exec grafana grafana-cli admin export-dashboard > $BACKUP_DIR/grafana-dashboards-$DATE.json

# Backup Prometheus configuration
docker cp prometheus:/etc/prometheus/prometheus.yml $BACKUP_DIR/prometheus-config-$DATE.yml

echo "Backup completed: $BACKUP_DIR/atlas-config-$DATE.tar.gz"
```

#### Data Backup

```bash
#!/bin/bash
# backup-data.sh

BACKUP_DIR="/backups/atlas/data"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating data backup..."

# Backup Prometheus data
docker exec prometheus tar -czf /tmp/prometheus-data-$DATE.tar.gz /prometheus
docker cp prometheus:/tmp/prometheus-data-$DATE.tar.gz $BACKUP_DIR/

# Backup Tempo traces
docker exec tempo tar -czf /tmp/tempo-data-$DATE.tar.gz /tmp/tempo
docker cp tempo:/tmp/tempo-data-$DATE.tar.gz $BACKUP_DIR/

# Backup application data (if any)
if [ -d "data/" ]; then
  tar -czf $BACKUP_DIR/app-data-$DATE.tar.gz data/
fi

echo "Data backup completed: $BACKUP_DIR/"
```

### Log Management

#### Log Rotation Setup

```bash
#!/bin/bash
# setup-log-rotation.sh

echo "Setting up log rotation..."

# Create logrotate configuration
sudo tee /etc/logrotate.d/atlas << EOF
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

/var/lib/docker/containers/*/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker restart \$(docker ps -q)
    endscript
}
EOF

echo "Log rotation configured"
```

#### Log Analysis

```bash
#!/bin/bash
# analyze-logs.sh

echo "=== Atlas v12 Log Analysis ==="

# Error analysis
echo "1. Error Analysis (last 24h):"
docker logs atlas-web --since 24h 2>&1 | grep -i error | sort | uniq -c | sort -nr | head -10

# Performance analysis
echo "2. Performance Analysis:"
docker logs atlas-gateway --since 24h 2>&1 | grep -i "slow\|timeout" | tail -10

# Security analysis
echo "3. Security Analysis:"
docker logs atlas-gateway --since 24h 2>&1 | grep -i "unauthorized\|forbidden\|attack" | tail -10

# Resource analysis
echo "4. Resource Analysis:"
docker logs atlas-web --since 24h 2>&1 | grep -i "memory\|cpu\|disk" | tail -10

echo "=== Log Analysis Complete ==="
```

## 🔍 Troubleshooting Guide

### Performance Issues

#### Slow Response Times

```bash
# 1. Check resource usage
docker stats --no-stream

# 2. Check database performance
docker exec atlas-database psql -U atlas -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# 3. Check slow queries
docker exec atlas-database psql -U atlas -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 4. Check network latency
ping -c 5 external-api.com

# 5. Check Prometheus metrics
curl -s http://localhost:9090/api/v1/query?query=histogram_quantile\(0.95,rate\(http_request_duration_seconds_bucket\[5m\]\)\) | jq
```

#### High Memory Usage

```bash
# 1. Check memory usage by container
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# 2. Check for memory leaks
docker exec atlas-web ps aux --sort=-%mem | head -10

# 3. Check swap usage
free -h

# 4. Restart services if needed
docker compose restart atlas-web atlas-gateway
```

#### High CPU Usage

```bash
# 1. Check CPU usage by container
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}"

# 2. Check system load
uptime
top -bn1 | head -5

# 3. Check for runaway processes
docker exec atlas-web ps aux --sort=-%cpu | head -10

# 4. Check Prometheus metrics
curl -s http://localhost:9090/api/v1/query?query=rate\(process_cpu_seconds_total\[5m\]\) | jq
```

### Database Issues

#### Connection Problems

```bash
# 1. Test database connectivity
docker exec atlas-web nc -zv atlas-database 5432

# 2. Check database status
docker exec atlas-database pg_isready -U atlas

# 3. Check connection pool
docker exec atlas-web psql -U atlas -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Check database logs
docker logs atlas-database --tail 50
```

#### Query Performance

```bash
# 1. Check active queries
docker exec atlas-database psql -U atlas -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"

# 2. Check slow queries
docker exec atlas-database psql -U atlas -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 3. Check table sizes
docker exec atlas-database psql -U atlas -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Network Issues

#### Connectivity Problems

```bash
# 1. Check internal network connectivity
docker network ls
docker network inspect atlas_default

# 2. Test service-to-service communication
docker exec atlas-web curl -f http://atlas-gateway:3000/health
docker exec atlas-gateway curl -f http://atlas-database:5432

# 3. Check DNS resolution
docker exec atlas-web nslookup atlas-gateway
docker exec atlas-web nslookup atlas-database

# 4. Check port accessibility
netstat -tulpn | grep :3006
netstat -tulpn | grep :3000
```

#### External API Issues

```bash
# 1. Test external API connectivity
curl -I https://api.external-service.com/health

# 2. Check DNS resolution
nslookup api.external-service.com

# 3. Check firewall rules
sudo ufw status
sudo iptables -L

# 4. Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

## 📞 Incident Response

### Severity Levels

#### P1 - Critical (Response: 15 minutes)
- Complete service outage
- Data loss or corruption
- Security breach
- Witness quorum lost

#### P2 - High (Response: 1 hour)
- Partial service degradation
- Performance issues affecting users
- High error rates
- External dependency failures

#### P3 - Medium (Response: 4 hours)
- Minor functionality issues
- Non-critical performance problems
- Configuration issues
- Monitoring alerts

#### P4 - Low (Response: 24 hours)
- Documentation issues
- Enhancement requests
- Non-urgent bugs
- Maintenance tasks

### Incident Response Process

#### 1. Initial Response (0-15 minutes)

```bash
# Acknowledge the incident
echo "INCIDENT ACKNOWLEDGED: $(date)" >> /var/log/incidents.log

# Assess impact
bash scripts/smoke.sh > incident-assessment-$(date +%Y%m%d_%H%M%S).log

# Notify stakeholders
# Send alert to on-call team
# Update status page if needed
```

#### 2. Investigation (15-30 minutes)

```bash
# Gather information
docker logs atlas-web --tail 100 > incident-logs-web-$(date +%Y%m%d_%H%M%S).log
docker logs atlas-gateway --tail 100 > incident-logs-gateway-$(date +%Y%m%d_%H%M%S).log
docker stats --no-stream > incident-resources-$(date +%Y%m%d_%H%M%S).log

# Check recent changes
git log --oneline -10 > incident-changes-$(date +%Y%m%d_%H%M%S).log

# Analyze metrics
curl -s http://localhost:9090/api/v1/query?query=rate\(http_requests_total\[1h\]\) > incident-metrics-$(date +%Y%m%d_%H%M%S).json
```

#### 3. Resolution (30-60 minutes)

```bash
# Implement fix
# Document actions taken
echo "RESOLUTION ATTEMPTED: $(date)" >> /var/log/incidents.log

# Verify fix
bash scripts/smoke.sh

# Monitor recovery
watch -n 30 'bash scripts/smoke.sh'
```

#### 4. Post-Incident (1-24 hours)

```bash
# Document incident
cat > incident-report-$(date +%Y%m%d_%H%M%S).md << EOF
# Incident Report

## Summary
Brief description of the incident

## Timeline
- Time: Incident detected
- Time: Investigation started
- Time: Resolution attempted
- Time: Service restored

## Root Cause
Analysis of what caused the incident

## Impact
- Services affected
- Users impacted
- Duration of outage

## Actions Taken
- Immediate response
- Investigation steps
- Resolution steps

## Prevention
- Changes to prevent recurrence
- Monitoring improvements
- Process improvements
EOF

# Schedule post-incident review
# Update runbook if needed
# Implement preventive measures
```

### Communication Templates

#### Incident Notification

```
🚨 INCIDENT ALERT 🚨

Severity: P1 - Critical
Service: Atlas v12
Status: Investigating
Impact: Complete service outage
Start Time: 2024-01-01 10:00 UTC
Affected: All users

Description: Atlas v12 services are currently down. Investigation in progress.

Updates will be provided every 15 minutes.

Incident Commander: [Name]
On-Call Engineer: [Name]
```

#### Status Update

```
📢 INCIDENT UPDATE

Severity: P1 - Critical
Service: Atlas v12
Status: Resolving
Impact: Partial service degradation
Duration: 45 minutes

Progress: Root cause identified as database connection pool exhaustion. Implementing fix.

Next update: 15 minutes
```

#### Resolution Notification

```
✅ INCIDENT RESOLVED

Severity: P1 - Critical
Service: Atlas v12
Status: Resolved
Impact: Complete service outage
Duration: 1 hour 15 minutes

Resolution: Restarted database connection pool and scaled up resources.

Post-incident review scheduled for tomorrow at 10:00 UTC.
```

## 📋 Checklists

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance tests passed
- [ ] Backup completed
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
- [ ] Documentation updated

### Post-Deployment Checklist

- [ ] Service health verified
- [ ] Monitoring dashboards updated
- [ ] Error rates normal
- [ ] Performance metrics acceptable
- [ ] User feedback collected
- [ ] Deployment documented
- [ ] Team notified of completion

### Monthly Maintenance Checklist

- [ ] Security patches applied
- [ ] Performance review completed
- [ ] Capacity planning updated
- [ ] Backup procedures tested
- [ ] Documentation reviewed
- [ ] Team training completed
- [ ] Incident response tested
- [ ] Monitoring alerts reviewed
