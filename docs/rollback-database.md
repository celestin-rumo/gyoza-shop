# Rollback de la base de données

## Où sont les backups

Deux sources de dumps `pg_dump` gzippés, écrites directement sur le runner self-hosted (`infra-edge`) :

| Origine | Fréquence | Rétention | Fichiers | Chemin |
|---|---|---|---|---|
| `backup-database.yml` | quotidien, 03:00 UTC | 14 derniers | `daily-*.sql.gz` | `/home/infra-edge/gyoza-shop/backups/` (prod uniquement) |
| `deploy.yml` (job `deploy-production`) | avant chaque déploiement prod | 10 derniers | `predeploy-*.sql.gz` | `/home/infra-edge/gyoza-shop/backups/` |
| `deploy.yml` (job `deploy-staging`) | avant chaque déploiement staging | 10 derniers | `predeploy-*.sql.gz` | `/home/infra-edge/gyoza-shop-staging/backups/` |

> ⚠️ Pas de backup quotidien programmé pour staging à ce jour — seul le backup pre-deploy existe côté staging. À étendre à `backup-database.yml` si un historique plus profond est nécessaire.

## Restaurer un backup

Se connecter au serveur (`infra-edge`), puis se placer dans le dossier de l'environnement à restaurer :

- Prod : `/home/infra-edge/gyoza-shop`
- Staging : `/home/infra-edge/gyoza-shop-staging`

```bash
cd <DEPLOY_PATH>          # gyoza-shop ou gyoza-shop-staging
ls -lt backups/           # repérer le fichier à restaurer
```

**Prod :**

```bash
docker compose -f docker-compose.prod.yml exec -T database psql -U gyoza -d postgres \
  -c "DROP DATABASE gyoza;" -c "CREATE DATABASE gyoza;"

gunzip -c backups/<fichier>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T database psql -U gyoza -d gyoza
```

**Staging :**

```bash
docker compose -f docker-compose.staging.yml exec -T database psql -U gyoza_staging -d postgres \
  -c "DROP DATABASE gyoza_staging;" -c "CREATE DATABASE gyoza_staging;"

gunzip -c backups/<fichier>.sql.gz | \
  docker compose -f docker-compose.staging.yml exec -T database psql -U gyoza_staging -d gyoza_staging
```

## Points d'attention

- Le `DROP DATABASE` efface l'état actuel avant restauration — pas de retour en arrière possible une fois lancé. Faire un backup manuel juste avant si le dernier `predeploy-*`/`daily-*` date d'avant un changement important.
- Ces backups vivent sur le même disque que la base — ils protègent contre une migration ratée ou une corruption applicative, pas contre une panne totale du serveur. Une copie hors-site (autre machine, stockage objet) serait nécessaire pour ce niveau de protection.
- Après une restauration DB, vérifier que le schéma correspond à la version de code actuellement déployée (voir [rollback-application.md](rollback-application.md)) — un ancien dump restauré contre un nouveau schéma Flyway peut désynchroniser l'historique de migrations.
