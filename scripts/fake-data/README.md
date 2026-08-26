# Fake data

Two scripts to populate/wipe a stack's database with realistic orders, production
sessions, and recuperation slots.

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

## Dev

Run from the repo checkout with the dev stack up (`docker compose -f
docker-compose.dev.yml up`). Both scripts default to `docker-compose.dev.yml`,
`gyoza`/`gyoza`, and the dev admin (`admin@gyoza.local`/`changeme`) — no
configuration needed.

## Staging

`deploy.yml`'s staging job copies this folder to
`/home/infra-edge/gyoza-shop-staging/scripts/fake-data/` on every deploy, right next
to `docker-compose.staging.yml` and the deploy's `.env`. Run from there (SSH onto
the host) and both scripts auto-detect the deploy directory: they pick
`docker-compose.staging.yml` and load the co-located `.env` for
`ADMIN_EMAIL`/`ADMIN_PASSWORD`/`POSTGRES_DB`/`POSTGRES_USER` automatically. Only
`API_BASE` needs to be passed by hand (there's no public URL in that `.env`):

```bash
cd /home/infra-edge/gyoza-shop-staging

./scripts/fake-data/clean.sh   # optional, for a clean slate

API_BASE=https://staging.gyoza.celestinrumo.ch node scripts/fake-data/seed.mjs
```

⚠️ Staging is a public URL — fake names/emails/amounts will be visible to anyone
who opens it. Never point either script at production.

## Config

Environment variables (all optional): `API_BASE` (default `http://localhost:8080`),
`ADMIN_EMAIL`/`ADMIN_PASSWORD`, `DAYS_BACK`/`DAYS_FORWARD` (default `60`/`14`),
`SLOT_COUNT`/`SESSION_COUNT` (default `8`/`11`), `COMPOSE_FILE`, `DB_NAME`/`DB_USER`
— set any of these explicitly to override the dev/staging auto-detection above.

`clean.sh` deletes `customer_orders`, `production_sessions`, `slot_availability`,
and the `customers` they created, in foreign-key-safe order. Products, packs, raw
materials/purchases, and users are left untouched.
