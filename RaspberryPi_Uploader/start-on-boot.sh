#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$APP_DIR/logs"
BOOT_LOG="$LOG_DIR/boot.log"
SERVER_LOG="$LOG_DIR/server.log"
UPLOADER_LOG="$LOG_DIR/uploader.log"

mkdir -p "$LOG_DIR"
cd "$APP_DIR"

{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Boot startup script triggered"

  IP_ADDR="$(hostname -I | awk '{print $1}')"
  if [ -n "${IP_ADDR:-}" ]; then
    echo "Phone UI URL: http://${IP_ADDR}:3000"
  else
    echo "Phone UI URL: could not detect IP yet"
  fi

  if pgrep -f "node server.js" >/dev/null 2>&1; then
    echo "server.js is already running"
  else
    nohup npm start > "$SERVER_LOG" 2>&1 &
    echo "Started server.js"
  fi

  if pgrep -f "node upload-script.js" >/dev/null 2>&1; then
    echo "upload-script.js is already running"
  else
    nohup npm run uploader > "$UPLOADER_LOG" 2>&1 &
    echo "Started upload-script.js"
  fi

  echo "Startup checks complete"
} >> "$BOOT_LOG" 2>&1
