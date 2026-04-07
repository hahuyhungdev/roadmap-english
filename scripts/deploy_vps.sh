#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Manual fallback deploy (run on VPS directly).
# CI/CD builds on GitHub Actions and SCPs the standalone tarball,
# so this script is only needed for manual / emergency deploys.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/marcus-app/roadmap-english-ai}"
SRC_DIR="${SRC_DIR:-/var/www/marcus-app/roadmap-english-ai-src}"
BRANCH="${BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-roadmap-ai}"
APP_URL="${APP_URL:-http://127.0.0.1:3000/}"

if [[ ! -d "$SRC_DIR/.git" ]]; then
  echo "Source directory is not a git repository: $SRC_DIR"
  exit 1
fi

cd "$SRC_DIR"

echo "== Sync repository to origin/$BRANCH =="
git fetch origin
git reset --hard "origin/$BRANCH"
git clean -fd

echo "== Install dependencies and build =="
npm ci
npm run build

echo "== Package standalone build =="
cp -r .next/static .next/standalone/.next/static
if [[ -d public ]]; then cp -r public .next/standalone/public; fi
cp -r content .next/standalone/content

echo "== Deploy standalone to $APP_DIR =="
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -a .next/standalone/. "$APP_DIR/"

# Preserve existing .env.local (manual deploy keeps VPS env file)
if [[ -f "$SRC_DIR/.env.local" ]]; then
  cp "$SRC_DIR/.env.local" "$APP_DIR/.env.local"
fi

echo "== Restart PM2 process =="
cd "$APP_DIR"
pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
pm2 start server.js --name "$PM2_APP_NAME"
pm2 save

sleep 2

echo "== Smoke test =="
status_code=$(curl -sS -o /tmp/roadmap-health.out -w "%{http_code}" "$APP_URL")
if [[ "$status_code" != "200" ]]; then
  echo "Health check failed: HTTP $status_code"
  head -c 500 /tmp/roadmap-health.out || true
  echo
  exit 1
fi

echo "== Deploy complete =="
echo "Commit: $(cd "$SRC_DIR" && git rev-parse --short HEAD)"
pm2 status "$PM2_APP_NAME" | sed -n '1,20p'
