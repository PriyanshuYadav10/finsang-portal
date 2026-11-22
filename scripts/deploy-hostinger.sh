#!/usr/bin/env bash
# Deploys the PHP edition to Hostinger over SSH (rsync). Safe to re-run: it never touches
# _app/config.php or _app/uploads, so updates keep your settings and uploaded files.
#
#   HOSTINGER_HOST=123.45.67.89 HOSTINGER_USER=u202556129 ./scripts/deploy-hostinger.sh
#
# Optional: HOSTINGER_PORT (default 65002), HOSTINGER_PATH (default domains/<your-domain>/public_html or public_html)
set -euo pipefail
cd "$(dirname "$0")/.."
: "${HOSTINGER_HOST:?Set HOSTINGER_HOST (hPanel > Advanced > SSH Access: IP)}"
: "${HOSTINGER_USER:?Set HOSTINGER_USER (hPanel > Advanced > SSH Access: username)}"
PORT="${HOSTINGER_PORT:-65002}"
DEST="${HOSTINGER_PATH:-public_html}"
bash scripts/build-php.sh
rsync -avz --delete -e "ssh -p $PORT" \
  --exclude '_app/config.php' --exclude '_app/uploads/' --exclude 'install.php.done' \
  dist/hostinger/ "$HOSTINGER_USER@$HOSTINGER_HOST:$DEST/"
echo "Deployed. First time? Open https://<your-domain>/install.php"
