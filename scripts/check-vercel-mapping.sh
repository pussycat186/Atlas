#!/bin/bash

# Check Vercel project mappings
echo "Checking Vercel project mappings..."

# Function to get project root directory from Vercel API
get_project_root() {
  local project_id="$1"
  local org_id="$2"
  local token="$3"
  
  echo "Checking project $project_id..."
  response=$(curl -s -H "Authorization: Bearer $token" \
    "https://api.vercel.com/v9/projects/$project_id?teamId=$org_id")
  
  if [ $? -ne 0 ]; then
    echo "Failed to fetch project $project_id"
    return 1
  fi
  
  root_dir=$(echo "$response" | jq -r '.rootDirectory // "apps/web"')
  echo "Project $project_id root directory: $root_dir"
  echo "$root_dir"
}

# Check proof-messenger project
if [ -n "$VERCEL_PROJECT_ID_PROOF" ]; then
  proof_root=$(get_project_root "$VERCEL_PROJECT_ID_PROOF" "$VERCEL_ORG_ID" "$VERCEL_TOKEN")
  if [ "$proof_root" = "apps/proof-messenger" ]; then
    echo "✓ proof-messenger project mapping is correct"
    echo "PROOF_MESSENGER_VALID=true"
  else
    echo "✗ proof-messenger project mapping is incorrect: expected=apps/proof-messenger actual=$proof_root"
    echo "BLOCKER_MISROUTED_PROJECT:proof-messenger expected=apps/proof-messenger actual=$proof_root"
    echo "PROOF_MESSENGER_VALID=false"
  fi
  echo "PROOF_MESSENGER_ROOT=$proof_root"
else
  echo "✗ VERCEL_PROJECT_ID_PROOF not configured"
  echo "PROOF_MESSENGER_VALID=false"
  echo "PROOF_MESSENGER_ROOT=not_configured"
fi

# Check admin-insights project
if [ -n "$VERCEL_PROJECT_ID_INSIGHTS" ]; then
  insights_root=$(get_project_root "$VERCEL_PROJECT_ID_INSIGHTS" "$VERCEL_ORG_ID" "$VERCEL_TOKEN")
  if [ "$insights_root" = "apps/admin-insights" ]; then
    echo "✓ admin-insights project mapping is correct"
    echo "ADMIN_INSIGHTS_VALID=true"
  else
    echo "✗ admin-insights project mapping is incorrect: expected=apps/admin-insights actual=$insights_root"
    echo "BLOCKER_MISROUTED_PROJECT:admin-insights expected=apps/admin-insights actual=$insights_root"
    echo "ADMIN_INSIGHTS_VALID=false"
  fi
  echo "ADMIN_INSIGHTS_ROOT=$insights_root"
else
  echo "✗ VERCEL_PROJECT_ID_INSIGHTS not configured"
  echo "ADMIN_INSIGHTS_VALID=false"
  echo "ADMIN_INSIGHTS_ROOT=not_configured"
fi

# Check dev-portal project (optional)
if [ -n "$VERCEL_PROJECT_ID_DEVPORTAL" ]; then
  devportal_root=$(get_project_root "$VERCEL_PROJECT_ID_DEVPORTAL" "$VERCEL_ORG_ID" "$VERCEL_TOKEN")
  if [ "$devportal_root" = "apps/dev-portal" ]; then
    echo "✓ dev-portal project mapping is correct"
    echo "DEV_PORTAL_VALID=true"
  else
    echo "✗ dev-portal project mapping is incorrect: expected=apps/dev-portal actual=$devportal_root"
    echo "BLOCKER_MISROUTED_PROJECT:dev-portal expected=apps/dev-portal actual=$devportal_root"
    echo "DEV_PORTAL_VALID=false"
  fi
  echo "DEV_PORTAL_ROOT=$devportal_root"
else
  echo "ℹ VERCEL_PROJECT_ID_DEVPORTAL not configured (optional)"
  echo "DEV_PORTAL_VALID=false"
  echo "DEV_PORTAL_ROOT=not_configured"
fi

# Check if any required projects are misconfigured
if [ "$PROOF_MESSENGER_VALID" = "false" ] || [ "$ADMIN_INSIGHTS_VALID" = "false" ]; then
  echo "❌ Required Vercel projects are misconfigured. Please fix the project root directories in Vercel dashboard."
  exit 1
fi

echo "✅ All required Vercel project mappings are correct!"
