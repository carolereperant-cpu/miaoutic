# Miaoutic

Application web d'adoption d'animaux pour un refuge associatif (projet fictif).
Le ton s'inspire des applications de rencontre : chaque adoptant remplit un questionnaire
sur son mode de vie, et l'application calcule son « % de match » avec chaque animal.

Projet réalisé dans le cadre du titre professionnel Développeur web et web mobile (DWWM).

## Fonctionnalités

- Consultation des animaux par espèce, recherche par nom, fiche détaillée
- Inscription et connexion (adoptant ou refuge)
- Questionnaire de mode de vie et score de compatibilité
- Demande d'adoption et suivi de son statut
- Espace refuge : gestion des animaux et traitement des demandes

## Stack technique

| Partie | Technologies |
|---|---|
| Front-end | React 19, Vite, React Router, Bootstrap 5, Sass |
| Back-end | Node.js, Express 5, mysql2 (requêtes préparées) — architecture multicouche : routes, controllers, services, models, middlewares |
| Base de données | MySQL / MariaDB (XAMPP en développement) |
| Sécurité | JWT, bcrypt, Helmet, CORS, express-validator, express-rate-limit |
| Qualité | Jest et Supertest (API), Vitest et React Testing Library (front), ESLint, GitHub Actions |
| Production | Nginx (HTTPS, en-têtes de sécurité), PM2, MariaDB — voir [la procédure de déploiement](docs/deploiement/procedure.md) |

## Base de données

La base est relationnelle (MySQL, ou MariaDB fourni avec XAMPP). Les scripts se trouvent
dans `database/` et s'exécutent dans l'ordre :

1. `01_schema.sql` : création de la base et des 8 tables
2. `02_users.sql` : création du compte utilisé par l'API (droits limités). Pour une base hébergée (Aiven),
   `02_users_hebergee.sql` le remplace : connexion depuis un autre serveur, chiffrement obligatoire
3. `03_referentiel.sql` : espèces, races et vaccins (nécessaires dans tous les environnements)
4. `04_jeu_essai.sql` : jeu de données de test (16 animaux et leurs vaccinations, 6 comptes, 9 demandes) ;
   **jamais en production**, il contient des comptes de test

Avant d'exécuter `02_users.sql`, remplacer `CHANGE_ME_STRONG_PASSWORD` par un mot de passe fort.

### Avec phpMyAdmin (XAMPP)

1. Démarrer **Apache** et **MySQL** dans le panneau de contrôle XAMPP.
2. Ouvrir http://localhost/phpmyadmin
3. Onglet **Importer** : importer les 4 fichiers l'un après l'autre, dans l'ordre.

### En ligne de commande (Windows, XAMPP)

```bash
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\01_schema.sql
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\02_users.sql
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\03_referentiel.sql
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\04_jeu_essai.sql
```

### Sauvegarde et restauration

Les scripts sont dans `database/sauvegarde/`. Les sauvegardes sont écrites dans `backups/`, dossier ignoré
par Git car elles contiennent des données personnelles.

| Script | Rôle |
|---|---|
| `sauvegarde.bat` / `restauration.bat` | Windows avec XAMPP (MySQL dans `C:\xampp\mysql\bin`) |
| `sauvegarde.sh` / `restauration.sh` | Serveur Linux : sauvegarde compressée, conservée 14 jours, lancée chaque nuit par `cron` |
| `compte-sauvegarde.sql` | Compte MySQL `miaoutic_backup` en lecture seule, réservé aux sauvegardes |

```bash
database\sauvegarde\sauvegarde.bat
database\sauvegarde\restauration.bat backups\miaoutic_2026-11-03_10-15.sql
```

La sauvegarde (`mysqldump --single-transaction`) copie la base sans bloquer le site. La restauration
supprime puis recrée toute la base : elle demande de taper `OUI` avant de commencer. Elle a été testée :
après la suppression de tous les animaux, la restauration a rendu les 16 animaux, leurs vaccinations et
les demandes, et l'API a continué de fonctionner avec son compte `miaoutic_app`.

### Comptes de test

Environnement de test uniquement. Mot de passe commun : `Miaoutic#2026`

| E-mail | Rôle | Particularité |
|---|---|---|
| refuge@miaoutic.test | refuge | |
| benevole@miaoutic.test | refuge | |
| lea.dubois@miaoutic.test | adoptant | Appartement, a un chat |
| thomas.moreau@miaoutic.test | adoptant | Maison avec jardin, enfants, a un chien |
| ines.garcia@miaoutic.test | adoptant | Maison sans jardin, enfants |
| hugo.lefevre@miaoutic.test | adoptant | Pas encore de questionnaire |

### Documentation

| Dossier | Contenu |
|---|---|
| [`docs/conception`](docs/conception) | [Expression des besoins et user stories](docs/conception/expression-des-besoins.md), MCD, MLD, [maquettes](docs/conception/maquettes) (ordinateur et mobile), [schéma d'enchaînement des écrans](docs/conception/enchainement-ecrans.png), [règles du score de compatibilité](docs/conception/score-compatibilite.md) |
| [`docs/tests`](docs/tests) | [Jeu d'essai de la demande d'adoption](docs/tests/jeu-essai-adoption.md), [tests de sécurité (OWASP)](docs/tests/tests-securite.md) |
| [`docs/deploiement`](docs/deploiement) | [Procédure de déploiement](docs/deploiement/procedure.md) (avec résumé en anglais), configuration Nginx |
| [`docs/captures`](docs/captures) | Captures d'écran, ordinateur et mobile |

## API

### Installation

Prérequis : Node.js 20 ou plus, la base importée (voir ci-dessus) et MySQL démarré dans XAMPP.

```bash
cd api
npm install
copy .env.example .env
```

Ouvrir le fichier `.env` et renseigner :

- `DB_PASSWORD` : le mot de passe choisi pour le compte `miaoutic_app` ;
- `JWT_SECRET` : une clé secrète d'au moins 32 caractères, générée avec la commande ci-dessous.

Les autres variables gardent leur valeur par défaut en développement ; `HOST` et `TRUST_PROXY` ne servent
qu'en production (voir la procédure de déploiement).

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
npm run dev     # démarre l'API sur http://localhost:3000/api (redémarre à chaque modification)
npm test        # lance les tests automatiques
npm run lint    # analyse la qualité du code
```

### Architecture

```
api/
├── app.js              Application Express : sécurité, routes, erreurs
├── server.js           Démarrage : vérifie la base puis ouvre le port
├── config/             Variables d'environnement, connexion MySQL
├── routes/             URL → règles de validation → contrôleur
├── middlewares/        Validation des entrées, gestion des erreurs
├── controllers/        Reçoit la requête, appelle le service, renvoie la réponse
├── services/           Règles métier (classes)
├── models/             Accès aux données : requêtes SQL préparées
├── utils/              Outils partagés (calcul de l'âge, erreurs HTTP, transactions)
├── docs/               Documentation OpenAPI (Swagger)
└── tests/              Tests unitaires, tests de sécurité et tests des routes
```

### Documentation interactive (Swagger)

Une fois l'API démarrée, la documentation de toutes les routes est disponible sur
**http://localhost:3000/api/docs**. Elle permet de tester chaque route directement depuis le navigateur
(bouton **Try it out**). Pour les routes protégées : se connecter avec `POST /auth/connexion`, copier le
jeton reçu et le coller dans **Authorize**.

La documentation est écrite dans `api/docs/openapi.yaml`. Un test automatique vérifie qu'elle respecte
le standard OpenAPI et que chaque route documentée existe bien dans l'API.

### Routes disponibles

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | État de l'API et de la base de données |
| GET | `/api/especes` | Espèces avec le nombre d'animaux disponibles |
| GET | `/api/animaux` | Animaux disponibles ou réservés. Filtres : `espece` (id), `taille` (`petit`, `moyen`, `grand`), `nom` |
| GET | `/api/animaux/coups-de-coeur` | Les 3 coups de cœur de la page d'accueil |
| GET | `/api/animaux/:id` | Fiche complète d'un animal, avec son âge et ses vaccinations |
| GET | `/api/races` | Races avec leur espèce (formulaires) |
| GET | `/api/vaccins` | Liste des vaccins (formulaires) |
| POST | `/api/auth/inscription` | Création d'un compte adoptant (`email`, `motDePasse`, `prenom`, `nom`) |
| POST | `/api/auth/connexion` | Connexion (`email`, `motDePasse`) : renvoie un jeton JWT valable 2 h |
| GET | `/api/auth/moi` | Compte de l'utilisateur connecté (en-tête `Authorization: Bearer <jeton>`) |

Routes réservées aux **adoptants** :

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/profil` | Questionnaire de l'adoptant |
| PUT | `/api/profil` | Création ou modification du questionnaire (`logement`, `aEnfants`, `aChien`, `aChat`, `tempsDisponible`) |
| GET | `/api/profil/matchs` | Animaux disponibles triés par score de compatibilité |
| GET | `/api/profil/compatibilite/:idAnimal` | Score détaillé avec un animal |
| POST | `/api/demandes` | Demande d'adoption (`idAnimal`, `message`) |
| GET | `/api/demandes/mes-demandes` | Demandes de l'adoptant |
| PATCH | `/api/demandes/:id/annulation` | Annulation d'une demande en cours |

Routes réservées au **refuge** :

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/demandes` | Toutes les demandes (filtre `statut`) |
| PATCH | `/api/demandes/:id/statut` | Changement de statut (`en_etude`, `acceptee`, `refusee`). Une acceptation adopte l'animal et refuse les autres demandes, dans une seule transaction |
| GET | `/api/animaux/gestion` | Tous les animaux, adoptés compris, avec leur nombre de demandes en cours |
| POST | `/api/animaux` | Ajout d'un animal et de ses vaccinations (une seule transaction) |
| PUT | `/api/animaux/:id` | Modification d'un animal ; ses vaccinations sont remplacées si la liste `vaccinations` est fournie |
| PATCH | `/api/animaux/:id/statut` | Animal `disponible` ou `reserve` (l'adoption passe par une demande acceptée) |
| DELETE | `/api/animaux/:id` | Suppression d'un animal qui n'a jamais reçu de demande |

### Sécurité de l'authentification

- Mots de passe hachés avec bcrypt (coût 12, sel aléatoire)
- Mot de passe d'au moins 12 caractères avec majuscule, minuscule, chiffre et caractère spécial (recommandation CNIL)
- Même message d'erreur et même temps de réponse que l'email existe ou non
- Jeton JWT signé (HS256), durée de vie limitée ; jeton modifié ou non signé refusé
- Rôle toujours « adoptant » à l'inscription, jamais lu dans la requête
- Blocage pendant 15 minutes après 10 tentatives échouées

## Front-end

### Installation

L'API doit être démarrée (voir ci-dessus).

```bash
cd frontend
npm install
npm run dev     # ouvre le site sur http://localhost:5173
npm test        # tests unitaires (Vitest et React Testing Library)
npm run lint    # analyse la qualité du code
npm run build   # version optimisée pour la mise en ligne, dans frontend/dist
```

Par défaut, le site appelle l'API sur `http://localhost:3000/api`. Pour une autre adresse, créer un fichier
`frontend/.env` contenant `VITE_API_URL=https://adresse-de-l-api/api`.

### Architecture

```
frontend/src/
├── main.jsx            Point d'entrée : polices, styles, application
├── App.jsx             Routes de l'application
├── components/         Éléments réutilisables (en-tête, carte animal, champ de formulaire…)
├── pages/              Une page par adresse (accueil, liste, fiche, connexion…)
├── context/            État de connexion partagé (AuthProvider)
├── hooks/              useApi (chargement des données), useAuth, useDocumentTitle
├── services/api.js     Tous les appels à l'API (fetch), jeton de connexion
├── utils/              Mise en forme des données, règles du mot de passe
└── styles/main.scss    Charte graphique (Bootstrap personnalisé avec Sass)
```

### Pages

| Adresse | Page | Accès |
|---|---|---|
| `/` | Accueil, coups de cœur du mois | Tout le monde |
| `/animaux`, `/animaux/chiens`… | Liste des animaux, filtre par taille | Tout le monde |
| `/animal/:id` | Fiche d'un animal | Tout le monde |
| `/connexion`, `/inscription` | Connexion, création de compte adoptant | Tout le monde |
| `/mon-questionnaire` | Questionnaire de compatibilité | Adoptant |
| `/mes-matchs` | Animaux classés par % de compatibilité | Adoptant |
| `/mes-demandes` | Suivi et annulation des demandes | Adoptant |
| `/refuge` | Tableau de bord : tous les animaux, réserver, supprimer | Refuge |
| `/refuge/animaux/nouveau` | Ajout d'un animal et de ses vaccinations | Refuge |
| `/refuge/animaux/:id/modifier` | Modification d'un animal | Refuge |
| `/refuge/demandes` | Étude, acceptation ou refus des demandes | Refuge |
| `/mentions-legales`, `/donnees-personnelles`, `/accessibilite`, `/cookies` | Pages légales | Tout le monde |

Les pages « Adoptant » et « Refuge » sont masquées aux autres visiteurs (`ProtectedRoute`), mais la vraie
protection reste l'API, qui vérifie le jeton et le rôle à chaque requête.

Captures d'écran : dossier [`docs/captures`](docs/captures).

### Choix techniques

- **Même gabarit que le projet « Trouve ton artisan »** : en-tête collant, bannière, cartes, fiche en deux colonnes, pied de page en trois colonnes.
- **Charte graphique** « Terracotta et sauge » : contrastes vérifiés (au moins 4,5:1 pour les textes).
- **Polices hébergées avec le site** (Fredoka pour les titres, Nunito pour le texte) : aucune requête vers Google Fonts (vie privée, performance).
- **Bootstrap importé partiellement** : seuls les modules utilisés sont compilés (éco-conception).
- **Jeton de connexion dans le `sessionStorage`** : effacé à la fermeture de l'onglet ; un jeton refusé par l'API déconnecte l'utilisateur.
- **Accessibilité** : lien « Aller au contenu », focus visible, champs reliés à leurs messages d'erreur, focus placé sur le contenu à chaque changement de page. Audit automatique axe-core : aucune violation WCAG 2.1 A/AA sur les pages publiques, l'espace adoptant et l'espace refuge (ordinateur et mobile).
- **Actions irréversibles confirmées dans la page** (supprimer un animal, accepter une adoption) : pas de fenêtre `confirm()` du navigateur, le focus clavier va sur le bouton de confirmation (`ConfirmAction`).
- **Formulaire animal** : les règles de l'API (dates, URL https, vaccinations) sont vérifiées aussi dans le navigateur pour aider la saisie ; l'API les vérifie de nouveau, c'est elle qui protège les données.
- **Référencement** : titre et description propres à chaque page, `noindex` sur les pages privées, `robots.txt`, `sitemap.xml` généré à la construction (variable `SITE_URL`), balises Open Graph.
- **Éco-conception** : pas d'image lourde (emoji quand un animal n'a pas de photo, photos chargées seulement quand elles sont visibles), polices limitées aux caractères latins, pages de l'espace adoptant et de l'espace refuge téléchargées seulement quand on les ouvre (`React.lazy`), fichiers mis en cache un an par le navigateur en production.

## Déploiement

Deux façons de mettre le site en ligne, décrites dans
[`docs/deploiement/procedure.md`](docs/deploiement/procedure.md) (avec un résumé en anglais) :

- **Serveur Linux** avec Nginx (HTTPS Let's Encrypt), PM2 et MariaDB : chaque mise à jour se fait avec
  `scripts/deploiement.sh` (sauvegarde de la base, code, dépendances, construction, publication,
  redémarrage de l'API, vérification).
- **Version de démonstration gratuite** : front et API sur **Render**, décrits dans `render.yaml`
  (infrastructure as code), base MySQL 8 chez **Aiven** en connexion chiffrée (TLS). La base est créée
  avec `api/scripts/executer-sql.js`. Render déploie chaque envoi sur `main`, seulement si les
  vérifications de GitHub Actions sont passées.

À chaque envoi sur GitHub, **GitHub Actions** analyse le code, lance les tests, construit le front et
vérifie les dépendances (`.github/workflows/ci.yml`).

## Statut

Version 1 terminée : 231 tests automatiques pour l'API, 72 pour le front.

## About this project (English)

Miaoutic is an adoption website for an animal shelter, written for the French "Développeur web et web
mobile" (DWWM) certification. Visitors browse the animals; adopters fill in a lifestyle questionnaire and
the server computes a compatibility score with each animal; the shelter manages its animals and handles
adoption requests.

- **Front-end**: React 19, Vite, React Router, Bootstrap 5 (Sass). Accessible (WCAG 2.1 AA checked with
  axe-core), responsive, unit tested with Vitest and React Testing Library.
- **Back-end**: REST API with Node.js and Express 5, layered architecture (routes, validators, controllers,
  services written as classes, models). MySQL / MariaDB accessed with prepared statements; transactions and
  row locks for the adoption workflow. JWT authentication, bcrypt, Helmet, CORS, rate limiting. Tested with
  Jest and Supertest, documented with OpenAPI (Swagger UI on `/api/docs`).
- **Operations**: backup and restore scripts, deployment script, Nginx configuration (HTTPS, security
  headers), PM2, continuous integration with GitHub Actions. See
  [the deployment procedure](docs/deploiement/procedure.md) (English summary at the end).

The code comments are written in English; the user interface and the documentation are in French.
