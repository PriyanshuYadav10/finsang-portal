#!/usr/bin/env bash
# Rebuilds the brochure and the program guide (HTML + PDF). Needs Google Chrome and an internet connection (web fonts).
set -euo pipefail
cd "$(dirname "$0")"
python3 build.py
