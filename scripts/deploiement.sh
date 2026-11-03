#!/usr/bin/env bash
# ============================================================
# deploiement.sh - Puts a new version in production
#
# Run ON THE SERVER, from the folder of the project, by the user
# who runs the application (not root):
#   ./scripts/deploiement.sh
#
# Steps: database backup, code update, dependencies, build of the
# front-end, publication, reload of the API without downtime, check.
# The script stops at the first error (set -e): the version online
# then stays the previous one.
#
# Optional variables:
#   BRANCH      branch to deploy                 (main)
#   WEB_ROOT    folder served by Nginx           (/var/www/miaoutic/html)
#   API_PORT    local port of the API            (3000)
#   SKIP_BACKUP 1 to skip the database backup    (not recommended)
# The full procedure is described in docs/deploiement/procedure.md
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${BRANCH:-main}"
WEB_ROOT="${WEB_ROOT:-/var/www/miaoutic/html}"
API_PORT="${API_PORT:-3000}"

step() { echo; echo "==> $*"; }

cd "$ROOT"

# The production configuration files must exist: they hold the
# secrets and are never stored in Git
for file in api/.env frontend/.env.production; do
  if [ ! -f "$file" ]; then
    echo "Fichier manquant : $file (voir docs/deploiement/procedure.md)" >&2
    exit 1
  fi
done

step "1/7 Sauvegarde de la base avant la mise à jour"
if [ "${SKIP_BACKUP:-0}" = "1" ]; then
  echo "Sauvegarde ignorée (SKIP_BACKUP=1)"
else
  ./database/sauvegarde/sauvegarde.sh
fi

step "2/7 Récupération du code (branche $BRANCH)"
git fetch --quiet origin "$BRANCH"
git checkout --quiet "$BRANCH"
# --ff-only: refuses to merge if the server has local changes
# (the code is never fixed directly in production)
git pull --ff-only --quiet origin "$BRANCH"
echo "Version : $(git log -1 --format='%h %s')"

step "3/7 API : dépendances de production uniquement"
# npm ci installs exactly the versions of package-lock.json;
# --omit=dev: no test tools on the server
(cd api && npm ci --omit=dev --no-audit --no-fund)

step "4/7 Front : construction de la version optimisée"
(cd frontend && npm ci --no-audit --no-fund && npm run build)

step "5/7 Publication du front dans $WEB_ROOT"
mkdir -p "$WEB_ROOT"
# --delete: removes the old files that no longer exist
rsync -a --delete frontend/dist/ "$WEB_ROOT/"

step "6/7 Redémarrage de l'API (PM2)"
(cd api && pm2 startOrReload ecosystem.config.js --env production)
pm2 save > /dev/null

step "7/7 Vérification"
# The API needs a few seconds to start: up to 5 attempts
for _ in 1 2 3 4 5; do
  if curl -fs "http://127.0.0.1:$API_PORT/api/health"; then
    echo
    echo "Déploiement terminé."
    exit 0
  fi
  sleep 2
done
echo "L'API ne répond pas : consulter les journaux avec  pm2 logs miaoutic-api" >&2
exit 1
