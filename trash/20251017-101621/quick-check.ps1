#!/usr/bin/env pwsh
$resp = Invoke-WebRequest -Uri "https://atlas-proof-messenger.vercel.app/" -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
$found = $resp.Content -match 'Nhắn tin'
Write-Output "Size: $($resp.Content.Length)"
Write-Output "Vietnamese: $found"
if ($found) { exit 0 } else { exit 1 }
