#!/usr/bin/env bash
# ------------------------------------------------------------------
# deploy.sh
# Run ON THE SERVER (via SSH from GitHub Actions) to pull the latest
# code + backend/frontend images and restart the stack with zero manual
# steps.
# ------------------------------------------------------------------
set -euo pipefail

APP_DIR="/opt/simple-blog"
BRANCH="${1:-main}"

cd "$APP_DIR"

echo "Pulling latest code..."
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "Logging in to GHCR..."
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

echo "Pulling latest images..."
docker compose pull backend frontend

echo "Restarting stack..."
docker compose up -d --no-build

echo "Cleaning up old images..."
docker image prune -f

echo "Deploy complete."
