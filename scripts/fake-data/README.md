# Fake data (dev only)

Two scripts to populate/wipe the **dev** stack's database (`docker-compose.dev.yml`):

```bash
# 1. Clean up previous data (orders, sessions, slots, customers)
./scripts/fake-data/clean.sh

# 2. Regenerate realistic data through the API (respects every business invariant:
#    frozen costs, stock allocation, slot matching, etc.)
node scripts/fake-data/seed.mjs
```

`seed.mjs` creates, in order: raw materials + one reference purchase for each,
recuperation slots (delivery + pickup, fresh + frozen — 8 slots by default over
2 spread-out days) across a window of 60 days back and 14 days forward, 11
production sessions spread over the period, then orders on the days a slot exists.

Optional config (environment variables): `API_BASE` (default
`http://localhost:8080`), `ADMIN_EMAIL`/`ADMIN_PASSWORD` (default the ones from
`docker-compose.dev.yml`), `DAYS_BACK`/`DAYS_FORWARD` (default `60`/`14`),
`SLOT_COUNT`/`SESSION_COUNT` (default `8`/`11`).

`clean.sh` deletes `customer_orders`, `production_sessions`, `slot_availability`,
and the `customers` they created, in foreign-key-safe order. Products, packs,
raw materials/purchases, and users are left untouched. Requires the dev stack
to be running (`docker compose -f docker-compose.dev.yml up`).

⚠️ Both scripts target the dev stack — never point them at staging/prod.
