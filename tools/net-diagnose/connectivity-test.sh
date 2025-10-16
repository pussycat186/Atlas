#!/bin/bash
# Network connectivity diagnostics for CI environments
set -euo pipefail

echo "🌐 Atlas Network Diagnostics"
echo "Timestamp: $(date -u)"
echo "Environment: ${GITHUB_ACTIONS:-local}"
echo "Runner: ${RUNNER_OS:-unknown}"

# Test endpoints critical for Atlas
endpoints=(
    "https://github.com"
    "https://api.github.com" 
    "https://registry.npmjs.org"
    "https://vercel.com"
    "https://api.vercel.com"
    "https://fonts.googleapis.com"
    "https://fonts.gstatic.com"
    "https://cdnjs.cloudflare.com"
    "https://unpkg.com"
)

echo ""
echo "📡 Testing endpoint reachability..."

failed_endpoints=()
for endpoint in "${endpoints[@]}"; do
    echo -n "Testing $endpoint ... "
    
    if curl -s --max-time 10 --head "$endpoint" > /dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
        failed_endpoints+=("$endpoint")
    fi
done

echo ""
echo "🔍 DNS Resolution Test..."
domains=("github.com" "vercel.com" "npmjs.org" "googleapis.com")

for domain in "${domains[@]}"; do
    echo "Resolving $domain:"
    nslookup "$domain" | grep -E "Address|Non-authoritative" || echo "❌ Failed to resolve"
done

echo ""
echo "⚡ Connection Speed Test..."
echo "Testing download speed to npmjs.org..."
if command -v wget >/dev/null 2>&1; then
    wget --spider --server-response https://registry.npmjs.org/react/latest 2>&1 | grep -E "HTTP|Content-Length" || true
elif command -v curl >/dev/null 2>&1; then
    curl -w "@/dev/stdin" -o /dev/null -s https://registry.npmjs.org/react/latest <<< "
Time: %{time_total}s
Size: %{size_download} bytes  
Speed: %{speed_download} bytes/sec
" || true
fi

echo ""
echo "📊 Summary:"
if [ ${#failed_endpoints[@]} -eq 0 ]; then
    echo "✅ All endpoints reachable - network connectivity OK"
    exit 0
else
    echo "❌ Failed endpoints: ${failed_endpoints[*]}"
    echo "⚠️  Network connectivity issues detected"
    exit 1
fi