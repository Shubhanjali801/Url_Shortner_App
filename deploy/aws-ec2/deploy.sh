#!/usr/bin/env bash
# Deploy / redeploy the stack on the EC2 host and print the live HTTPS URL.
# Run from the folder containing docker-compose.yml. The instance must have an IAM
# role with AmazonEC2ContainerRegistryReadOnly (to pull the image from ECR).
set -euo pipefail

REGION="${REGION:-us-east-1}"
ACCOUNT="${ACCOUNT:-197002356271}"
cd "$(dirname "$0")"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"

echo "==> Pulling images and starting stack"
docker compose pull
docker compose up -d

echo "==> Waiting for the Cloudflare tunnel URL..."
URL=""
for i in $(seq 1 40); do
  URL=$(docker compose logs cloudflared 2>/dev/null \
        | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1 || true)
  [ -n "$URL" ] && break
  sleep 3
done

if [ -z "$URL" ]; then
  echo "ERROR: could not read tunnel URL. Check: docker compose logs cloudflared"
  exit 1
fi

echo "==> Setting BASE_URL=$URL and recreating app"
BASE_URL="$URL" docker compose up -d app

echo "$URL" > LIVE_URL.txt
echo ""
echo "=================================================="
echo "  LIVE (secure):  $URL"
echo "  (also saved to $(pwd)/LIVE_URL.txt)"
echo "=================================================="
