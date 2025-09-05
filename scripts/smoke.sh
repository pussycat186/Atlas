#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:8080}"
retries=60
until curl -fsS "$BASE/health" >/dev/null; do
  ((retries--)) || { echo "Gateway not ready"; exit 1; }
  sleep 2
done
RID="demo-$(date +%s)"
echo "[*] Send record $RID"
curl -fsS -X POST "$BASE/record" -H 'content-type: application/json' \
  -d "{\"app\":\"chat\",\"record_id\":\"$RID\",\"payload\":\"hello\",\"meta\":{\"room_id\":\"r1\"}}" | sed -n '1,40p'
echo "[*] Verify"; curl -fsS "$BASE/verify/$RID" | sed -n '1,120p'