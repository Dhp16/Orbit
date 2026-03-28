#!/bin/sh
# Fix data directory ownership at startup (handles pre-existing volumes owned by root)
chown -R nextjs:nodejs /app/data 2>/dev/null || true
exec su-exec nextjs node server.js
