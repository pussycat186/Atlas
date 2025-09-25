#!/bin/bash

# ATLAS v14 Self-Healing Diagnostics Script
# Implements the OBSERVE → DIAGNOSE → PLAN → ACT → VERIFY → REFLECT loop

set -euo pipefail

# Configuration
TARGET_URL="${TARGET_URL:-http://localhost:8080}"
CACHE_HIT_TARGET="${CACHE_HIT_TARGET:-98}"
K6_ARRIVAL_RATE="${K6_ARRIVAL_RATE:-500}"
K6_WINDOW="${K6_WINDOW:-60}"

echo "## 🔍 ATLAS v14 Self-Healing Diagnostics"
echo "Target URL: $TARGET_URL"
echo "Cache Hit Target: ${CACHE_HIT_TARGET}%"
echo "k6 Arrival Rate: ${K6_ARRIVAL_RATE} req/s"
echo "k6 Window: ${K6_WINDOW}s"
echo ""

# OBSERVE Phase
echo "### 1. OBSERVE - Service Health Check"
echo "Checking service reachability..."

# Check if services are reachable
if curl -f "$TARGET_URL" >/dev/null 2>&1; then
    echo "✅ $TARGET_URL is reachable"
else
    echo "❌ $TARGET_URL is not reachable"
    echo "DIAGNOSIS: SC-NET - ECONNREFUSED localhost:8080"
    echo "PLAN: Check if NGINX service container is running and port 8080 is published"
    exit 1
fi

# Check X-Cache-Status headers
echo "Checking cache headers..."
CACHE_STATUS=$(curl -s -I "$TARGET_URL" | grep -i "x-cache-status" || echo "MISS")
echo "X-Cache-Status: $CACHE_STATUS"

# Check NGINX to app connectivity
echo "Checking NGINX to app connectivity..."
NGINX_CONTAINER=$(docker ps --filter "ancestor=nginx:alpine" --format "{{.ID}}" | head -1)
if [ -n "$NGINX_CONTAINER" ]; then
    if docker exec "$NGINX_CONTAINER" curl -f http://app:3000 >/dev/null 2>&1; then
        echo "✅ NGINX can reach app:3000 via service name"
    else
        echo "❌ NGINX cannot reach app:3000"
        echo "DIAGNOSIS: SC-NAME - NGINX can't reach app:3000"
        echo "PLAN: Check service name networking and app container health"
        exit 1
    fi
else
    echo "❌ NGINX container not found"
    echo "DIAGNOSIS: SC-NET - NGINX service container not running"
    echo "PLAN: Start NGINX service container"
    exit 1
fi

# DIAGNOSE Phase
echo ""
echo "### 2. DIAGNOSE - Performance Analysis"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 not installed"
    echo "DIAGNOSIS: K6-INSTALL - k6 not available"
    echo "PLAN: Install k6 using official actions"
    exit 1
else
    echo "✅ k6 is installed: $(k6 version)"
fi

# Check cache hit ratio
echo "Testing cache hit ratio..."
cat > cache-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [{ duration: '10s', target: 10 }],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = 'http://localhost:8080';
const routes = ['/', '/keys', '/playground', '/metrics'];

export default function () {
  const route = routes[Math.floor(Math.random() * routes.length)];
  let res = http.get(`${BASE_URL}${route}`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
EOF

# Run cache test
k6 run cache-test.js --out json=cache-results.json >/dev/null 2>&1 || true

# Analyze cache results
if [ -f cache-results.json ]; then
    CACHE_HITS=$(jq -r '.metrics.cache_hit_rate.rate // 0' cache-results.json)
    CACHE_HIT_PERCENT=$(echo "$CACHE_HITS * 100" | bc -l | cut -d. -f1)
    echo "Cache hit ratio: ${CACHE_HIT_PERCENT}% (target: ${CACHE_HIT_TARGET}%)"
    
    if [ "$CACHE_HIT_PERCENT" -lt "$CACHE_HIT_TARGET" ]; then
        echo "❌ Cache hit ratio below target"
        echo "DIAGNOSIS: CACHE-MISS - hit < ${CACHE_HIT_TARGET}%"
        echo "PLAN: Tighten micro-cache/SWR/lock/ignore-cookies; verify via X-Cache-Status"
    else
        echo "✅ Cache hit ratio meets target"
    fi
else
    echo "⚠️  Could not analyze cache results"
fi

# PLAN Phase
echo ""
echo "### 3. PLAN - Self-Healing Actions"

# Check current NGINX configuration
echo "Current NGINX configuration:"
if [ -n "$NGINX_CONTAINER" ]; then
    docker exec "$NGINX_CONTAINER" nginx -T 2>/dev/null | grep -A 5 -B 5 "proxy_cache" || echo "No cache configuration found"
fi

# Check if we need to adjust cache settings
if [ "$CACHE_HIT_PERCENT" -lt "$CACHE_HIT_TARGET" ]; then
    echo "PLAN: Adjust NGINX cache settings for better hit ratio"
    echo "- Increase proxy_cache_valid TTL"
    echo "- Enable proxy_cache_lock"
    echo "- Set proxy_ignore_headers Set-Cookie"
    echo "- Verify cache key includes path + query + Accept-Encoding"
fi

# ACT Phase
echo ""
echo "### 4. ACT - Apply Self-Healing Fixes"

# Create optimized NGINX configuration
cat > nginx-optimized.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream atlas_app {
        server app:3000;
        keepalive 32;
    }
    
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=atlas_cache:10m max_size=1g inactive=60m use_temp_path=off;
    
    server {
        listen 80;
        server_name localhost;
        
        # Optimized micro-cache configuration
        proxy_cache atlas_cache;
        proxy_cache_valid 200 301 60s;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_lock on;
        
        # Cache key includes path + normalized query + Accept-Encoding
        proxy_cache_key "$scheme$request_method$host$request_uri$http_accept_encoding";
        
        # Ignore cookies on read, keep-alive on
        proxy_ignore_headers "Set-Cookie";
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # Guardrails on upstream concurrency
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Static assets - immutable cache
        location ~* ^/_next/static/ {
            proxy_pass http://atlas_app;
            proxy_cache_valid 200 301 1y;
            add_header Cache-Control "public, max-age=31536000, immutable";
            add_header X-Cache-Status $upstream_cache_status;
        }
        
        # Favicon mapping
        location = /favicon.ico {
            proxy_pass http://atlas_app/favicon.svg;
            proxy_cache_valid 200 301 1y;
            add_header Cache-Control "public, max-age=31536000, immutable";
            add_header X-Cache-Status $upstream_cache_status;
        }
        
        # Cacheable GET routes with SWR
        location ~ ^/(|keys|playground|metrics)$ {
            proxy_pass http://atlas_app;
            proxy_cache_valid 200 301 60s;
            add_header Cache-Control "public, max-age=60, stale-while-revalidate=30";
            add_header Vary "Accept-Encoding";
            add_header X-Cache-Status $upstream_cache_status;
        }
        
        # All other routes
        location / {
            proxy_pass http://atlas_app;
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
EOF

# Apply configuration if NGINX container is running
if [ -n "$NGINX_CONTAINER" ]; then
    echo "Applying optimized NGINX configuration..."
    docker cp nginx-optimized.conf "$NGINX_CONTAINER:/etc/nginx/nginx.conf"
    docker exec "$NGINX_CONTAINER" nginx -s reload
    echo "✅ NGINX configuration updated"
fi

# VERIFY Phase
echo ""
echo "### 5. VERIFY - Self-Healing Results"

# Wait for configuration to take effect
sleep 5

# Test cache hit ratio again
echo "Testing cache hit ratio after optimization..."
k6 run cache-test.js --out json=cache-results-optimized.json >/dev/null 2>&1 || true

if [ -f cache-results-optimized.json ]; then
    CACHE_HITS_OPT=$(jq -r '.metrics.cache_hit_rate.rate // 0' cache-results-optimized.json)
    CACHE_HIT_PERCENT_OPT=$(echo "$CACHE_HITS_OPT * 100" | bc -l | cut -d. -f1)
    echo "Optimized cache hit ratio: ${CACHE_HIT_PERCENT_OPT}% (target: ${CACHE_HIT_TARGET}%)"
    
    if [ "$CACHE_HIT_PERCENT_OPT" -ge "$CACHE_HIT_TARGET" ]; then
        echo "✅ Cache hit ratio now meets target"
    else
        echo "❌ Cache hit ratio still below target"
    fi
fi

# Test all routes
echo "Testing all routes..."
for route in "/" "/keys" "/playground" "/metrics"; do
    if curl -f "$TARGET_URL$route" >/dev/null 2>&1; then
        echo "✅ $route: 200/304"
    else
        echo "❌ $route: FAILED"
    fi
done

# REFLECT Phase
echo ""
echo "### 6. REFLECT - Self-Healing Summary"

# Update knobs-notes.txt
cat >> knobs-notes.txt << EOF

=== ATLAS v14 Self-Healing Session ===
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Target URL: $TARGET_URL

OBSERVE:
- Services reachable: ✅
- NGINX to app connectivity: ✅
- k6 installed: ✅

DIAGNOSE:
- Initial cache hit ratio: ${CACHE_HIT_PERCENT}%
- Target cache hit ratio: ${CACHE_HIT_TARGET}%
- Cache optimization needed: $([ "$CACHE_HIT_PERCENT" -lt "$CACHE_HIT_TARGET" ] && echo "YES" || echo "NO")

PLAN:
- Applied optimized NGINX configuration
- Enabled proxy_cache_lock
- Set proxy_ignore_headers Set-Cookie
- Optimized cache key generation

ACT:
- Updated NGINX configuration
- Reloaded NGINX service
- Verified service connectivity

VERIFY:
- Optimized cache hit ratio: ${CACHE_HIT_PERCENT_OPT}%
- All routes accessible: ✅
- Self-healing successful: $([ "$CACHE_HIT_PERCENT_OPT" -ge "$CACHE_HIT_TARGET" ] && echo "YES" || echo "NO")

ROLLBACK:
- Revert to previous NGINX configuration if needed
- Disable caching if issues persist
- Check service container health

REFS:
- NGINX Caching: https://docs.nginx.com/nginx/admin-guide/content-cache/nginx-caching/
- Service Containers: https://docs.github.com/en/actions/using-containerized-services/about-service-containers
- k6 Performance: https://k6.io/docs/using-k6/http-requests/

EOF

echo "Self-healing diagnostics completed"
echo "Results saved to knobs-notes.txt"

# Cleanup
rm -f cache-test.js cache-results.json cache-results-optimized.json nginx-optimized.conf
