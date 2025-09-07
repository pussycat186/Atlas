#!/usr/bin/env bash
set -euo pipefail

services=(8091 8092 8093 8094 8095)
log(){ printf "\n[bench] %s\n" "$*"; }

# 1) Warm-up traffic
for port in "${services[@]}"; do
  for i in {1..5}; do
    curl -fsS -X POST "http://localhost:${port}/witness/record" \
      -H 'content-type: application/json' \
      -d "{\"app\":\"bench\",\"record_id\":\"${port}-${i}\",\"payload\":\"ok\",\"meta\":{\"round\":${i}}}" >/dev/null || true
  done
done

sleep 5

# 2) Verify Jaeger traces exist for each service
for s in atlas-w1 atlas-w2 atlas-w3 atlas-w4 atlas-w5; do
  n=$(curl -fsS "http://localhost:16686/api/traces?service=${s}&limit=1" | jq -r '.data | length')
  if [ "$n" -lt 1 ]; then echo "No traces for $s"; exit 1; fi
  log "Traces OK for $s"
done

# 3) Check spanmetrics in Prometheus (p95 & p99 via histogram_quantile)
for s in atlas-w1 atlas-w2 atlas-w3 atlas-w4 atlas-w5; do
  q95="histogram_quantile(0.95, sum by (le, service) (rate(traces_spanmetrics_duration_milliseconds_bucket{service=\"$s\"}[5m])))"
  q99="histogram_quantile(0.99, sum by (le, service) (rate(traces_spanmetrics_duration_milliseconds_bucket{service=\"$s\"}[5m])))"
  p95=$(curl -fsS --data-urlencode "query=$q95" http://localhost:9090/api/v1/query | jq -r '.data.result[0].value[1] // "0"')
  p99=$(curl -fsS --data-urlencode "query=$q99" http://localhost:9090/api/v1/query | jq -r '.data.result[0].value[1] // "0"')
  log "$s p95=${p95}ms p99=${p99}ms"
done

# 4) Error rate check
for s in atlas-w1 atlas-w2 atlas-w3 atlas-w4 atlas-w5; do
  er="100 * sum by (service) (rate(traces_spanmetrics_calls_total{service=\"$s\",status_code=~\"5..\"}[5m])) / sum by (service) (rate(traces_spanmetrics_calls_total{service=\"$s\"}[5m]))"
  val=$(curl -fsS --data-urlencode "query=$er" http://localhost:9090/api/v1/query | jq -r '.data.result[0].value[1] // "0"')
  log "$s error_rate=${val}%"
done

log "Auto-benchmark completed."
