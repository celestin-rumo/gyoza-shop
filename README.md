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

Back-office admin : `/login` (identifiants par défaut en dev : `admin@gyoza.local` / `changeme`, définis dans `docker-compose.dev.yml`). Même page de connexion que les clients — l'admin est un compte comme un autre, juste avec le rôle `ADMIN`.

### Emails en local

En dev, aucun email n'est réellement envoyé : `MAIL_PROVIDER` n'est pas défini dans `docker-compose.dev.yml`, donc le backend utilise le fallback `log` (`LoggingMailService`) qui écrit le lien (vérification de compte, réinitialisation de mot de passe) dans les logs au lieu de passer par Resend.

```bash
docker compose -f docker-compose.dev.yml logs backend | grep "mail:log"
```

Copie l'URL affichée (`http://localhost:4200/verify-email?token=...` ou `/reset-password?token=...`) directement dans le navigateur.

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

## Tests

Trois niveaux, du plus rapide au plus complet — tous tournent en CI (`.github/workflows/build-and-push.yml`) : unitaire + intégration bloquent le build des images, e2e bloque le tag/release/déploiement.

| Niveau      | Backend (`backend/`)                          | Frontend (`frontend/`)                                        |
| ----------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Unitaire    | `mvn test` — classes `*Test.java` (Mockito, pas de Spring/DB) | `npm run test:unit` — `*.spec.ts`                                |
| Intégration | `mvn verify` — classes `*IT.java` (contexte Spring complet + Postgres via Testcontainers) | `npm run test:integration` — `*.integration.spec.ts` (page + services réels, réseau simulé) |

`mvn verify` nécessite Docker (Testcontainers y démarre un vrai Postgres). `npm test` lance l'ensemble (unitaire + intégration) en local.

### End-to-end

Playwright, dans [e2e/](e2e/), contre une stack complète et jetable (`docker-compose.e2e.yml` : frontend + backend construits depuis `Dockerfile.prod`, Postgres, un Traefik minimal reproduisant le routing de prod).

```bash
docker compose -f docker-compose.e2e.yml up -d --build
cd e2e && npm ci && npx playwright install --with-deps chromium && npm test
docker compose -f docker-compose.e2e.yml down -v   # à la fin
```

## État du projet

Voir [releases-notes/](./releases-notes) pour le détail des versions.

**Version stable (`main`) : v1.2.0**  
La branche `main` contient la dernière version stable du projet, avec le socle e-commerce, la gestion des comptes clients et administrateurs, ainsi que la CI/CD et les tests automatisés.

**Version en développement (`dev`) : v2.0.1**  
Les prochaines fonctionnalités et évolutions du projet sont développées et validées sur la branche `dev` avant leur intégration dans `main`.
