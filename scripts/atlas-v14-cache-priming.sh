#!/bin/bash
# ATLAS v14 Cache Priming Script
# Drives cache until X-Cache-Status HIT yields cache_hit_ratio ≥ 98%

set -euo pipefail

# Configuration
TARGET_URL=${TARGET_URL:-"https://atlas-nginx-uc.a.run.app"}
CACHE_HIT_TARGET=${CACHE_HIT_TARGET:-98}

echo "🔥 ATLAS v14 Cache Priming"
echo "Target URL: $TARGET_URL"
echo "Target cache hit ratio: ${CACHE_HIT_TARGET}%"
echo ""

# Routes to prime (90% dynamic, 10% static)
ROUTES=("/" "/keys" "/playground" "/metrics" "/favicon.ico")

# Prime cache with multiple rounds
echo "🔍 Priming cache with multiple rounds..."
CACHE_HITS=0
TOTAL_REQUESTS=0
ROUND=1

while true; do
  echo "Round $ROUND: Priming cache..."
  
  # Make requests to all routes
  for route in "${ROUTES[@]}"; do
    for i in {1..10}; do
      RESPONSE=$(curl -s -I "$TARGET_URL$route" | grep -i "x-cache-status" || echo "")
      if [[ "$RESPONSE" == *"HIT"* ]]; then
        ((CACHE_HITS++))
      fi
      ((TOTAL_REQUESTS++))
    done
  done
  
  # Calculate cache hit ratio
  CACHE_HIT_RATIO=$((CACHE_HITS * 100 / TOTAL_REQUESTS))
  echo "Cache hit ratio after round $ROUND: $CACHE_HIT_RATIO%"
  
  # Check if target is reached
  if [[ "$CACHE_HIT_RATIO" -ge "$CACHE_HIT_TARGET" ]]; then
    echo "✅ Target cache hit ratio reached: $CACHE_HIT_RATIO%"
    break
  fi
  
  # Check if we've done too many rounds
  if [[ "$ROUND" -gt 10 ]]; then
    echo "⚠️ Maximum rounds reached, proceeding with current ratio: $CACHE_HIT_RATIO%"
    break
  fi
  
  ((ROUND++))
  sleep 2
done

# Final verification
echo ""
echo "🔍 Final cache hit ratio verification..."
CACHE_HITS=0
TOTAL_REQUESTS=0

for i in {1..20}; do
  ROUTE=${ROUTES[$((i % ${#ROUTES[@]}))]}
  RESPONSE=$(curl -s -I "$TARGET_URL$ROUTE" | grep -i "x-cache-status" || echo "")
  if [[ "$RESPONSE" == *"HIT"* ]]; then
    ((CACHE_HITS++))
  fi
  ((TOTAL_REQUESTS++))
done

FINAL_CACHE_HIT_RATIO=$((CACHE_HITS * 100 / TOTAL_REQUESTS))
echo "Final cache hit ratio: $FINAL_CACHE_HIT_RATIO%"

# Show cache status for each route
echo ""
echo "🔍 Cache status by route:"
for route in "${ROUTES[@]}"; do
  RESPONSE=$(curl -s -I "$TARGET_URL$route" | grep -i "x-cache-status" || echo "MISS")
  echo "$route: $RESPONSE"
done

# Record results
cat >> knobs-notes.txt << EOF

=== Cache Priming Session ===
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Target URL: $TARGET_URL
Target cache hit ratio: ${CACHE_HIT_TARGET}%

Priming Results:
- Rounds completed: $ROUND
- Total requests: $TOTAL_REQUESTS
- Cache hits: $CACHE_HITS
- Final cache hit ratio: $FINAL_CACHE_HIT_RATIO%
- Target reached: $(if [[ "$FINAL_CACHE_HIT_RATIO" -ge "$CACHE_HIT_TARGET" ]]; then echo "YES"; else echo "NO"; fi)

Route Cache Status:
$(for route in "${ROUTES[@]}"; do
  RESPONSE=$(curl -s -I "$TARGET_URL$route" | grep -i "x-cache-status" || echo "MISS")
  echo "- $route: $RESPONSE"
done)
EOF

echo ""
echo "✅ Cache priming completed!"
echo "Final cache hit ratio: $FINAL_CACHE_HIT_RATIO%"
echo "Ready for performance testing!"
