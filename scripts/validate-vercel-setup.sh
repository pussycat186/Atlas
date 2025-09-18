#!/bin/bash

# Validate Vercel project setup and mappings
echo "🔍 Validating Vercel project setup..."

# Function to get project details from Vercel API
get_project_details() {
  local project_id="$1"
  local org_id="$2"
  local token="$3"
  
  echo "Checking project $project_id..."
  response=$(curl -s -H "Authorization: Bearer $token" \
    "https://api.vercel.com/v9/projects/$project_id?teamId=$org_id")
  
  if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch project $project_id"
    return 1
  fi
  
  # Check if project exists
  if echo "$response" | jq -e '.error' > /dev/null; then
    echo "❌ Project $project_id not found or access denied"
    return 1
  fi
  
  # Extract project details
  name=$(echo "$response" | jq -r '.name')
  root_dir=$(echo "$response" | jq -r '.rootDirectory // "apps/web"')
  protection=$(echo "$response" | jq -r '.protection // {}')
  
  echo "Project: $name"
  echo "Root Directory: $root_dir"
  echo "Protection: $protection"
  
  echo "$root_dir"
}

# Check if required secrets are present
echo "🔑 Checking required secrets..."
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN not set"
  exit 1
fi

if [ -z "$VERCEL_ORG_ID" ]; then
  echo "❌ VERCEL_ORG_ID not set"
  exit 1
fi

if [ -z "$FLY_API_TOKEN" ]; then
  echo "❌ FLY_API_TOKEN not set"
  exit 1
fi

echo "✅ All required secrets are present"

# Validate proof-messenger project
if [ -n "$VERCEL_PROJECT_ID_PROOF" ]; then
  echo ""
  echo "📱 Validating proof-messenger project..."
  proof_root=$(get_project_details "$VERCEL_PROJECT_ID_PROOF" "$VERCEL_ORG_ID" "$VERCEL_TOKEN")
  if [ "$proof_root" = "apps/proof-messenger" ]; then
    echo "✅ proof-messenger project mapping is correct"
  else
    echo "❌ BLOCKER_MISROUTED_PROJECT:proof-messenger expected=apps/proof-messenger actual=$proof_root"
    exit 1
  fi
else
  echo "❌ VERCEL_PROJECT_ID_PROOF not configured"
  exit 1
fi

# Validate admin-insights project
if [ -n "$VERCEL_PROJECT_ID_INSIGHTS" ]; then
  echo ""
  echo "📊 Validating admin-insights project..."
  insights_root=$(get_project_details "$VERCEL_PROJECT_ID_INSIGHTS" "$VERCEL_ORG_ID" "$VERCEL_TOKEN")
  if [ "$insights_root" = "apps/admin-insights" ]; then
    echo "✅ admin-insights project mapping is correct"
  else
    echo "❌ BLOCKER_MISROUTED_PROJECT:admin-insights expected=apps/admin-insights actual=$insights_root"
    exit 1
  fi
else
  echo "❌ VERCEL_PROJECT_ID_INSIGHTS not configured"
  exit 1
fi

# Validate dev-portal project (optional)
if [ -n "$VERCEL_PROJECT_ID_DEVPORTAL" ]; then
  echo ""
  echo "🛠️ Validating dev-portal project..."
  devportal_root=$(get_project_details "$VERCEL_PROJECT_ID_DEVPORTAL" "$VERCEL_ORG_ID" "$VERCEL_TOKEN")
  if [ "$devportal_root" = "apps/dev-portal" ]; then
    echo "✅ dev-portal project mapping is correct"
  else
    echo "❌ BLOCKER_MISROUTED_PROJECT:dev-portal expected=apps/dev-portal actual=$devportal_root"
    exit 1
  fi
else
  echo "ℹ️ VERCEL_PROJECT_ID_DEVPORTAL not configured (optional)"
fi

echo ""
echo "✅ All Vercel project mappings are correct!"
echo "🎯 Ready to proceed with deployment"
