#!/bin/bash
set -euo pipefail

mkdir -p /app/instance

if litestream restore -if-replica-exists -config /app/litestream.yml /app/instance/app.db; then
    echo "Database restored successfully"
else
    echo "No existing database to restore"
fi

litestream replicate -config /app/litestream.yml &

exec gunicorn app:app \
    --bind 0.0.0.0:5000 \
    --workers 4 \
    --timeout 120 \
    --preload \
    --log-level info \
    --access-logfile /dev/stdout \
    --error-logfile /dev/stderr
