$resp = Invoke-WebRequest -Uri "https://atlas-proof-messenger.vercel.app/" -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache' }
Write-Host "Size: $($resp.Content.Length) bytes"
Write-Host "Nhắn tin: $(if($resp.Content -match 'Nhắn tin'){'\u2705 FOUND'}else{'\u274c NOT FOUND'})"
Write-Host "Passkey: $(if($resp.Content -match 'Passkey'){'\u2705 FOUND'}else{'\u274c NOT FOUND'})"
Write-Host "Xác minh: $(if($resp.Content -match 'Xác minh'){'\u2705 FOUND'}else{'\u274c NOT FOUND'})"
if($resp.Content -match 'Nhắn tin') { exit 0 } else { exit 1 }
