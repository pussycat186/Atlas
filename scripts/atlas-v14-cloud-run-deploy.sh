#!/bin/bash
# ATLAS v14 Cloud Run Deployment Script
# Deploys app and nginx services with proper configuration

set -euo pipefail

# Configuration
PROJECT_ID=${PROJECT_ID:-"atlas-v14-project"}
REGION=${REGION:-"us-central1"}
APP_SERVICE_NAME="atlas-app"
NGINX_SERVICE_NAME="atlas-nginx"

echo "🚀 ATLAS v14 Cloud Run Deployment"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy via Cloud Build
echo "🔨 Building and deploying services..."
gcloud builds submit --config cloudbuild.yaml .

# Get service URLs
echo "🔍 Getting service URLs..."
APP_URL=$(gcloud run services describe $APP_SERVICE_NAME --region=$REGION --format="value(status.url)")
NGINX_URL=$(gcloud run services describe $NGINX_SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment complete!"
echo "App URL: $APP_URL"
echo "NGINX URL: $NGINX_URL"
echo ""

# Verify deployment
echo "🔍 Verifying deployment..."
echo "App service status:"
gcloud run services describe $APP_SERVICE_NAME --region=$REGION --format="table(metadata.name,status.url,spec.template.spec.containers[0].image,spec.template.metadata.annotations.autoscaling.knative.dev/minScale,spec.template.metadata.annotations.autoscaling.knative.dev/maxScale,spec.template.spec.containerConcurrency)"

echo ""
echo "NGINX service status:"
gcloud run services describe $NGINX_SERVICE_NAME --region=$REGION --format="table(metadata.name,status.url,spec.template.spec.containers[0].image,spec.template.metadata.annotations.autoscaling.knative.dev/minScale,spec.template.metadata.annotations.autoscaling.knative.dev/maxScale,spec.template.spec.containerConcurrency)"

# Test reachability
echo ""
echo "🌐 Testing reachability..."
for route in "/" "/keys" "/playground" "/metrics"; do
  echo "Testing $NGINX_URL$route"
  curl -I "$NGINX_URL$route" || echo "Failed to reach $route"
done

echo ""
echo "🎯 ATLAS v14 Cloud Run deployment ready for testing!"
echo "Target URL: $NGINX_URL"
