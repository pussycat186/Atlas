#!/bin/bash
set -euo pipefail

# Atlas GCP Cloud Run Infrastructure Bootstrap
# Idempotent script to provision Artifact Registry + Cloud Run services
# Requires: GCP_PROJECT_ID, GCP_REGION, ARTIFACT_REPO env vars

echo "🚀 Atlas GCP Cloud Run Bootstrap"
echo "=================================="

# Validate required environment variables
: "${GCP_PROJECT_ID:?ERROR: GCP_PROJECT_ID not set}"
: "${GCP_REGION:?ERROR: GCP_REGION not set}"
: "${ARTIFACT_REPO:?ERROR: ARTIFACT_REPO not set}"

PROJECT_ID="$GCP_PROJECT_ID"
REGION="$GCP_REGION"
REPO="$ARTIFACT_REPO"

echo "📋 Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Artifact Registry: $REPO"
echo ""

# Enable required GCP APIs (idempotent)
echo "🔌 Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  secretmanager.googleapis.com \
  certificatemanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet

echo "✅ APIs enabled"

# Create Artifact Registry repository (idempotent - fails gracefully if exists)
echo "📦 Creating Artifact Registry repository..."
if gcloud artifacts repositories describe "$REPO" \
  --location="$REGION" \
  --project="$PROJECT_ID" &>/dev/null; then
  echo "✅ Artifact Registry repository '$REPO' already exists"
else
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Atlas monorepo container images" \
    --project="$PROJECT_ID" \
    --quiet
  echo "✅ Artifact Registry repository '$REPO' created"
fi

# Create Cloud Run services (3 apps: proof-messenger, admin-insights, dev-portal)
APPS=("proof-messenger" "admin-insights" "dev-portal")

for app in "${APPS[@]}"; do
  SERVICE_NAME="atlas-$app"
  echo "☁️  Creating Cloud Run service: $SERVICE_NAME..."
  
  if gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" &>/dev/null; then
    echo "✅ Cloud Run service '$SERVICE_NAME' already exists"
  else
    # Create service with placeholder image (will be updated by CI/CD)
    gcloud run services create "$SERVICE_NAME" \
      --image="gcr.io/cloudrun/placeholder" \
      --region="$REGION" \
      --platform=managed \
      --allow-unauthenticated \
      --min-instances=1 \
      --max-instances=50 \
      --cpu=1 \
      --memory=512Mi \
      --concurrency=80 \
      --timeout=60s \
      --port=8080 \
      --project="$PROJECT_ID" \
      --quiet
    echo "✅ Cloud Run service '$SERVICE_NAME' created (placeholder image)"
  fi
done

echo ""
echo "✅ Infrastructure bootstrap complete!"
echo ""
echo "📍 Next steps:"
echo "  1. Run deploy-cloudrun.yml workflow to build and deploy images"
echo "  2. Run map-domains.sh to configure custom domains (optional)"
echo "  3. Configure Secret Manager secrets via secrets-sync.sh"
echo ""
echo "🔗 Service URLs (temporary):"
for app in "${APPS[@]}"; do
  SERVICE_NAME="atlas-$app"
  URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)" 2>/dev/null || echo "N/A")
  echo "  $SERVICE_NAME: $URL"
done
