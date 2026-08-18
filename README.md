# 🥟 Gyoza Shop

Application e-commerce pour la vente de gyozas, avec un back-office d'administration (stocks, commandes, analytique).

Monorepo : frontend Angular, backend Spring Boot et base de données PostgreSQL, orchestrés avec Docker Compose.

## Stack

- **Frontend** : Angular 22 (SSR)
- **Backend** : Spring Boot 3 / Java 21
- **Base de données** : PostgreSQL
- **Infra** : Docker / Docker Compose

## Structure

```text
gyoza-shop/
├── frontend/              # Application Angular
├── backend/                # API Spring Boot
├── database/                # Image PostgreSQL
├── releases-notes/           # Notes de version
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

## Démarrage

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service    | URL                          |
| ---------- | ----------------------------- |
| Frontend   | http://localhost:4200         |
| Backend    | http://localhost:8080         |
| PostgreSQL | localhost:5432                |

Back-office admin : `/admin/login` (identifiants par défaut en dev : `admin` / `changeme`, définis dans `docker-compose.dev.yml`).

## Commandes utiles

```bash
docker compose -f docker-compose.dev.yml logs -f     # logs de tous les services
docker compose -f docker-compose.dev.yml logs -f backend   # logs d'un seul service (frontend/backend/database)
docker compose -f docker-compose.dev.yml down        # arrêter
docker compose -f docker-compose.dev.yml down -v     # arrêter + réinitialiser la base (supprime le volume Postgres)
```

### Debug

Ouvrir un shell dans un container pour inspecter son état (fichiers, versions installées, process) :

```bash
docker compose -f docker-compose.dev.yml exec backend bash    # ou sh si bash n'est pas dispo
docker compose -f docker-compose.dev.yml exec frontend sh
```

Se connecter directement à la base pour vérifier les données :

```bash
docker compose -f docker-compose.dev.yml exec database psql -U gyoza -d gyoza
```

Puis dans `psql` : `\dt` (liste des tables), `\d products` (structure d'une table), `SELECT * FROM products;`, `\q` pour quitter.

Tester un endpoint de l'API sans passer par le frontend :

```bash
curl http://localhost:8080/api/products
```

## État du projet

Voir [releases-notes/](releases-notes/) pour le détail des versions. Version actuelle : **v0.7.0** — tests automatisés et déploiement continu restent à faire avant la v1.0.0.
