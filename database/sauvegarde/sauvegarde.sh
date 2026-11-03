#!/usr/bin/env bash
# ============================================================
# sauvegarde.sh - Sauvegarde de la base Miaoutic (serveur Linux)
#
# Utilisation :
#   ./database/sauvegarde/sauvegarde.sh
# Tous les jours à 2 h (crontab -e) :
#   0 2 * * * /var/www/miaoutic/database/sauvegarde/sauvegarde.sh >> /var/log/miaoutic-sauvegarde.log 2>&1
#
# Variables facultatives :
#   DB_NAME              base à sauvegarder          (miaoutic)
#   BACKUP_DIR           dossier des sauvegardes     (backups/ à la racine du projet)
#   RETENTION_DAYS       durée de conservation       (14 jours)
#   MYSQL_DEFAULTS_FILE  fichier d'options contenant user et password
#                        (voir compte-sauvegarde.sql) : le mot de passe
#                        n'apparaît ni dans le script ni dans la liste
#                        des processus.
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="${DB_NAME:-miaoutic}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../../backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

# Fichiers créés lisibles par le seul propriétaire : ils contiennent
# des données personnelles (RGPD)
umask 077
mkdir -p "$BACKUP_DIR"

FILE="$BACKUP_DIR/${DB_NAME}_$(date +%Y-%m-%d_%H-%M).sql.gz"
TMP_FILE="$FILE.part"
# En cas d'erreur, ne pas laisser une sauvegarde incomplète
trap 'rm -f "$TMP_FILE"' EXIT

OPTIONS=()
if [ -n "${MYSQL_DEFAULTS_FILE:-}" ]; then
  # Doit être la première option de mysqldump
  OPTIONS+=("--defaults-extra-file=$MYSQL_DEFAULTS_FILE")
fi

echo "$(date '+%F %T') Sauvegarde de $DB_NAME"

# --single-transaction : copie cohérente sans bloquer le site (InnoDB)
# --databases + --add-drop-database : la restauration recrée la base entière
mysqldump ${OPTIONS[@]+"${OPTIONS[@]}"} \
  --single-transaction --no-tablespaces --triggers \
  --default-character-set=utf8mb4 \
  --add-drop-database --databases "$DB_NAME" \
  | gzip > "$TMP_FILE"

mv "$TMP_FILE" "$FILE"
echo "$(date '+%F %T') Sauvegarde terminée : $FILE ($(du -h "$FILE" | cut -f1))"

# Rotation : suppression des sauvegardes plus anciennes que RETENTION_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -print -delete
