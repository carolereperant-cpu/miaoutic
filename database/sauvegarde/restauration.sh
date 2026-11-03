#!/usr/bin/env bash
# ============================================================
# restauration.sh - Restore of the Miaoutic database (Linux server)
#
# Usage:
#   ./database/sauvegarde/restauration.sh backups/miaoutic_2026-11-03_02-00.sql.gz
#   ./database/sauvegarde/restauration.sh backups/miaoutic_2026-11-03_02-00.sql.gz --oui
#     (--oui: no question asked, for use in a script)
#
# WARNING: the current database is dropped, then recreated from the
# backup. The MySQL accounts (miaoutic_app) are kept.
# Needs a MySQL administrator account (the database is created):
# MYSQL_DEFAULTS_FILE may point to its option file.
# ============================================================
set -euo pipefail

FILE="${1:-}"
if [ -z "$FILE" ]; then
  echo "Utilisation : $0 chemin/vers/sauvegarde.sql[.gz] [--oui]" >&2
  exit 1
fi
if [ ! -f "$FILE" ]; then
  echo "Fichier introuvable : $FILE" >&2
  exit 1
fi

if [ "${2:-}" != "--oui" ]; then
  echo "ATTENTION : la base va être remplacée par le contenu de $FILE"
  read -r -p "Tapez OUI pour continuer : " CONFIRMATION
  if [ "$CONFIRMATION" != "OUI" ]; then
    echo "Restauration annulée."
    exit 1
  fi
fi

OPTIONS=()
if [ -n "${MYSQL_DEFAULTS_FILE:-}" ]; then
  OPTIONS+=("--defaults-extra-file=$MYSQL_DEFAULTS_FILE")
fi

# Server backups are compressed (.gz), XAMPP backups are not
if [[ "$FILE" == *.gz ]]; then
  gunzip -c "$FILE" | mysql ${OPTIONS[@]+"${OPTIONS[@]}"} --default-character-set=utf8mb4
else
  mysql ${OPTIONS[@]+"${OPTIONS[@]}"} --default-character-set=utf8mb4 < "$FILE"
fi

echo "$(date '+%F %T') Restauration terminée depuis $FILE"
