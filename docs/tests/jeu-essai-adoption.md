# Jeu d'essai : la demande d'adoption

Fonctionnalité la plus représentative de Miaoutic : elle traverse toutes les couches de l'application
(authentification, validation des entrées, calcul du score côté serveur, règles métier, transaction et
verrous en base de données).

Environnement : API lancée en local (Node.js 22, MariaDB 10.11), base chargée avec `01_schema.sql`,
`03_referentiel.sql` et `04_jeu_essai.sql`. Requêtes envoyées avec curl.

## 1. Score de compatibilité

Route : `GET /api/profil/compatibilite/:idAnimal` (adoptant connecté).

| Adoptant | Animal | Données attendues | Données obtenues | Écart |
|---|---|---|---|---|
| Léa (appartement, a un chat, temps moyen) | Biscotte (petite, calme, s'entend avec les chats) | 100 % | 100 % (25 / 25 / 25 / 25) | Aucun |
| Inès (maison sans jardin, enfants, peu de temps) | Saphir (petit, énergie modérée) | 85 % | 85 % (25 / 25 / 25 / 10) | Aucun |
| Inès | Rocket (grand, énergique, besoin d'un jardin) | 50 % | 50 % (25 / 25 / 0 / 0) | Aucun |
| Thomas (enfants, a un chien) | Biscotte (ne supporte pas les chiens) | 30 %, plafonné (75 sans la règle de sécurité) | 30 %, plafonné | Aucun |
| Léa (a un chat) | Pacha (ne supporte pas les chats) | 30 %, plafonné (60 sans la règle de sécurité) | 30 %, plafonné | Aucun |

## 2. Création d'une demande

Route : `POST /api/demandes` (adoptant connecté).

| Cas | Données en entrée | Données attendues | Données obtenues | Écart |
|---|---|---|---|---|
| Sans questionnaire | Hugo, Oslo | 409 « Remplissez d'abord votre questionnaire… » | 409, même message | Aucun |
| Demande valide | Hugo (questionnaire rempli), Oslo, `"score_compatibilite": 100` ajouté à la main | 201, score calculé par le serveur | 201, score 100 calculé par le serveur, champ envoyé ignoré | Aucun |
| Deuxième demande | Hugo, Oslo à nouveau | 409 « Vous avez déjà une demande en cours pour Oslo. » | 409, même message | Aucun |
| Animal réservé | Hugo, Plume | 409 « Plume n'est plus disponible à l'adoption. » | 409, même message | Aucun |
| Animal adopté | Hugo, Filou | 409 | 409 | Aucun |
| Animal inexistant | Hugo, id 999 | 404 « Animal introuvable. » | 404 | Aucun |
| Message trop court | « Oui » | 400, erreur sur le champ `message` | 400 | Aucun |
| Mauvais rôle | Compte refuge | 403 | 403 | Aucun |

## 3. Acceptation d'une adoption (transaction)

Route : `PATCH /api/demandes/:id/statut` avec `{"statut": "acceptee"}` (compte refuge).

Situation de départ : Rocket est disponible et a deux demandes reçues, n° 4 (Thomas) et n° 9 (Inès).

| Données attendues | Données obtenues | Écart |
|---|---|---|
| Demande 4 : acceptée | Acceptée | Aucun |
| Rocket : adopté | Adopté | Aucun |
| Demande 9 : refusée automatiquement | Refusée (`autresDemandesRefusees: 1`) | Aucun |
| Rocket n'apparaît plus dans la liste publique | `GET /api/animaux?nom=Rocket` renvoie une liste vide | Aucun |
| Ré-accepter la demande 4 : 409 | 409 | Aucun |

## 4. Accès concurrents

Deux membres du refuge acceptent **au même instant** deux demandes différentes pour le même animal
(Sophie la demande 4, Karim la demande 9). Essai répété 3 fois.

| Essai | Sophie | Karim | Demandes acceptées pour Rocket |
|---|---|---|---|
| 1 | 200 | 409 « Rocket a déjà trouvé un foyer. » | 1 |
| 2 | 200 | 409 | 1 |
| 3 | 409 | 200 | 1 |

Données attendues : une seule adoption acceptée, quel que soit l'ordre d'arrivée.
Données obtenues : identiques, sans erreur serveur ni blocage.

Explication : la transaction verrouille la ligne de l'animal (`SELECT … FOR UPDATE`). La deuxième
transaction attend la fin de la première, relit l'animal, constate qu'il est adopté et s'arrête.

## Analyse des écarts

Aucun écart sur les résultats. Un point d'amélioration a été relevé pendant les essais : la personne
arrivée en second recevait d'abord un message technique (« Une demande refusee ne peut pas passer à
acceptee »). L'ordre des vérifications a été modifié pour afficher un message clair :
« Rocket a déjà trouvé un foyer. »
