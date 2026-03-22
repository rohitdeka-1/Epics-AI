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

  # Wait for hotspot/Wi-Fi to provide an IP before launching services.
  for i in {1..20}; do
    IP_ADDR="$(hostname -I | awk '{print $1}')"
    if [ -n "${IP_ADDR:-}" ]; then
      break
    fi
    sleep 2
  done

  if [ -n "${IP_ADDR:-}" ]; then
    echo "Phone UI URL: http://${IP_ADDR}:3000"
  else
    echo "Phone UI URL: could not detect IP yet"
  fi

  # Try to ensure Mongo host DNS is resolvable before uploader starts.
  MONGO_HOST="$(grep -E '^MONGODB_URI=' "$APP_DIR/.env" 2>/dev/null | cut -d '=' -f2- | sed -E 's#^mongodb(\+srv)?://([^@/]+@)?([^/?,]+).*#\3#')"
  if [ -n "${MONGO_HOST:-}" ]; then
    for i in {1..20}; do
      if getent hosts "$MONGO_HOST" >/dev/null 2>&1; then
        echo "Mongo DNS ready for host: $MONGO_HOST"
        break
      fi
      if [ "$i" -eq 20 ]; then
        echo "Mongo DNS not ready yet for host: $MONGO_HOST (uploader will still use app-level retries)"
      fi
      sleep 2
    done
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
