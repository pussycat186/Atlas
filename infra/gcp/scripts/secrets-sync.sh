#!/bin/bash
set -euo pipefail

# Atlas Secret Manager Sync Script
# Syncs environment variables from JSON templates to GCP Secret Manager
# Requires: GCP_PROJECT_ID, jq

echo "🔐 Atlas Secret Manager Sync"
echo "============================="

# Validate required environment variables
: "${GCP_PROJECT_ID:?ERROR: GCP_PROJECT_ID not set}"

PROJECT_ID="$GCP_PROJECT_ID"
SECRETS_DIR="$(dirname "$0")/../secrets"

echo "📋 Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Secrets directory: $SECRETS_DIR"
echo ""

# Check for jq
if ! command -v jq &>/dev/null; then
  echo "❌ ERROR: jq is required but not installed"
  exit 1
fi

# Process each template
for template in "$SECRETS_DIR"/*.env.template.json; do
  if [ ! -f "$template" ]; then
    echo "⚠️  No secret templates found in $SECRETS_DIR"
    exit 0
  fi
  
  SERVICE=$(jq -r '.service' "$template")
  echo "📦 Processing secrets for: $SERVICE"
  
  # Extract secrets from template
  jq -c '.secrets[]' "$template" | while read -r secret; do
    NAME=$(echo "$secret" | jq -r '.name')
    VALUE=$(echo "$secret" | jq -r '.value')
    REQUIRED=$(echo "$secret" | jq -r '.required')
    DESCRIPTION=$(echo "$secret" | jq -r '.description')
    
    # Skip placeholders (not replaced yet)
    if [[ "$VALUE" == *"<REPLACE_WITH_"* ]]; then
      echo "  ⚠️  $NAME: Placeholder value - skipping (replace in template first)"
      continue
    fi
    
    SECRET_NAME="${SERVICE//-/_}_${NAME}"
    
    # Create secret if it doesn't exist
    if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
      echo "  ✅ $NAME: Secret '$SECRET_NAME' already exists"
    else
      echo "  🔐 $NAME: Creating secret '$SECRET_NAME'..."
      echo -n "$VALUE" | gcloud secrets create "$SECRET_NAME" \
        --data-file=- \
        --replication-policy=automatic \
        --project="$PROJECT_ID" \
        --quiet
      echo "  ✅ $NAME: Secret '$SECRET_NAME' created"
    fi
  done
  
  echo ""
done

echo "✅ Secret Manager sync complete!"
echo ""
echo "📋 To mount secrets in Cloud Run, update deploy-cloudrun.yml with:"
echo "   gcloud run deploy <service> \\"
echo "     --set-secrets=VAR_NAME=SECRET_NAME:latest"
