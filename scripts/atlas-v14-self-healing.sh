#!/bin/bash
# ATLAS v14 Self-Healing Loop Implementation
# OBSERVE → DIAGNOSE → PLAN → ACT → VERIFY → REFLECT

set -euo pipefail

# Configuration
TARGET_URL=${TARGET_URL:-"https://atlas-nginx-uc.a.run.app"}
PROJECT_ID=${PROJECT_ID:-"atlas-v14-project"}
REGION=${REGION:-"us-central1"}

echo "🔄 ATLAS v14 Self-Healing Loop"
echo "Target URL: $TARGET_URL"
echo ""

# OBSERVE Phase
echo "🔍 OBSERVE: Checking system state..."

# Check if target URL is reachable
if curl -f "$TARGET_URL" >/dev/null 2>&1; then
  echo "✅ Target URL is reachable"
  NET_REACH="OK"
else
  echo "❌ Target URL is not reachable"
  NET_REACH="FAIL"
fi

# Check Cloud Run services
echo "🔍 Checking Cloud Run services..."
APP_STATUS=$(gcloud run services describe atlas-app --region=$REGION --format="value(status.conditions[0].status)" 2>/dev/null || echo "UNKNOWN")
NGINX_STATUS=$(gcloud run services describe atlas-nginx --region=$REGION --format="value(status.conditions[0].status)" 2>/dev/null || echo "UNKNOWN")

echo "App service status: $APP_STATUS"
echo "NGINX service status: $NGINX_STATUS"

# Check cache hit ratio
echo "🔍 Checking cache hit ratio..."
CACHE_HITS=0
TOTAL_REQUESTS=0

for i in {1..10}; do
  RESPONSE=$(curl -s -I "$TARGET_URL" | grep -i "x-cache-status" || echo "")
  if [[ "$RESPONSE" == *"HIT"* ]]; then
    ((CACHE_HITS++))
  fi
  ((TOTAL_REQUESTS++))
  sleep 1
done

CACHE_HIT_RATIO=$((CACHE_HITS * 100 / TOTAL_REQUESTS))
echo "Cache hit ratio: $CACHE_HIT_RATIO% (target: ≥98%)"

# DIAGNOSE Phase
echo ""
echo "🔍 DIAGNOSE: Analyzing issues..."

if [[ "$NET_REACH" == "FAIL" ]]; then
  echo "DIAGNOSIS: NET-REACH - Target URL not reachable"
  DIAGNOSIS="NET-REACH"
elif [[ "$APP_STATUS" != "True" ]]; then
  echo "DIAGNOSIS: EDGE-CONFIG - App service not ready"
  DIAGNOSIS="EDGE-CONFIG"
elif [[ "$NGINX_STATUS" != "True" ]]; then
  echo "DIAGNOSIS: EDGE-CONFIG - NGINX service not ready"
  DIAGNOSIS="EDGE-CONFIG"
elif [[ "$CACHE_HIT_RATIO" -lt 98 ]]; then
  echo "DIAGNOSIS: CACHE-MISS - Cache hit ratio below target"
  DIAGNOSIS="CACHE-MISS"
else
  echo "DIAGNOSIS: All systems operational"
  DIAGNOSIS="OK"
fi

# PLAN Phase
echo ""
echo "🔍 PLAN: Determining fix strategy..."

case $DIAGNOSIS in
  "NET-REACH")
    echo "PLAN: Check Cloud Run service URLs and network connectivity"
    FIX="check-urls"
    ;;
  "EDGE-CONFIG")
    echo "PLAN: Redeploy Cloud Run services with proper configuration"
    FIX="redeploy-services"
    ;;
  "CACHE-MISS")
    echo "PLAN: Optimize NGINX cache configuration and prime cache"
    FIX="optimize-cache"
    ;;
  "OK")
    echo "PLAN: No fixes needed, proceeding with tests"
    FIX="none"
    ;;
esac

# ACT Phase
echo ""
echo "🔍 ACT: Applying fix..."

case $FIX in
  "check-urls")
    echo "Checking service URLs..."
    gcloud run services list --region=$REGION
    ;;
  "redeploy-services")
    echo "Redeploying services..."
    gcloud builds submit --config cloudbuild.yaml .
    ;;
  "optimize-cache")
    echo "Optimizing cache configuration..."
    # Update NGINX config with better cache settings
    sed -i 's/proxy_cache_valid 200 301 60s/proxy_cache_valid 200 301 120s/' nginx-cloudrun.conf
    gcloud builds submit --config cloudbuild.yaml .
    ;;
  "none")
    echo "No action needed"
    ;;
esac

# VERIFY Phase
echo ""
echo "🔍 VERIFY: Checking fix effectiveness..."

if [[ "$FIX" != "none" ]]; then
  echo "Waiting for services to stabilize..."
  sleep 30
  
  # Re-check target URL
  if curl -f "$TARGET_URL" >/dev/null 2>&1; then
    echo "✅ Target URL is now reachable"
  else
    echo "❌ Target URL still not reachable"
  fi
  
  # Re-check cache hit ratio
  CACHE_HITS=0
  TOTAL_REQUESTS=0
  
  for i in {1..10}; do
    RESPONSE=$(curl -s -I "$TARGET_URL" | grep -i "x-cache-status" || echo "")
    if [[ "$RESPONSE" == *"HIT"* ]]; then
      ((CACHE_HITS++))
    fi
    ((TOTAL_REQUESTS++))
    sleep 1
  done
  
  CACHE_HIT_RATIO=$((CACHE_HITS * 100 / TOTAL_REQUESTS))
  echo "Cache hit ratio after fix: $CACHE_HIT_RATIO%"
fi

# REFLECT Phase
echo ""
echo "🔍 REFLECT: Recording results..."

cat >> knobs-notes.txt << EOF

=== ATLAS v14 Self-Healing Session ===
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Target URL: $TARGET_URL

OBSERVE:
- Target URL reachable: $NET_REACH
- App service status: $APP_STATUS
- NGINX service status: $NGINX_STATUS
- Cache hit ratio: $CACHE_HIT_RATIO%

DIAGNOSE:
- Issue category: $DIAGNOSIS
- Root cause: $(case $DIAGNOSIS in
  "NET-REACH") echo "Network connectivity or service URL issue" ;;
  "EDGE-CONFIG") echo "Cloud Run service configuration issue" ;;
  "CACHE-MISS") echo "NGINX cache configuration or priming issue" ;;
  "OK") echo "No issues detected" ;;
esac)

PLAN:
- Fix strategy: $FIX
- Justification: $(case $FIX in
  "check-urls") echo "Verify service URLs and network connectivity" ;;
  "redeploy-services") echo "Redeploy with proper configuration" ;;
  "optimize-cache") echo "Optimize NGINX cache settings" ;;
  "none") echo "No fixes needed" ;;
esac)

ACT:
- Action taken: $FIX
- Implementation: $(case $FIX in
  "check-urls") echo "Checked gcloud run services list" ;;
  "redeploy-services") echo "Ran gcloud builds submit" ;;
  "optimize-cache") echo "Updated NGINX config and redeployed" ;;
  "none") echo "No action taken" ;;
esac)

VERIFY:
- Target URL reachable after fix: $(curl -f "$TARGET_URL" >/dev/null 2>&1 && echo "YES" || echo "NO")
- Cache hit ratio after fix: $CACHE_HIT_RATIO%
- Services ready: $(gcloud run services describe atlas-app --region=$REGION --format="value(status.conditions[0].status)" 2>/dev/null || echo "UNKNOWN")

REFLECT:
- Self-healing successful: $(if [[ "$DIAGNOSIS" == "OK" ]] || [[ "$CACHE_HIT_RATIO" -ge 98 ]]; then echo "YES"; else echo "NO"; fi)
- Key success factors: Cloud Run service stability, NGINX cache optimization
- Areas for improvement: Cache priming strategy, service health monitoring
EOF

echo "✅ Self-healing loop completed!"
echo "Results recorded in knobs-notes.txt"
