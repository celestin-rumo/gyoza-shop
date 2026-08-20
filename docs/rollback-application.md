# Rollback de l'application

Annulation complète d'un déploiement (code, et éventuellement base de données), pour prod et staging.

## 1. Identifier la version à restaurer

Images Docker publiées : `ghcr.io/celestin-rumo/gyoza-frontend` et `gyoza-backend`, taguées par le workflow **Build and Push Images** (`.github/workflows/build-and-push.yml`) :

- `vX.Y.Z` — releases officielles (tag git)
- `main-<run>` — builds de la branche `main`
- `dev-<run>` — builds de la branche `dev` (déployés en continu sur staging)
- `<sha>` — commit exact
- `latest` / `staging` — dernier build `main` / dernier build `dev`

Tags disponibles : onglet **Packages** du repo GitHub, ou [releases-notes/](../releases-notes/) et les [Releases GitHub](https://github.com/celestin-rumo/gyoza-shop/releases) pour les versions officielles.

## 2. Décider si la base de données doit aussi être restaurée

Nécessaire seulement si le déploiement à annuler contenait une migration Flyway (nouveau fichier `V{N}__*.sql` dans `backend/src/main/resources/db/migration/`). Faire tourner un ancien code contre un schéma plus récent (ou l'inverse) peut casser de façon imprévisible.

- Pas de migration → passer directement à l'étape 3.
- Migration présente → restaurer le `predeploy-*.sql.gz` correspondant **avant** de redéployer l'ancienne image. Voir [rollback-database.md](rollback-database.md).

## 3. Redéployer l'ancienne image

Depuis GitHub Actions → workflow **Deploy App on Server** → **Run workflow** :

| Champ | Valeur |
|---|---|
| `image_tag` | tag identifié à l'étape 1 (ex: `v1.2.0`, `main-118`) |
| `environment` | `production` ou `staging` |

Le workflow refait un backup pre-deploy avant d'appliquer l'ancienne image, donc l'état juste avant le rollback reste récupérable.

## 4. Vérifier

- `docker compose -f <compose-file> ps` sur le serveur pour confirmer que les conteneurs sont sains.
- Ouvrir `gyoza.celestinrumo.ch` (prod) ou `staging.gyoza.celestinrumo.ch` (staging) et tester le parcours critique concerné.
- Vérifier les logs backend (`docker compose logs backend`) pour d'éventuelles erreurs Flyway/JPA si une restauration DB a eu lieu.

## Cas particuliers

- **Rollback d'une release taguée en prod** : le tag git et la GitHub Release restent en place (on ne les supprime pas) — seul le conteneur déployé change. Le tag pointe toujours vers l'ancien commit, donc pas d'incohérence historique.
- **Rollback urgent** : `image_tag=latest` redéploie le dernier build `main` réussi, utile si la dernière release taguée pose problème mais qu'un commit intermédiaire sur `main` était sain.
- **Staging cassé après un push dev** : `image_tag=staging` redéploie le dernier build `dev` réussi. Staging n'a pas de notion de "version précédente" figée comme la prod — si `staging` lui-même est cassé, redéployer un `<sha>` connu bon.
