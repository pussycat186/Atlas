# Atlas Observability Stack

This directory contains the observability infrastructure for the Atlas ecosystem, including Prometheus metrics collection and Grafana dashboards.

## Quick Start

### 1. Start the Observability Stack

```bash
# Start Prometheus and Grafana
docker compose up -d

# Access the services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

### 2. Start Atlas Services with Metrics

```bash
# Start Atlas services with metrics enabled
docker compose -f ../infra/docker/compose.dev.yml up -d

# Or use the observability compose file that includes everything
docker compose -f docker-compose.yml up -d
```

## Metrics Endpoints

- **Gateway**: `http://localhost:8080/metrics`
- **Witness Nodes**: `http://localhost:8091-8095/metrics`

## Available Metrics

### Gateway Metrics
- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_seconds` - HTTP request latency histogram
- `quorum_attempts_total` - Quorum operation attempts
- `quorum_success_total` - Successful quorum operations
- `quorum_failure_total` - Failed quorum operations
- `witness_request_duration_seconds` - Witness request latency
- `witness_requests_total` - Witness request counts

### Witness Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - HTTP request latency
- `witness_attestations_total` - Attestation counts by app and status
- `witness_attestation_duration_seconds` - Attestation processing time
- `witness_ledger_size` - Current ledger size
- `witness_ledger_operations_total` - Ledger operation counts

## Grafana Dashboard

The Atlas dashboard includes:
- HTTP request rate and latency
- Quorum success rates
- Witness attestation metrics
- Service health status
- Ledger size monitoring
- Performance trends

## Configuration

### Prometheus
Edit `prometheus.yml` to modify scrape targets and intervals.

### Grafana
- Default login: admin/admin
- Dashboard: Import `grafana/atlas-dashboard.json`
- Data source: Prometheus at `http://prometheus:9090`

## Development

### Adding New Metrics

1. Add metric definition to `services/*/src/metrics.ts`
2. Register metric with the registry
3. Add recording calls in your service code
4. Update Grafana dashboard if needed

### Testing Metrics

```bash
# Test metrics endpoints
curl http://localhost:8080/metrics | grep http_requests_total
curl http://localhost:8091/metrics | grep witness_attestations_total

# Validate Prometheus format
curl http://localhost:8080/metrics | head -20
```

## Troubleshooting

### Metrics Not Appearing
1. Check service logs for metric registration errors
2. Verify Prometheus can reach the services
3. Check network connectivity between services

### Dashboard Issues
1. Verify Prometheus data source is configured
2. Check that metrics queries are valid
3. Ensure time range includes data

### Performance Impact
- Metrics collection adds minimal overhead
- Histogram buckets are optimized for Atlas workloads
- Consider reducing scrape frequency for high-volume deployments
