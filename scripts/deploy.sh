#!/bin/bash
# Orbit Auto-Deploy Script
# This script pulls the latest changes from git and rebuilds the Docker container.
# Set up as a cron job on your server for automatic deployments.

set -e

REPO_DIR="/opt/orbit"
BRANCH="main"
LOG_FILE="/var/log/orbit-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cd "$REPO_DIR"

# Fetch latest changes
git fetch origin "$BRANCH" 2>> "$LOG_FILE"

# Check if there are new commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0
fi

log "New changes detected. Deploying..."
log "  $LOCAL -> $REMOTE"

# Pull changes
git pull origin "$BRANCH" >> "$LOG_FILE" 2>&1

# Rebuild and restart
DOMAIN=orbit-crm.duckdns.org docker compose up -d --build >> "$LOG_FILE" 2>&1

log "Deploy complete."
