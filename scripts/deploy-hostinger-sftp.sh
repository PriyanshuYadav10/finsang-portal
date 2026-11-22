#!/usr/bin/env bash
# Deploys the PHP edition to Hostinger over SFTP/FTP (for accounts without shell access).
# Requires lftp:  brew install lftp
#
#   HOSTINGER_HOST=147.93.17.138 HOSTINGER_USER=u202556129 ./scripts/deploy-hostinger-sftp.sh
#
# Optional: HOSTINGER_PORT (default 65002), HOSTINGER_PROTO (sftp|ftp, default sftp; for ftp the port is 21),
#           HOSTINGER_PATH (default public_html), HOSTINGER_PASSWORD (otherwise you are asked, nothing is stored)
# Re-runnable: _app/config.php and _app/uploads are never changed or deleted.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v lftp >/dev/null || { echo "Install lftp first: brew install lftp"; exit 1; }
: "${HOSTINGER_HOST:?Set HOSTINGER_HOST}"; : "${HOSTINGER_USER:?Set HOSTINGER_USER}"
PROTO="${HOSTINGER_PROTO:-sftp}"; PORT="${HOSTINGER_PORT:-$([ "$PROTO" = ftp ] && echo 21 || echo 65002)}"
DEST="${HOSTINGER_PATH:-public_html}"
if [ -z "${HOSTINGER_PASSWORD:-}" ]; then read -r -s -p "Password for $HOSTINGER_USER@$HOSTINGER_HOST: " HOSTINGER_PASSWORD; echo; fi
bash scripts/build-php.sh
lftp -u "$HOSTINGER_USER,$HOSTINGER_PASSWORD" "$PROTO://$HOSTINGER_HOST:$PORT" <<LFTP
set sftp:auto-confirm yes
set ssl:verify-certificate no
set net:max-retries 3
mirror --reverse --delete --verbose --parallel=4 -x '^_app/config\.php$' -x '^_app/uploads/' dist/hostinger/ $DEST/
bye
LFTP
echo "Deployed. First time? Open https://<your-domain>/install.php"
