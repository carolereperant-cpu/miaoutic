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

## API

### Installation

Prérequis : Node.js 20 ou plus, la base importée (voir ci-dessus) et MySQL démarré dans XAMPP.

```bash
cd api
npm install
copy .env.example .env
```

Ouvrir le fichier `.env` et renseigner `DB_PASSWORD` avec le mot de passe choisi pour le compte `miaoutic_app`.

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
├── utils/              Outils partagés (calcul de l'âge, erreurs HTTP)
└── tests/              Tests unitaires, tests de sécurité et tests des routes
```

### Routes disponibles

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | État de l'API et de la base de données |
| GET | `/api/especes` | Espèces avec le nombre d'animaux disponibles |
| GET | `/api/animaux` | Animaux disponibles ou réservés. Filtres : `espece` (id), `taille` (`petit`, `moyen`, `grand`), `nom` |
| GET | `/api/animaux/coups-de-coeur` | Les 3 coups de cœur de la page d'accueil |
| GET | `/api/animaux/:id` | Fiche complète d'un animal, avec son âge et ses vaccinations |

## Statut

Projet en cours de développement.
