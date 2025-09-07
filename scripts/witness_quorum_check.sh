#!/usr/bin/env bash
set -euo pipefail
W=(3001 3002 3003 3004 3005)
UP=0
for p in "${W[@]}"; do c=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$p/witness/health || true); echo "$p => $c"; [[ "$c" == "200" ]] && ((UP++)); done
(( UP >= 4 )) && { echo "Quorum OK ($UP/5)"; exit 0; } || { echo "Quorum FAIL ($UP/5)"; exit 1; }
