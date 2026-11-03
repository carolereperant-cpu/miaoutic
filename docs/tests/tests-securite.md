# Tests de sécurité

Référentiels utilisés :

- **OWASP Top 10 (2021)** : les dix risques les plus fréquents des applications web ;
- **OWASP Web Security Testing Guide (WSTG)** : guide de tests reconnu, dont les identifiants
  (`WSTG-…`) sont repris ci-dessous ;
- **Recommandations de l'ANSSI** pour la sécurisation d'un site web (en-têtes HTTP, TLS) ;
- **Recommandation de la CNIL** sur les mots de passe (délibération 2022-100).

Deux sortes de tests :

- **automatiques** : relancés à chaque modification (`npm test` dans `api/` et `frontend/`, et GitHub
  Actions à chaque envoi sur GitHub). Les tests de sécurité commencent par `SECURITY` ;
- **manuels** : requêtes envoyées à l'API avec `curl` et parcours dans un navigateur, sur la version de
  production (Nginx + HTTPS + PM2) installée sur une machine de test le 3 novembre 2026.

## 1. Synthèse par risque OWASP Top 10

| Risque OWASP | Protection dans Miaoutic | Tests automatiques | Résultat |
|---|---|---|---|
| **A01 Contrôle d'accès défaillant** | Rôle vérifié par l'API sur chaque route (`authorize`), identifiant de l'utilisateur lu dans le jeton et jamais dans la requête, demande d'un autre adoptant introuvable (404) | `authMiddleware.test.js`, `profil-demandes.test.js` (403 croisés adoptant / refuge, identifiant pris dans le jeton), `DemandeService.test.js` (« 404 for the request of someone else ») | Conforme |
| **A02 Défaillances cryptographiques** | Mots de passe hachés avec bcrypt (coût 12, sel aléatoire), jeton JWT signé HS256 avec une clé de 32 caractères minimum, HTTPS obligatoire en production (HSTS) | `AuthService.test.js` (hash jamais égal au mot de passe, deux hash différents pour un même mot de passe) | Conforme |
| **A03 Injection** (SQL, XSS) | Requêtes préparées `mysql2` (`?`), caractères `%` et `_` échappés dans `LIKE`, entrées validées (`express-validator`), React échappe tout texte affiché, CSP stricte | `AnimalModel.test.js` (injection SQL envoyée comme valeur), `auth.test.js` (HTML refusé dans un nom), `EspaceRefuge.test.jsx` (HTML d'un message affiché comme du texte, adresse `javascript:` refusée) | Conforme |
| **A04 Conception non sécurisée** | Score de compatibilité calculé par le serveur, statut et identifiant ignorés dans le corps des requêtes, machine à états des demandes, transaction et verrou pour l'adoption | `profil-demandes.test.js` (score envoyé ignoré), `animaux-gestion.test.js` (statut et id ignorés), `DemandeService.test.js` (transaction, rollback, concurrence) | Conforme |
| **A05 Mauvaise configuration** | Helmet (en-têtes), CORS limité au front, `X-Powered-By` retiré, erreurs sans détail technique, corps JSON limité à 10 ko, `server_tokens off` dans Nginx | `animaux.test.js` (en-têtes Helmet, erreur 500 sans détail) | Conforme |
| **A06 Composants vulnérables** | `npm audit --omit=dev` dans GitHub Actions, versions figées par `package-lock.json` | `ci.yml` | 0 vulnérabilité (API et front) |
| **A07 Identification et authentification** | Mot de passe de 12 caractères minimum (CNIL), même message et même durée de réponse que l'email existe ou non, blocage après 10 échecs en 15 minutes, jeton de 2 h | `AuthService.test.js` (message unique, bcrypt exécuté même pour un email inconnu, jeton modifié, non signé `alg: none` ou expiré refusé), `auth.bruteforce.test.js` (429) | Conforme |
| **A08 Intégrité des données** | Rôle jamais lu à l'inscription, contraintes `CHECK`, clés étrangères et index unique en base | `auth.test.js` (« a "role" field sent by the user is ignored ») | Conforme |
| **A09 Journalisation** | Erreurs inattendues journalisées côté serveur (`pm2 logs`), jamais envoyées au client | `animaux.test.js` | Conforme (journalisation simple) |
| **A10 SSRF** | L'API n'appelle aucune adresse fournie par l'utilisateur ; l'adresse de la photo n'est jamais téléchargée par le serveur, seulement affichée par le navigateur | — | Non concerné |

## 2. Tests manuels sur la version de production

| Test (WSTG) | Requête envoyée | Attendu | Obtenu |
|---|---|---|---|
| Accès à la demande d'un autre adoptant (WSTG-ATHZ-04, IDOR) | Léa : `PATCH /api/demandes/4/annulation` (demande de Thomas) | 404, rien n'est modifié | 404 « Demande introuvable. » |
| Adoptant sur une route du refuge (WSTG-ATHZ-02) | Léa : `GET /api/demandes` | 403 | 403 |
| Route protégée sans jeton (WSTG-ATHN-04) | `GET /api/profil` | 401 | 401 « Authentification requise. » |
| Choix du rôle à l'inscription (WSTG-BUSL-02) | `POST /api/auth/inscription` avec `"role": "refuge"` | Compte créé en adoptant | 201, `"role": "adoptant"` |
| Injection SQL (WSTG-INPV-05) | `GET /api/animaux?nom=' OR 1=1 -- ` | Aucun animal (texte cherché tel quel) | 200, `[]` |
| Identifiant non numérique (WSTG-INPV-05) | `GET /api/animaux/1 OR 1=1` | 400 | 400 « L'identifiant de l'animal est invalide. » |
| XSS stocké (WSTG-INPV-02) | Demande avec le message `<script>alert(1)</script> bonjour` puis affichage dans l'espace refuge | Texte affiché tel quel, aucun script exécuté | Conforme, aucune violation CSP |
| Contournement de la limite de connexions (WSTG-ATHN-03) | 11 mauvais mots de passe, chacun avec un faux en-tête `X-Forwarded-For` différent | Blocage au 11ᵉ essai | 10 × 401 puis 429 |
| Corps de requête trop gros (WSTG-INPV) | 20 ko envoyés sur `/api/auth/connexion` | Refus | 413 |
| CORS depuis un autre site (WSTG-CLNT-07) | `Origin: https://pirate.example` | Pas d'autorisation pour ce site | `Access-Control-Allow-Origin` reste l'adresse du front |
| HTTP en clair (WSTG-CRYP-03) | `http://…/animal/1` | Redirection HTTPS | 301 vers `https://…/animal/1` |
| En-têtes de sécurité (WSTG-CONF-07, ANSSI) | `curl -I https://…/` | CSP, HSTS, `nosniff`, `Referrer-Policy` | Tous présents |
| API non exposée (WSTG-CONF-01) | `ss -ltn` sur le serveur (`HOST=127.0.0.1`) | L'API n'écoute que sur le serveur lui-même | `127.0.0.1:3000` uniquement |
| Compte de sauvegarde | `DELETE FROM animal` avec `miaoutic_backup` | Refus | ERROR 1142 « DELETE command denied » |
| Base hébergée sans chiffrement (WSTG-CRYP-03) | Connexion de `miaoutic_app` sans TLS (MySQL 8, compte `REQUIRE SSL`) | Refus | `ER_ACCESS_DENIED_ERROR` |
| Faux serveur de base de données | Connexion avec un autre certificat d'autorité que celui du serveur | Refus | `HANDSHAKE_SSL_ERROR` |
| Chiffrement de la connexion de l'API | `performance_schema` de MySQL pendant que l'API tourne | Connexion chiffrée | TLS 1.3 |

## 3. Vulnérabilités trouvées pendant le projet et corrections

| Problème trouvé | Risque | Correction |
|---|---|---|
| Les erreurs de saisie à l'inscription comptaient dans la limite des connexions | Un utilisateur maladroit se retrouvait bloqué | Une limite séparée par route, qui ne compte que les échecs (`skipSuccessfulRequests`) |
| Derrière Nginx, tous les visiteurs auraient eu l'adresse IP du proxy | Une seule personne bloquait tout le monde, ou la limite ne servait à rien | `TRUST_PROXY=1` : l'API lit la vraie adresse transmise par Nginx (test du faux `X-Forwarded-For` ci-dessus) |
| Un `#` dans le mot de passe du fichier d'options MySQL était lu comme un commentaire | Sauvegarde impossible avec un mot de passe fort | Mot de passe entre guillemets, documenté dans `compte-sauvegarde.sql` |
| Le jeu d'essai (comptes au mot de passe public) et les espèces étaient dans le même script | Risque d'installer des comptes de test en production | Séparation en `03_referentiel.sql` (tous les environnements) et `04_jeu_essai.sql` (jamais en production) |
| `@apidevtools/swagger-parser` 13 ne fonctionnait plus avec Jest | Test de la documentation impossible | Version 10, compatible CommonJS |
| Sur MySQL 8 (base d'Aiven), supprimer un animal qui a des demandes renvoyait une erreur 500 au lieu de 409 : avec un compte aux droits limités, MySQL 8 envoie un code d'erreur court (`ER_ROW_IS_REFERENCED`), différent de celui de MariaDB (`ER_ROW_IS_REFERENCED_2`) | Erreur technique affichée, message inutile pour le refuge | Les deux codes sont reconnus (et de même pour `ER_NO_REFERENCED_ROW`), tests unitaires pour chacun ; tous les parcours relancés sur MySQL 8 |
| La base hébergée est sur Internet : sans chiffrement, le mot de passe et les données circuleraient en clair entre Render et Aiven | Interception (homme du milieu) | Connexion TLS avec vérification du certificat d'Aiven (`DB_SSL_CA_FILE`), compte `REQUIRE SSL` |
