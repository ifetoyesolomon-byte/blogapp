#!/usr/bin/env bash
# ------------------------------------------------------------------
# provision.sh
# Provisions a fresh Ubuntu 22.04/24.04 VM to run the simple-blog app.
# Installs Docker + Docker Compose plugin, clones the repo, and
# starts the app with docker compose.
#
# Usage:
#   sudo bash provision.sh <git-repo-url> [branch]
#
# Example:
#   sudo bash provision.sh https://github.com/NetanTech/simple-blog.git main
# ------------------------------------------------------------------
set -euo pipefail

REPO_URL="https://github.com/VictorOjedokun/blog-app.git"
BRANCH="${2:-main}"
APP_DIR="/opt/simple-blog"

if [ -z "$REPO_URL" ]; then
  echo "Usage: sudo bash provision.sh <git-repo-url> [branch]"
  exit 1
fi

echo "== 1/6: Updating system packages =="
apt-get update -y
apt-get upgrade -y

echo "== 2/6: Installing prerequisites (git, curl, ca-certificates) =="
apt-get install -y ca-certificates curl gnupg git

echo "== 3/6: Installing Docker Engine + Compose plugin =="
if ! command -v docker &> /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "Docker already installed, skipping."
fi

systemctl enable docker
systemctl start docker

echo "== 4/6: Allowing the invoking user to run docker without sudo =="
if [ -n "${SUDO_USER:-}" ]; then
  usermod -aG docker "$SUDO_USER"
fi

echo "== 5/6: Cloning application repo =="
if [ -d "$APP_DIR" ]; then
  echo "App directory already exists, pulling latest changes instead."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "== 6/6: Starting the app with Docker Compose =="
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Created .env from .env.example — edit $APP_DIR/.env to change default credentials."
fi

cd "$APP_DIR"
docker compose pull || true
docker compose up -d --build

echo ""
echo "Done. The blog should be reachable at: http://$(curl -s ifconfig.me || echo '<server-ip>')"
echo "Check status with: docker compose ps"
echo "View logs with:   docker compose logs -f"
