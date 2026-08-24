#!/bin/bash
set -e

# ============================================
# Cloud Run Deploy Script - Bradescard/Revvo
# ============================================

# Configuration - override with env vars or edit here
PROJECT_ID="${GCP_PROJECT:-ideen-revvo-hml-01}"
SERVICE_NAME="${SERVICE_NAME:-bradescard}"
REGION="${REGION:-us-central1}"
REPOSITORY_NAME="${REPOSITORY_NAME:-bradescard}"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY_NAME}/${SERVICE_NAME}"

echo "============================================"
echo "Deploying to Cloud Run"
echo "  Project:  ${PROJECT_ID}"
echo "  Service:  ${SERVICE_NAME}"
echo "  Region:  ${REGION}"
echo "  Image:   ${IMAGE_NAME}"
echo "============================================"

# Check gcloud is configured
if ! gcloud config get-value project &>/dev/null; then
  echo "Error: gcloud not configured. Run 'gcloud auth login' and 'gcloud config set project PROJECT_ID'"
  exit 1
fi

# Ensure correct project
gcloud config set project "${PROJECT_ID}"

# Enable required APIs (idempotent)
echo "Enabling required APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --quiet

# Ensure Artifact Registry repository exists
if ! gcloud artifacts repositories describe "${REPOSITORY_NAME}" --location="${REGION}" &>/dev/null; then
  echo "Creating Artifact Registry repository..."
  gcloud artifacts repositories create "${REPOSITORY_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Container images for ${SERVICE_NAME}"
fi

# Build and push image using Cloud Build
echo "Building and pushing image..."
gcloud builds submit --tag "${IMAGE_NAME}" .

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080

echo ""
echo "============================================"
echo "Deploy completed successfully!"
echo ""
gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format="value(status.url)"
echo "============================================"
