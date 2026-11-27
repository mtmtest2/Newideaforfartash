#!/usr/bin/env bash
# Nightly backup of the platform: PostgreSQL dump + uploaded media/private files. Keeps 14 days.
# cron:  15 3 * * *  /path/to/repo/deploy/platform/backup.sh /var/backups/fartash
set -euo pipefail
OUT=${1:-/var/backups/fartash}; TS=$(date +%Y%m%d-%H%M%S); mkdir -p "$OUT"
docker exec fartash-postgres pg_dump -U fartash -d fartash --format=custom > "$OUT/db-$TS.dump"
docker run --rm -v fartash_media:/m:ro -v fartash_private:/p:ro -v "$OUT":/out alpine tar czf "/out/files-$TS.tgz" -C / m p
find "$OUT" -type f -mtime +14 -delete
echo "backup written to $OUT (db-$TS.dump, files-$TS.tgz)"
