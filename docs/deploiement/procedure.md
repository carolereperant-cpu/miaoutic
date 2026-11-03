# Procédure de déploiement de Miaoutic

Ce document décrit deux façons de mettre Miaoutic en ligne :

- sur un **serveur Linux** que l'on administre soi-même (sections 1 à 6) : la solution complète, pour un
  vrai refuge ;
- en **version de démonstration gratuite** sur **Render** (front et API) et **Aiven** (base MySQL)
  (section 7) : la version présentée au jury.

Un résumé en anglais se trouve à la fin.

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
| MariaDB / MySQL | MariaDB 10.11 et MySQL 8.0 (tous les parcours testés sur les deux) | Base de données |
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
# L'API n'écoute que sur le serveur lui-même : seul Nginx peut la joindre
HOST=127.0.0.1
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
| API non exposée | `ss -ltn \| grep 3000` sur le serveur | `127.0.0.1:3000` uniquement |
| Pare-feu | `sudo ufw status` | seuls 22, 80 et 443 sont ouverts |
| Journaux | `pm2 logs miaoutic-api` | pas d'erreur |
| Référencement | `https://miaoutic.fr/robots.txt` et `/sitemap.xml` | fichiers présents, avec le bon domaine |

## 7. Version de démonstration : Render et Aiven

### 7.1 Architecture

```
Navigateur ──HTTPS──> Render, site statique « miaoutic » (front React)
     └─────HTTPS──> Render, web service « miaoutic-api » (API Node.js) ──TLS──> Aiven (MySQL 8)
```

| Service | Offre | Ce qu'il faut savoir |
|---|---|---|
| Render, site statique | Gratuite | HTTPS automatique, en-têtes de sécurité déclarés dans `render.yaml` |
| Render, web service | Gratuite | **Mise en veille après 15 minutes sans visite** : au réveil, la première requête attend environ une minute (le site affiche « Le serveur se réveille… ») |
| Aiven for MySQL | Gratuite (1 Go) | Connexion chiffrée obligatoire ; un service inutilisé peut être éteint par Aiven et se rallume depuis sa console |

Toute la configuration de Render est écrite dans le fichier **`render.yaml`** à la racine du dépôt
(« infrastructure as code ») : services, commandes de construction, variables, règles de réécriture et
en-têtes de sécurité. Les secrets n'y figurent jamais (`sync: false` : Render demande leur valeur).

### 7.2 Créer la base sur Aiven

1. Sur console.aiven.io, créer un service **MySQL** avec le plan **Free**.
2. Une fois le service démarré, page **Overview** : noter `Host`, `Port`, `User` (`avnadmin`) et
   `Password`, puis télécharger le **CA certificate** et l'enregistrer sous `api/ca.pem` (ignoré par Git).
3. Copier `api/.env.admin.example` en `api/.env.admin` (ignoré par Git) et le remplir. `APP_DB_PASSWORD`
   est un **nouveau** mot de passe d'au moins 16 caractères pour le compte `miaoutic_app` de l'API.
4. Créer la base depuis son ordinateur, à travers la connexion chiffrée :

```bash
cd api
node scripts/executer-sql.js ../database/01_schema.sql ../database/02_users_hebergee.sql ../database/03_referentiel.sql ../database/04_jeu_essai.sql
```

`02_users_hebergee.sql` remplace `02_users.sql` : le compte `miaoutic_app` peut se connecter depuis
n'importe quelle adresse (celle de Render n'est pas fixe), mais **seulement en connexion chiffrée**
(`REQUIRE SSL`), avec les mêmes droits limités. Le mot de passe est inséré par le script au moment de
l'exécution, il n'est jamais écrit dans un fichier du dépôt.

Le jeu d'essai (`04_jeu_essai.sql`) est chargé **parce qu'il s'agit d'une démonstration** : le jury peut
se connecter avec les comptes de test du README. Pour un vrai refuge, on s'arrête à `03_referentiel.sql`
et le premier compte refuge est créé comme décrit en 4.1.

### 7.3 Créer les services sur Render

1. Sur dashboard.render.com (connexion avec GitHub) : **New > Blueprint**, choisir le dépôt `miaoutic`.
   Render lit `render.yaml` et propose les deux services.
2. Renseigner les valeurs demandées :

| Service | Variable | Valeur |
|---|---|---|
| miaoutic-api | `CORS_ORIGIN` | `https://miaoutic.onrender.com` |
| miaoutic-api | `DB_HOST`, `DB_PORT` | valeurs d'Aiven |
| miaoutic-api | `DB_PASSWORD` | la valeur de `APP_DB_PASSWORD` |
| miaoutic | `VITE_API_URL` | `https://miaoutic-api.onrender.com/api` |
| miaoutic | `SITE_URL` | `https://miaoutic.onrender.com` |

3. Service **miaoutic-api** > **Environment** > **Secret Files** : ajouter un fichier nommé
   `aiven-ca.pem` avec le contenu de `ca.pem` (l'API le lit dans `/etc/secrets/aiven-ca.pem`).
4. Vérifier les adresses réellement attribuées par Render en haut de la page de chaque service. Si l'un
   des noms était déjà pris, Render ajoute un suffixe : corriger alors `CORS_ORIGIN`, `VITE_API_URL` et
   `SITE_URL`, puis **Save, rebuild, and deploy** (le front doit être reconstruit : Vite écrit l'adresse
   de l'API dans les fichiers au moment de la construction).

### 7.4 Déploiement continu

`autoDeployTrigger: checksPass` : à chaque `git push` sur `main`, Render attend que GitHub Actions ait
validé la version (analyse du code, tests, construction), puis la déploie. Une version qui casse un test
n'est jamais mise en ligne. Render vérifie aussi `/api/health` avant de basculer sur la nouvelle version
de l'API : si elle n'arrive pas à joindre la base, l'ancienne reste en ligne.

### 7.5 Avant une présentation

- La veille et le matin même : vérifier dans la console Aiven que le service MySQL est **Running**.
- Quelques minutes avant de passer : ouvrir le site pour **réveiller l'API**.
- Vérifier `https://miaoutic-api.onrender.com/api/health` : `{"api":"ok","database":"ok"}`.

## 8. Autre hébergement possible

Sans serveur à administrer, un hébergeur qui propose Node.js et MySQL convient aussi, par exemple alwaysdata
(hébergeur français, formule gratuite réservée à un usage personnel : vérifier ses conditions avant de
choisir) : le front construit est copié dans le dossier web, l'API est déclarée comme
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

Demonstration version: the front-end (static site) and the API (free web service, which sleeps after
15 minutes without traffic) run on **Render**, described as code in `render.yaml`; the MySQL 8 database
is hosted by **Aiven** and only accepts encrypted connections (TLS, certificate checked by the API).
The database is created from the developer's computer with `api/scripts/executer-sql.js`. Render deploys
each push on `main` automatically, but only after the GitHub Actions checks have passed.
