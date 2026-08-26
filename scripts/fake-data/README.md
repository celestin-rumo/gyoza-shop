# Fake data (dev only)

Deux scripts pour peupler/nettoyer la base du stack **dev** (`docker-compose.dev.yml`) :

```bash
# 1. Nettoyer les données précédentes (commandes, sessions, créneaux, clients)
./scripts/fake-data/clean.sh

# 2. Régénérer des données réalistes via l'API (respecte tous les invariants métier :
#    coûts figés, allocation de stock, matching des créneaux, etc.)
node scripts/fake-data/seed.mjs
```

`seed.mjs` crée, dans l'ordre : des matières premières + un achat de référence pour
chacune, des créneaux de récupération (livraison + retrait, frais + surgelé) sur
60 jours passés et 14 jours à venir, des sessions de production, puis des commandes
réparties sur la période.

Config optionnelle (variables d'environnement) : `API_BASE` (défaut
`http://localhost:8080`), `ADMIN_EMAIL`/`ADMIN_PASSWORD` (défauts ceux de
`docker-compose.dev.yml`), `DAYS_BACK`/`DAYS_FORWARD` (défauts `60`/`14`).

`clean.sh` supprime `customer_orders`, `production_sessions`, `slot_availability`
et les `customers` associés, en respectant les contraintes de clés étrangères.
Produits, packs, matières premières/achats et utilisateurs ne sont pas touchés.
Nécessite le stack dev démarré (`docker compose -f docker-compose.dev.yml up`).

⚠️ Ces deux scripts ciblent le stack dev — ne jamais les pointer sur staging/prod.
