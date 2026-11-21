#!/bin/bash
# Orbit auto-deploy: pulls the latest main from GitHub and rebuilds the app container.
# Runs as the normal user (no sudo), from that user's crontab, e.g. every 5 minutes:
#   */5 * * * * /home/dom/Orbit/scripts/deploy.sh
# Only the app is rebuilt; the Cloudflare tunnel container is left running.

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="main"
LOG_FILE="$HOME/orbit-deploy.log"
BACKUP_DIR="$HOME/orbit-backups"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cd "$REPO_DIR"

git fetch origin "$BRANCH" 2>> "$LOG_FILE"

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0
fi

log "New changes detected. Deploying..."
log "  $LOCAL -> $REMOTE"

# Copy the data out before every deploy (keeps the last 20)
umask 077
STAMP=$(date '+%Y-%m-%d_%H%M%S')
mkdir -p "$BACKUP_DIR/$STAMP"
if docker cp orbit-crm:/app/data/. "$BACKUP_DIR/$STAMP/" 2>> "$LOG_FILE"; then
    log "  data backed up to $BACKUP_DIR/$STAMP"
fi
ls -1dt "$BACKUP_DIR"/*/ 2>/dev/null | tail -n +21 | xargs -r rm -rf

git pull --ff-only origin "$BRANCH" >> "$LOG_FILE" 2>&1

docker compose up -d --build orbit >> "$LOG_FILE" 2>&1

log "Deploy complete."
