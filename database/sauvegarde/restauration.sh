#!/usr/bin/env bash
# ============================================================
# restauration.sh - Restauration de la base Miaoutic (serveur Linux)
#
# Utilisation :
#   ./database/sauvegarde/restauration.sh backups/miaoutic_2026-11-03_02-00.sql.gz
#   ./database/sauvegarde/restauration.sh backups/miaoutic_2026-11-03_02-00.sql.gz --oui
#     (--oui : sans question, pour un script)
#
# ATTENTION : la base actuelle est supprimée puis recréée à partir de
# la sauvegarde. Les comptes MySQL (miaoutic_app) sont conservés.
# Nécessite un compte administrateur MySQL (création de la base) :
# MYSQL_DEFAULTS_FILE peut indiquer son fichier d'options.
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

# Les sauvegardes du serveur sont compressées (.gz), celles de XAMPP non
if [[ "$FILE" == *.gz ]]; then
  gunzip -c "$FILE" | mysql ${OPTIONS[@]+"${OPTIONS[@]}"} --default-character-set=utf8mb4
else
  mysql ${OPTIONS[@]+"${OPTIONS[@]}"} --default-character-set=utf8mb4 < "$FILE"
fi

echo "$(date '+%F %T') Restauration terminée depuis $FILE"
