#!/bin/bash

# ATLAS v12 Observability Test Script
# Tests the observability infrastructure

set -euo pipefail

echo "🧪 Testing ATLAS v12 Observability Infrastructure"

# Start observability stack
echo "📊 Starting observability stack..."
docker-compose -f docker-compose.observability.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Test Jaeger
echo "🔍 Testing Jaeger..."
if curl -s http://localhost:16686 > /dev/null; then
    echo "✅ Jaeger is running at http://localhost:16686"
else
    echo "❌ Jaeger is not accessible"
fi

# Test Prometheus
echo "📈 Testing Prometheus..."
if curl -s http://localhost:9090 > /dev/null; then
    echo "✅ Prometheus is running at http://localhost:9090"
else
    echo "❌ Prometheus is not accessible"
fi

# Test Grafana
echo "📊 Testing Grafana..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Grafana is running at http://localhost:3000 (admin/admin)"
else
    echo "❌ Grafana is not accessible"
fi

# Test OpenTelemetry Collector
echo "🔧 Testing OpenTelemetry Collector..."
if curl -s http://localhost:4318/v1/traces > /dev/null; then
    echo "✅ OpenTelemetry Collector is running at http://localhost:4318"
else
    echo "❌ OpenTelemetry Collector is not accessible"
fi

# Test Tempo
echo "⏱️ Testing Tempo..."
if curl -s http://localhost:3200 > /dev/null; then
    echo "✅ Tempo is running at http://localhost:3200"
else
    echo "❌ Tempo is not accessible"
fi

echo ""
echo "🎉 Observability infrastructure test complete!"
echo ""
echo "📋 Access URLs:"
echo "  - Jaeger UI: http://localhost:16686"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
echo "  - Tempo: http://localhost:3200"
echo ""
echo "🔧 To stop the stack: docker-compose -f docker-compose.observability.yml down"
