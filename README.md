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

Les scripts se trouvent dans `database/` et s'exécutent dans l'ordre :

1. `01_schema.sql` : création de la base et des tables
2. `02_users.sql` : création du compte MySQL utilisé par l'API (droits limités)

```bash
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_users.sql
```

Avant d'exécuter `02_users.sql`, remplacer `CHANGE_ME_STRONG_PASSWORD` par un mot de passe fort.

Les schémas de conception (MCD et MLD) sont dans `docs/conception/`.

## Statut

Projet en cours de développement.
