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
| Base de données | MySQL / MariaDB (XAMPP en développement) |
| Sécurité | JWT, bcrypt, Helmet, validation des entrées, limitation du débit |

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

## Statut

Projet en cours de développement.
