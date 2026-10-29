# Score de compatibilité (« % de match »)

Le score compare le questionnaire de l'adoptant (`profil_adoptant`) aux critères de l'animal (`animal`).
Il est calculé **côté serveur** (composant métier), jamais dans le navigateur, pour qu'un utilisateur
ne puisse pas le modifier.

## Barème sur 100 points

| Critère | Points | Règle |
|---|---|---|
| Enfants | 25 | 0 si l'adoptant a des enfants et que l'animal n'est pas `ok_enfants` |
| Autres animaux | 25 | 0 si l'adoptant a un chien et que l'animal n'est pas `ok_chiens`, ou un chat et que l'animal n'est pas `ok_chats` |
| Logement | 25 | 0 si l'animal a `besoin_jardin` et que le logement n'a pas de jardin ; 10 si l'animal est grand et que l'adoptant vit en appartement ; 25 sinon |
| Temps disponible | 25 | Voir le tableau ci-dessous |

| Énergie de l'animal | Temps faible | Temps moyen | Temps élevé |
|---|---|---|---|
| calme | 25 | 25 | 25 |
| modéré | 10 | 25 | 25 |
| énergique | 0 | 10 | 25 |

## Règle de sécurité

Une incompatibilité avec les enfants ou avec les autres animaux **plafonne le score à 30 %**, quel que soit
le reste du barème. Sans cette règle, un chat qui a peur des chiens obtiendrait 75 % chez un adoptant qui a
un chien, ce qui serait trompeur et dangereux pour l'animal.

## Jeu d'essai

| Adoptant | Animal | Détail | Score attendu |
|---|---|---|---|
| Léa (appartement, a un chat, temps moyen) | Biscotte (petite, calme, ok chats) | 25 + 25 + 25 + 25 | 100 |
| Inès (maison sans jardin, enfants, temps faible) | Saphir (petit, modéré) | 25 + 25 + 25 + 10 | 85 |
| Inès | Rocket (grand, énergique, besoin de jardin) | 25 + 25 + 0 + 0 | 50 |
| Thomas (enfants, a un chien) | Biscotte (pas ok chiens) | 25 + 0 + 25 + 25 = 75, plafonné | 30 |
| Léa (a un chat) | Pacha (pas ok chats, grand) | 25 + 0 + 10 + 25 = 60, plafonné | 30 |

Ces scores sont ceux enregistrés dans `database/03_data.sql`. Les tests unitaires du service
de compatibilité vérifieront que l'API retrouve exactement les mêmes valeurs.
