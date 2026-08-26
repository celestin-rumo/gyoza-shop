#!/usr/bin/env bash
# Wipes orders, production sessions, and slots (and the customers created by
# those orders) from the dev database, in FK-safe order. Products, packs, raw
# materials/purchases, and users are left untouched. Direct SQL is the only
# option here — there is no DELETE endpoint for orders or production sessions.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# A deploy directory (e.g. staging, copied there by deploy.yml's "Sync fake-data
# scripts" step) only has its own compose file, not the full repo's — used both to
# pick the right compose file below and to gate loading a co-located .env (the git
# checkout may have an unrelated stray .env at its root; only trust one that sits
# next to a deploy-only compose file).
if [ ! -f "$REPO_ROOT/docker-compose.dev.yml" ]; then
  IS_DEPLOY_DIR=1
else
  IS_DEPLOY_DIR=0
fi

if [ "$IS_DEPLOY_DIR" = 1 ] && [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

if [ "$IS_DEPLOY_DIR" = 1 ]; then
  COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/docker-compose.staging.yml}"
else
  COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/docker-compose.dev.yml}"
fi

DB_NAME="${DB_NAME:-${POSTGRES_DB:-gyoza}}"
DB_USER="${DB_USER:-${POSTGRES_USER:-gyoza}}"

echo "Suppression des commandes / sessions de production / créneaux (base '$DB_NAME')..."

docker compose -f "$COMPOSE_FILE" exec -T database psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
BEGIN;

DELETE FROM product_output_allocations;
DELETE FROM order_items;
DELETE FROM customer_orders;
DELETE FROM customers;
DELETE FROM raw_material_usages;
DELETE FROM session_participants;
DELETE FROM product_outputs;
DELETE FROM production_sessions;
DELETE FROM slot_availability;

COMMIT;
SQL

echo "Terminé."
