# Atlas v12 Infrastructure Operations

## Quick Start

### Start Services
```bash
docker compose -f observability/docker-compose.yml up -d
```

### Run Health Check
```bash
bash scripts/smoke.sh
```

### Stop Services
```bash
docker compose -f observability/docker-compose.yml down
```

## Ports & Services

| Service | Port | Health Check | Purpose |
|---------|------|--------------|---------|
| Prometheus | 9090 | http://localhost:9090/-/healthy | Metrics collection |
| Grafana | 3030 | http://localhost:3030/api/health | Dashboards |
| Tempo | 3200 | http://localhost:3200/ready | Distributed tracing |
| OTel Collector | 4317/4318 | TCP check | Metrics/traces ingestion |

## Troubleshooting

### Services Not Starting
1. Check logs: `docker compose -f observability/docker-compose.yml logs <service>`
2. Verify ports: `lsof -i :9090` (or other port)
3. Restart: `docker compose -f observability/docker-compose.yml restart <service>`

### Smoke Test Failing
1. Wait longer: Services need 30-60s to start
2. Check Prometheus targets: http://localhost:9090/targets
3. Check Grafana: http://localhost:3030 (admin/admin)

### OTLP Ports Not Open
1. Check OTel Collector logs: `docker logs observability-otel-collector-1`
2. Verify config: `docker exec observability-otel-collector-1 cat /etc/otelcol-contrib/config.yaml`

### Grafana Dashboard Issues
1. Check datasources: http://localhost:3030/datasources
2. Verify Prometheus connection: http://localhost:3030/datasources/edit/prometheus
3. Reload dashboard: http://localhost:3030/dashboards

## Monitoring

### Key Metrics
- `up` - Service availability (1 = up, 0 = down)
- `scrape_duration_seconds` - OTLP exporter performance
- `prometheus_tsdb_head_samples` - Prometheus data ingestion

### Alerts
- **PrometheusTargetsDown**: Any target is down for >1m
- **OTLPExporterDown**: OTLP Collector is down for >1m

## Maintenance

### Update Images
```bash
docker compose -f observability/docker-compose.yml pull
docker compose -f observability/docker-compose.yml up -d
```

### Backup Data
```bash
docker run --rm -v observability_prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz -C /data .
```

### Clean Restart
```bash
docker compose -f observability/docker-compose.yml down -v
docker compose -f observability/docker-compose.yml up -d
```
