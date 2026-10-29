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
| Back-end | Node.js, Express (architecture multicouche : routes, controllers, services, models, middlewares) |
| Base relationnelle | MySQL 8 |
| Base NoSQL | MongoDB (fiches santé et caractère des animaux) |
| Sécurité | JWT, bcrypt, Helmet, validation des entrées, limitation du débit |

## Base de données

### MySQL

Les scripts se trouvent dans `database/` et s'exécutent dans l'ordre :

1. `01_schema.sql` : création de la base et des tables
2. `02_users.sql` : création du compte MySQL utilisé par l'API (droits limités)
3. `03_data.sql` : jeu de données de test (16 animaux, 6 comptes, 9 demandes)

```bash
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_users.sql
mysql -u root -p < database/03_data.sql
```

Avant d'exécuter `02_users.sql`, remplacer `CHANGE_ME_STRONG_PASSWORD` par un mot de passe fort.

### MongoDB

La collection `fiches_animaux` contient les fiches santé et caractère (une par animal, reliée à MySQL par `animalId`).

```bash
mongosh "mongodb://localhost:27017/miaoutic" database/mongo/01_fiches_animaux.js
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

## Statut

Projet en cours de développement.
