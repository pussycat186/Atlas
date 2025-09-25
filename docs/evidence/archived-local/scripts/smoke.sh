#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Atlas v12 Smoke Test"

# Helper functions
wait_http() {
  local url="$1"
  local name="$2"
  local max_attempts=30
  
  for i in $(seq 1 $max_attempts); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "✅ [$name] Ready"
      return 0
    fi
    echo "⏳ [$name] Waiting... ($i/$max_attempts)"
    sleep 2
  done
  
  echo "❌ [$name] Failed to start"
  return 1
}

wait_tcp() {
  local host="$1"
  local port="$2"
  local name="$3"
  local max_attempts=30
  
  for i in $(seq 1 $max_attempts); do
    if bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null; then
      echo "✅ [$name] Port open"
      return 0
    fi
    echo "⏳ [$name] Waiting... ($i/$max_attempts)"
    sleep 2
  done
  
  echo "❌ [$name] Port not open"
  return 1
}

# Check services
wait_http "http://localhost:9090/-/healthy" "Prometheus" || exit 1
wait_http "http://localhost:3200/ready" "Tempo" || exit 1
wait_http "http://localhost:3030/api/health" "Grafana" || exit 1
wait_tcp "127.0.0.1" "4317" "OTLP gRPC" || exit 1
wait_tcp "127.0.0.1" "4318" "OTLP HTTP" || exit 1

# Generate JSON result
cat << EOF
{
  "status": "success",
  "services": {
    "prometheus": "up",
    "tempo": "up", 
    "grafana": "up",
    "otlp_grpc": "open",
    "otlp_http": "open"
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "🎉 All services healthy!"