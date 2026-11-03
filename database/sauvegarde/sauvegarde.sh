#!/usr/bin/env bash
# ============================================================
# sauvegarde.sh - Backup of the Miaoutic database (Linux server)
#
# Usage:
#   ./database/sauvegarde/sauvegarde.sh
# Every day at 2 am (crontab -e):
#   0 2 * * * /var/www/miaoutic/database/sauvegarde/sauvegarde.sh >> /var/log/miaoutic-sauvegarde.log 2>&1
#
# Optional variables:
#   DB_NAME              database to back up      (miaoutic)
#   BACKUP_DIR           folder of the backups    (backups/ at the root of the project)
#   RETENTION_DAYS       how long backups are kept (14 days)
#   MYSQL_DEFAULTS_FILE  option file holding user and password
#                        (see compte-sauvegarde.sql): the password
#                        appears neither in this script nor in the
#                        list of running processes.
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="${DB_NAME:-miaoutic}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../../backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

# Files readable by their owner only: they contain personal data (GDPR)
umask 077
mkdir -p "$BACKUP_DIR"

FILE="$BACKUP_DIR/${DB_NAME}_$(date +%Y-%m-%d_%H-%M).sql.gz"
TMP_FILE="$FILE.part"
# On error, never leave an incomplete backup behind
trap 'rm -f "$TMP_FILE"' EXIT

OPTIONS=()
if [ -n "${MYSQL_DEFAULTS_FILE:-}" ]; then
  # Must be the first option of mysqldump
  OPTIONS+=("--defaults-extra-file=$MYSQL_DEFAULTS_FILE")
fi

echo "$(date '+%F %T') Sauvegarde de $DB_NAME"

# --single-transaction: consistent copy without locking the site (InnoDB)
# --databases + --add-drop-database: the restore recreates the whole database
mysqldump ${OPTIONS[@]+"${OPTIONS[@]}"} \
  --single-transaction --no-tablespaces --triggers \
  --default-character-set=utf8mb4 \
  --add-drop-database --databases "$DB_NAME" \
  | gzip > "$TMP_FILE"

mv "$TMP_FILE" "$FILE"
echo "$(date '+%F %T') Sauvegarde terminée : $FILE ($(du -h "$FILE" | cut -f1))"

# Rotation: delete the backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -print -delete
