# Procédure de déploiement de Miaoutic

Ce document décrit la mise en ligne de Miaoutic sur un serveur Linux, puis la mise à jour d'une version
déjà en ligne. Un résumé en anglais se trouve à la fin.

## 1. Architecture de production

```
Navigateur ──HTTPS (443)──> Nginx ──┬── fichiers du front (React construit par Vite)
                                     └── /api/ ──> API Node.js (PM2, 127.0.0.1:3000) ──> MariaDB (localhost:3306)
```

- **Nginx** sert les fichiers du front et transmet les adresses `/api/` à l'API. Il gère le certificat HTTPS
  et ajoute les en-têtes de sécurité du front (CSP, HSTS…).
- **L'API** n'écoute que sur `127.0.0.1` : elle n'est pas joignable directement depuis Internet.
- **MariaDB** (ou MySQL) n'accepte que les connexions locales. L'API utilise le compte `miaoutic_app`, qui ne
  peut que lire et écrire des données (pas de création ni de suppression de table).
- **PM2** garde l'API en marche, la redémarre si elle s'arrête et la relance au démarrage du serveur.
- Front et API sont sur le **même domaine** : pas de requête vers un autre site, la politique CSP peut
  rester stricte (`connect-src 'self'`).

## 2. Composants et versions

| Composant | Version testée | Rôle |
|---|---|---|
| Ubuntu Server | 24.04 LTS | Système du serveur |
| Node.js | 22 LTS | Exécute l'API et construit le front |
| MariaDB | 10.11 (MySQL 8 compatible) | Base de données |
| Nginx | 1.24 | Serveur web et proxy inverse |
| PM2 | 6 | Gestionnaire de processus de l'API |
| Certbot | 2 | Certificat HTTPS Let's Encrypt, renouvelé automatiquement |

Les dépendances de l'API et du front sont figées dans les fichiers `package-lock.json` : `npm ci` installe
exactement les versions testées. Avant chaque mise à jour importante, consulter les notes de version
(changelog) de Node.js, Express, React et Vite, et lancer `npm audit --omit=dev`.

## 3. Préparer le serveur (une seule fois)

Prérequis : un serveur Ubuntu avec un accès SSH **par clé** (connexion par mot de passe désactivée) et un
nom de domaine qui pointe vers son adresse IP (`miaoutic.fr` dans les exemples).

```bash
# Mises à jour et pare-feu : seuls SSH, HTTP et HTTPS sont ouverts
sudo apt update && sudo apt upgrade -y
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable

# Logiciels
sudo apt install -y nginx mariadb-server git rsync certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Sécurisation de MariaDB (mot de passe root, suppression des comptes anonymes et de la base de test)
sudo mysql_secure_installation

# Utilisateur dédié à l'application (l'application ne tourne jamais en root)
sudo adduser --disabled-password --gecos "" miaoutic
sudo mkdir -p /var/www/miaoutic/html && sudo chown -R miaoutic: /var/www/miaoutic
```

## 4. Installer l'application

```bash
sudo -iu miaoutic
git clone https://github.com/carolereperant-cpu/miaoutic.git ~/miaoutic
cd ~/miaoutic
```

### 4.1 Base de données

Remplacer d'abord `CHANGE_ME_STRONG_PASSWORD` dans `database/02_users.sql` par un mot de passe fort
(ce fichier modifié ne doit pas être envoyé sur GitHub).

```bash
sudo mysql --default-character-set=utf8mb4 < database/01_schema.sql
sudo mysql --default-character-set=utf8mb4 < database/02_users.sql
sudo mysql --default-character-set=utf8mb4 < database/03_referentiel.sql
git checkout database/02_users.sql   # retire le mot de passe du fichier
```

**`04_jeu_essai.sql` n'est jamais exécuté en production** : il contient des comptes de test dont le mot
de passe est public.

Premier compte du refuge : le créer avec le formulaire d'inscription du site, puis lui donner le rôle
refuge. Le site ne permet jamais de choisir ce rôle : seul l'administrateur de la base peut le donner.

```bash
sudo mysql miaoutic -e "UPDATE utilisateur SET role = 'refuge' WHERE email = 'contact@refuge-pattes-unies.fr';"
```

### 4.2 Configuration (fichiers absents de Git)

`api/.env` (lisible par le seul propriétaire : `chmod 600 api/.env`) :

```bash
PORT=3000
CORS_ORIGIN=https://miaoutic.fr
DB_HOST=localhost
DB_PORT=3306
DB_USER=miaoutic_app
DB_PASSWORD=le_mot_de_passe_fort_de_02_users
DB_NAME=miaoutic
# Nouvelle clé, différente de celle du développement :
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=...
JWT_EXPIRES_IN=2h
AUTH_RATE_LIMIT=10
# L'API est derrière Nginx : elle lit la vraie adresse IP des visiteurs
TRUST_PROXY=1
```

`frontend/.env.production` :

```bash
# Même domaine que le site : l'API est appelée sur /api
VITE_API_URL=/api
# Adresse publique, utilisée pour générer sitemap.xml
SITE_URL=https://miaoutic.fr
```

### 4.3 Premier déploiement

```bash
SKIP_BACKUP=1 ./scripts/deploiement.sh   # pas encore de données à sauvegarder
pm2 startup                             # affiche une commande sudo à copier : relance de PM2 au démarrage
```

### 4.4 Nginx et HTTPS

```bash
sudo cp docs/deploiement/nginx-miaoutic.conf /etc/nginx/sites-available/miaoutic
# Remplacer miaoutic.fr par le vrai domaine dans ce fichier, puis :
sudo ln -s /etc/nginx/sites-available/miaoutic /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo certbot certonly --nginx -d miaoutic.fr -d www.miaoutic.fr
sudo nginx -t && sudo systemctl reload nginx
```

Certbot installe une tâche qui renouvelle le certificat avant son expiration (tous les 90 jours) :
`sudo certbot renew --dry-run` vérifie qu'elle fonctionne.

### 4.5 Sauvegardes automatiques

```bash
# Compte en lecture seule (remplacer CHANGE_ME_BACKUP_PASSWORD dans le fichier avant)
sudo mysql < database/sauvegarde/compte-sauvegarde.sql
git checkout database/sauvegarde/compte-sauvegarde.sql
# Fichier d'options : le mot de passe n'apparaît ni dans le script ni dans la liste des processus
printf '[client]\nuser=miaoutic_backup\npassword="le_mot_de_passe"\n' > ~/.miaoutic-backup.cnf
chmod 600 ~/.miaoutic-backup.cnf
# Tous les jours à 2 h (crontab -e)
0 2 * * * MYSQL_DEFAULTS_FILE=/home/miaoutic/.miaoutic-backup.cnf /home/miaoutic/miaoutic/database/sauvegarde/sauvegarde.sh >> /home/miaoutic/sauvegarde.log 2>&1
```

Les sauvegardes sont conservées 14 jours dans `~/miaoutic/backups/`. Une copie doit aussi partir sur un
autre support (autre serveur, stockage externe chiffré) : une sauvegarde gardée sur le même disque disparaît
avec lui.

## 5. Mettre à jour le site

Sur son ordinateur : tests, analyse du code et construction doivent passer (`npm test`, `npm run lint`,
`npm run build`), puis le code est envoyé sur GitHub. L'intégration continue (GitHub Actions) relance ces
vérifications à chaque envoi. Ensuite, sur le serveur :

```bash
sudo -iu miaoutic
cd ~/miaoutic && ./scripts/deploiement.sh
```

Le script `scripts/deploiement.sh` :

1. vérifie que les fichiers de configuration de production existent ;
2. sauvegarde la base ;
3. récupère le code de la branche `main` (`git pull --ff-only` : refuse si le serveur a été modifié à la main) ;
4. installe les dépendances de l'API **sans** les outils de développement (`npm ci --omit=dev`) ;
5. construit le front (`npm run build`, qui génère aussi `sitemap.xml`) ;
6. publie le front dans `/var/www/miaoutic/html` (`rsync --delete`) ;
7. recharge l'API avec PM2 (`pm2 startOrReload`), puis vérifie qu'elle répond sur `/api/health`.

Il s'arrête à la première erreur : la version en ligne reste alors la précédente.

### Évolution de la base de données

Une modification de structure (nouvelle colonne, nouvelle table) se fait par un script d'évolution numéroté
et daté, par exemple `database/evolutions/2026-12-01_ajout_photo_secondaire.sql`, écrit et testé sur une
copie de la base. En production : sauvegarde, exécution du script par l'administrateur, puis déploiement du
code qui l'utilise.

### Revenir à la version précédente

On n'écrit jamais de correction directement sur le serveur. Sur son ordinateur, on annule la modification
qui pose problème par un nouveau commit, que l'on envoie sur GitHub :

```bash
git log --oneline -5          # repérer la modification en cause
git revert <identifiant>      # crée un commit qui l'annule
git push
```

Puis, sur le serveur : `./scripts/deploiement.sh`. Si la base a été abîmée :
`./database/sauvegarde/restauration.sh backups/miaoutic_<date>.sql.gz`.

## 6. Vérifications après déploiement

| Vérification | Commande ou outil | Résultat attendu |
|---|---|---|
| Redirection vers HTTPS | `curl -I http://miaoutic.fr` | `301` vers `https://miaoutic.fr/` |
| En-têtes de sécurité | `curl -I https://miaoutic.fr` ou securityheaders.com | CSP, HSTS, `X-Content-Type-Options` présents |
| API et base | `curl https://miaoutic.fr/api/health` | `{"api":"ok","database":"ok"}` |
| Navigation directe | ouvrir `https://miaoutic.fr/animal/1` | la fiche s'affiche (pas d'erreur 404 de Nginx) |
| Port de l'API fermé | `curl http://miaoutic.fr:3000` depuis un autre ordinateur | connexion refusée |
| Journaux | `pm2 logs miaoutic-api` | pas d'erreur |
| Référencement | `https://miaoutic.fr/robots.txt` et `/sitemap.xml` | fichiers présents, avec le bon domaine |

## 7. Autre hébergement possible

Sans serveur à administrer, un hébergeur qui propose Node.js et MySQL (par exemple alwaysdata, offre
gratuite de 100 Mo) convient : le front construit est copié dans le dossier web, l'API est déclarée comme
« site Node.js » avec les mêmes variables d'environnement, et la base est créée avec les scripts 01, 02
et 03 depuis phpMyAdmin. Le HTTPS est fourni par l'hébergeur.

---

## Deployment summary (English)

Miaoutic runs on a Linux server (Ubuntu 24.04): **Nginx** serves the built React files over HTTPS and
forwards `/api/` requests to the **Node.js API**, managed by **PM2** and listening on `127.0.0.1:3000` only.
The **MariaDB** database accepts local connections only, and the API uses a restricted account
(`miaoutic_app`: SELECT, INSERT, UPDATE, DELETE).

First installation: install Node.js 22, MariaDB, Nginx, PM2 and Certbot; create the database with
`01_schema.sql`, `02_users.sql` (strong password) and `03_referentiel.sql` — never the test data set
`04_jeu_essai.sql`; write `api/.env` and `frontend/.env.production` (secrets are never stored in Git);
run `./scripts/deploiement.sh`; install `docs/deploiement/nginx-miaoutic.conf` and get a Let's Encrypt
certificate; schedule the nightly backup (`database/sauvegarde/sauvegarde.sh`, read-only MySQL account,
14-day retention).

Each update: tests, lint and build pass locally and in GitHub Actions, then `./scripts/deploiement.sh`
on the server backs up the database, pulls `main` (fast-forward only), installs production dependencies
(`npm ci --omit=dev`), builds and publishes the front-end, reloads the API with PM2 and checks
`/api/health`. The script stops at the first error, so the previous version stays online.
