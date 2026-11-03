# Expression des besoins

## 1. Contexte

Le refuge associatif **Les Pattes Unies** (fictif) gère ses adoptions par téléphone, sur Facebook et avec des
dossiers papier. Les bénévoles perdent du temps à répondre aux mêmes questions, et des animaux sont proposés
à des familles dont le mode de vie ne leur convient pas (un chien très énergique dans un petit appartement,
un chat qui ne supporte pas les enfants…). Ces adoptions mal assorties finissent parfois par un retour au
refuge.

**Miaoutic** présente les animaux du refuge en ligne et oriente chaque famille vers les animaux qui lui
correspondent. Le ton s'inspire des sites de rencontre (« % de match », « Je craque ! », « C'est un match ! »)
pour rendre la démarche d'adoption moins intimidante.

## 2. Objectifs

1. Présenter les animaux à adopter avec leur caractère et leur santé, consultables sans compte.
2. Calculer pour chaque adoptant un score de compatibilité avec chaque animal, à partir de son mode de vie.
3. Recevoir les demandes d'adoption en ligne et permettre à l'adoptant d'en suivre l'avancement.
4. Donner au refuge un espace pour gérer ses animaux et traiter les demandes.
5. Respecter le RGPD, le RGAA (accessibilité) et les bonnes pratiques de sécurité et d'éco-conception.

## 3. Acteurs

| Acteur | Description | Accès |
|---|---|---|
| Visiteur | Personne qui découvre les animaux | Sans compte |
| Adoptant | Personne qui souhaite adopter | Compte créé sur le site |
| Refuge | Salarié ou bénévole du refuge | Compte dont le rôle est donné par l'administrateur |

## 4. User stories

Priorité selon la méthode MoSCoW : **M** (indispensable), **S** (important), **C** (souhaitable).
Toutes les stories **M** et **S** sont réalisées.

### Visiteur

| N° | En tant que… je veux… afin de… | Critères d'acceptation | Priorité |
|---|---|---|---|
| V1 | En tant que visiteur, je veux voir les coups de cœur du refuge sur la page d'accueil afin de découvrir des animaux rapidement | 3 animaux disponibles marqués « coup de cœur » ; les 4 étapes de l'adoption sont expliquées | M |
| V2 | En tant que visiteur, je veux parcourir les animaux par espèce et par taille afin de trouver ceux qui m'intéressent | Menu Chiens / Chats / Lapins / Rongeurs, filtre par taille, nombre d'animaux trouvés ; les animaux adoptés ne sont pas affichés | M |
| V3 | En tant que visiteur, je veux chercher un animal par son nom afin de retrouver un animal vu sur les réseaux sociaux | Recherche dans l'en-tête, sur toutes les pages | S |
| V4 | En tant que visiteur, je veux consulter la fiche d'un animal afin de connaître son histoire, son caractère et sa santé | Âge calculé, compatibilités, stérilisation, identification, vaccinations datées ; un animal réservé est signalé | M |
| V5 | En tant que visiteur, je veux créer un compte afin de connaître mon % de match | Mot de passe de 12 caractères minimum (règles affichées), erreurs sous chaque champ, lien vers la politique de confidentialité | M |

### Adoptant

| N° | En tant que… je veux… afin de… | Critères d'acceptation | Priorité |
|---|---|---|---|
| A1 | En tant qu'adoptant, je veux décrire mon mode de vie (logement, enfants, animaux, temps disponible) afin d'obtenir des scores de compatibilité | 5 questions ; réponses modifiables à tout moment | M |
| A2 | En tant qu'adoptant, je veux voir les animaux classés par % de match afin de commencer par ceux qui me correspondent | Score sur 100 calculé par le serveur ; niveau écrit en toutes lettres (« Coup de foudre », « Belle affinité », « Peu compatible ») | M |
| A3 | En tant qu'adoptant, je veux voir le détail du score sur la fiche d'un animal afin de comprendre ce qui coince | Détail par critère ; alerte si le score est plafonné (incompatibilité avec mes enfants ou mes animaux) | S |
| A4 | En tant qu'adoptant, je veux envoyer une demande d'adoption avec un message afin de me présenter au refuge | Message de 10 à 1000 caractères ; une seule demande en cours par animal ; impossible pour un animal réservé ou adopté | M |
| A5 | En tant qu'adoptant, je veux suivre mes demandes et annuler une demande en cours afin de savoir où j'en suis | Statuts Reçue, En cours d'étude, Acceptée (« C'est un match ! »), Refusée, Annulée ; annulation après confirmation | M |

### Refuge

| N° | En tant que… je veux… afin de… | Critères d'acceptation | Priorité |
|---|---|---|---|
| R1 | En tant que membre du refuge, je veux voir tous les animaux, adoptés compris, avec leurs demandes en cours afin d'avoir une vue d'ensemble | Filtres par statut et par nom ; nombre de demandes en cours | M |
| R2 | En tant que membre du refuge, je veux ajouter et modifier un animal et ses vaccinations afin de tenir les fiches à jour | Dates cohérentes (arrivée et vaccinations après la naissance, jamais dans le futur) ; enregistrement en une seule transaction | M |
| R3 | En tant que membre du refuge, je veux réserver un animal ou le rendre disponible afin de bloquer les demandes pendant une rencontre | Un animal réservé ne reçoit plus de demandes | S |
| R4 | En tant que membre du refuge, je veux supprimer un animal saisi par erreur afin de garder une liste propre | Confirmation demandée ; refusé si l'animal a déjà reçu des demandes (historique conservé) | S |
| R5 | En tant que membre du refuge, je veux traiter les demandes (étude, acceptation, refus) afin de mener les adoptions | Accepter adopte l'animal et refuse les autres demandes en cours, dans une seule transaction ; confirmation demandée | M |

### Hors périmètre (version suivante)

Favoris, prise de rendez-vous pour une visite, dons en ligne, plusieurs photos par animal, historique des
changements de statut, notifications par e-mail, suppression du compte par l'adoptant lui-même (aujourd'hui
par e-mail, voir la page Données personnelles).

## 5. Règles de gestion

| N° | Règle |
|---|---|
| RG1 | Le score de compatibilité vaut 100 points : enfants, autres animaux, logement et temps disponible comptent 25 points chacun (détail dans `score-compatibilite.md`). |
| RG2 | Une incompatibilité avec les enfants ou les autres animaux de l'adoptant plafonne le score à 30 %. |
| RG3 | Le score est toujours calculé par le serveur, jamais reçu du navigateur. |
| RG4 | Un adoptant ne peut avoir qu'une demande en cours (reçue ou en étude) par animal. |
| RG5 | Un animal réservé ou adopté ne reçoit plus de demandes. |
| RG6 | Accepter une demande fait passer l'animal en « adopté » et refuse les autres demandes en cours pour cet animal. |
| RG7 | Un animal adopté le reste : son statut ne peut plus être modifié à la main. |
| RG8 | Un animal qui a déjà reçu une demande ne peut pas être supprimé. |
| RG9 | Le rôle « refuge » n'est jamais attribué par le site : l'inscription crée toujours un compte adoptant. |

## 6. Contraintes

| Domaine | Contrainte |
|---|---|
| Délai | 2 semaines |
| Technique | Une seule base de données (consigne du formateur) : MySQL / MariaDB, fournie par XAMPP en développement. Front React, API REST Node.js / Express |
| Graphique | Même gabarit que le projet « Trouve ton artisan » (en-tête, bannière, cartes, fiche en deux colonnes, pied de page) ; palette « Terracotta et sauge » |
| Responsive | Utilisable sur téléphone, tablette et ordinateur |
| Accessibilité | RGAA / WCAG 2.1 niveau AA : contrastes, navigation au clavier, textes alternatifs, messages d'erreur reliés aux champs |
| Sécurité | Recommandations OWASP et ANSSI ; mots de passe selon la recommandation de la CNIL |
| RGPD | Données limitées au nécessaire, durée de conservation, mentions légales et politique de confidentialité, pas de cookie de suivi |
| Éco-conception | Pas d'image lourde, polices hébergées avec le site et limitées aux caractères latins, Bootstrap importé partiellement, pages privées chargées à la demande |

## 7. Livrables

- Code source sur GitHub (API, front, scripts SQL, scripts de sauvegarde et de déploiement)
- Documentation : README, documentation de l'API (Swagger), MCD et MLD, schéma d'enchaînement des écrans,
  jeu d'essai, tests de sécurité, procédure de déploiement
- Maquettes (Figma), dossier de projet et support de présentation
