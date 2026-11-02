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
| Front-end | React, Vite, Bootstrap, Sass |
| Back-end | Node.js, Express 5, mysql2 (requêtes préparées) — architecture multicouche : routes, controllers, services, models, middlewares |
| Base de données | MySQL / MariaDB (XAMPP en développement) |
| Sécurité | JWT, bcrypt, Helmet, CORS, express-validator, express-rate-limit |
| Qualité | Jest et Supertest (tests), ESLint (analyse du code) |

## Base de données

La base est relationnelle (MySQL, ou MariaDB fourni avec XAMPP). Les scripts se trouvent
dans `database/` et s'exécutent dans l'ordre :

1. `01_schema.sql` : création de la base et des 8 tables
2. `02_users.sql` : création du compte utilisé par l'API (droits limités)
3. `03_data.sql` : jeu de données de test (16 animaux et leurs vaccinations, 6 comptes, 9 demandes)

Avant d'exécuter `02_users.sql`, remplacer `CHANGE_ME_STRONG_PASSWORD` par un mot de passe fort.

### Avec phpMyAdmin (XAMPP)

1. Démarrer **Apache** et **MySQL** dans le panneau de contrôle XAMPP.
2. Ouvrir http://localhost/phpmyadmin
3. Onglet **Importer** : importer les 3 fichiers l'un après l'autre, dans l'ordre.

### En ligne de commande (Windows, XAMPP)

```bash
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\01_schema.sql
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\02_users.sql
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\03_data.sql
```

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

### Documentation de conception

Dans `docs/conception/` : MCD, MLD et règles du score de compatibilité.

Dans `docs/tests/` : jeu d'essai de la demande d'adoption (données en entrée, attendues, obtenues).

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

## Statut

Projet en cours de développement.
