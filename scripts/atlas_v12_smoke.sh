#!/usr/bin/env bash
set -euo pipefail
INSIGHTS_COMPOSE="observability/docker-compose.insights.yml"
GRAFANA_PORT=3030; PROM_PORT=9090; LOKI_PORT=3100; TEMPO_PORT=3200; OTLP_GRPC=4317; OTLP_HTTP=4318

wait_http(){ url="$1"; name="$2"; for i in {1..60}; do code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true); [[ "$code" == "200" ]] && echo "[$name] OK" && return 0; sleep 2; done; echo "[$name] NOT READY ($url)"; return 1; }
wait_tcp(){ host="$1"; port="$2"; name="$3"; for i in {1..60}; do (</dev/tcp/$host/$port) &>/dev/null && echo "[$name] OK" && return 0; sleep 2; done; echo "[$name] NOT OPEN $host:$port"; return 1; }

[[ -f "$INSIGHTS_COMPOSE" ]] || { echo "ERROR: $INSIGHTS_COMPOSE not found"; exit 2; }
docker compose -f "$INSIGHTS_COMPOSE" up -d

wait_http http://localhost:${PROM_PORT}/api/v1/targets Prometheus || exit 1
wait_http http://localhost:${GRAFANA_PORT}/api/health Grafana || exit 1

if [[ "${SKIP_LOKI:-0}" == "1" ]]; then
  echo "[Loki] SKIPPED by SKIP_LOKI=1"
else
  wait_http http://localhost:${LOKI_PORT}/ready Loki || exit 1
fi

wait_http http://localhost:${TEMPO_PORT}/ready Tempo || exit 1
wait_tcp 127.0.0.1 $OTLP_GRPC "OTLP gRPC" || exit 1
wait_tcp 127.0.0.1 $OTLP_HTTP "OTLP HTTP" || exit 1

printf '{"insights":{"prom":"up","grafana":"up","loki":"%s","tempo":"up","otlp_grpc":"open","otlp_http":"open"}}\n' "${SKIP_LOKI:-0}" | sed 's/"0"/"up"/;s/"1"/"skipped"/'
