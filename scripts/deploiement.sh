#!/usr/bin/env bash
# ============================================================
# deploiement.sh - Mise en production d'une nouvelle version
#
# À lancer SUR LE SERVEUR, depuis le dossier du projet, par
# l'utilisateur qui fait tourner l'application (pas root) :
#   ./scripts/deploiement.sh
#
# Étapes : sauvegarde de la base, récupération du code, dépendances,
# construction du front, publication, redémarrage de l'API sans
# coupure, vérification. Le script s'arrête à la première erreur
# (set -e) : la version en ligne reste alors celle d'avant.
#
# Variables facultatives :
#   BRANCH      branche à déployer                (main)
#   WEB_ROOT    dossier servi par Nginx           (/var/www/miaoutic/html)
#   API_PORT    port local de l'API               (3000)
#   SKIP_BACKUP 1 pour ne pas sauvegarder la base (déconseillé)
# La procédure complète est décrite dans docs/deploiement/procedure.md
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${BRANCH:-main}"
WEB_ROOT="${WEB_ROOT:-/var/www/miaoutic/html}"
API_PORT="${API_PORT:-3000}"

step() { echo; echo "==> $*"; }

cd "$ROOT"

# Les fichiers de configuration de production doivent exister :
# ils contiennent les secrets et ne sont jamais dans Git
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
# --ff-only : refuse de fusionner si le serveur a des modifications
# locales (on ne corrige jamais le code directement en production)
git pull --ff-only --quiet origin "$BRANCH"
echo "Version : $(git log -1 --format='%h %s')"

step "3/7 API : dépendances de production uniquement"
# npm ci installe exactement les versions de package-lock.json ;
# --omit=dev : pas d'outils de test sur le serveur
(cd api && npm ci --omit=dev --no-audit --no-fund)

step "4/7 Front : construction de la version optimisée"
(cd frontend && npm ci --no-audit --no-fund && npm run build)

step "5/7 Publication du front dans $WEB_ROOT"
mkdir -p "$WEB_ROOT"
# --delete : supprime les anciens fichiers qui n'existent plus
rsync -a --delete frontend/dist/ "$WEB_ROOT/"

step "6/7 Redémarrage de l'API (PM2)"
(cd api && pm2 startOrReload ecosystem.config.js --env production)
pm2 save > /dev/null

step "7/7 Vérification"
# L'API met quelques secondes à démarrer : jusqu'à 5 essais
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
