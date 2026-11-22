#!/usr/bin/env bash
# Builds the Hostinger (PHP + MySQL) package: dist/hostinger/ and dist/finsang-hostinger.zip
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist/hostinger && mkdir -p dist/hostinger
cp -R public/. dist/hostinger/
cp php/api.php php/install.php php/.htaccess dist/hostinger/
mkdir -p dist/hostinger/_app && cp -R php/_app/lib php/_app/seed php/_app/.htaccess php/_app/index.php dist/hostinger/_app/
mkdir -p dist/hostinger/_app/uploads && cp php/_app/.htaccess dist/hostinger/_app/uploads/.htaccess
cp public/img/logo.png dist/hostinger/favicon.ico
find dist/hostinger -name .DS_Store -delete
rm -f dist/finsang-hostinger.zip
(cd dist/hostinger && zip -qr ../finsang-hostinger.zip . -x '.DS_Store')
echo "Built dist/hostinger and dist/finsang-hostinger.zip ($(du -h dist/finsang-hostinger.zip | cut -f1))"
