#!/bin/bash
set -euo pipefail

# Atlas GCP Cloud Run Custom Domain Mapping
# Maps custom domains to Cloud Run services via Global HTTPS Load Balancer
# Requires: GCP_PROJECT_ID, GCP_REGION, DOMAINS_JSON env vars

echo "🌐 Atlas GCP Cloud Run Custom Domain Mapping"
echo "=============================================="

# Validate required environment variables
: "${GCP_PROJECT_ID:?ERROR: GCP_PROJECT_ID not set}"
: "${GCP_REGION:?ERROR: GCP_REGION not set}"
: "${DOMAINS_JSON:?ERROR: DOMAINS_JSON not set (format: {\"proof-messenger\":\"proof.example.com\",...})}"

PROJECT_ID="$GCP_PROJECT_ID"
REGION="$GCP_REGION"

echo "📋 Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo ""

# Parse DOMAINS_JSON (requires jq)
if ! command -v jq &>/dev/null; then
  echo "❌ ERROR: jq is required but not installed"
  exit 1
fi

# Example DOMAINS_JSON: {"proof-messenger":"proof.atlas.com","admin-insights":"admin.atlas.com","dev-portal":"dev.atlas.com"}
echo "🔍 Parsing domain mappings..."
echo "$DOMAINS_JSON" | jq -r 'to_entries[] | "\(.key)=\(.value)"' | while IFS='=' read -r app domain; do
  SERVICE_NAME="atlas-$app"
  
  echo ""
  echo "🌍 Mapping $domain → $SERVICE_NAME..."
  
  # Create managed certificate (idempotent - fails gracefully if exists)
  CERT_NAME="${app//-/}-cert"
  echo "📜 Creating managed SSL certificate: $CERT_NAME..."
  
  if gcloud compute ssl-certificates describe "$CERT_NAME" \
    --project="$PROJECT_ID" \
    --global &>/dev/null; then
    echo "✅ Certificate '$CERT_NAME' already exists"
  else
    gcloud compute ssl-certificates create "$CERT_NAME" \
      --domains="$domain" \
      --global \
      --project="$PROJECT_ID" \
      --quiet
    echo "✅ Certificate '$CERT_NAME' created (provisioning may take 10-15 min)"
  fi
  
  # Map domain to Cloud Run service
  echo "🔗 Mapping domain to Cloud Run service..."
  gcloud run domain-mappings create \
    --service="$SERVICE_NAME" \
    --domain="$domain" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null || echo "⚠️  Domain mapping may already exist"
  
  # Get DNS record to configure
  DNS_RECORD=$(gcloud run domain-mappings describe "$domain" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.resourceRecords[0].rrdata)" 2>/dev/null || echo "")
  
  if [ -n "$DNS_RECORD" ]; then
    echo "✅ Domain mapping created"
    echo "📋 DNS Configuration required:"
    echo "    Domain: $domain"
    echo "    Type: CNAME"
    echo "    Value: $DNS_RECORD"
  else
    echo "⚠️  Could not retrieve DNS record - check manually"
  fi
done

echo ""
echo "✅ Domain mapping complete!"
echo ""
echo "⏳ Note: SSL certificate provisioning takes 10-15 minutes after DNS propagation"
echo "🔍 Check status: gcloud compute ssl-certificates list --project=$PROJECT_ID"
echo ""
echo "🚨 IMPORTANT: Update your DNS provider with the CNAME records shown above"
