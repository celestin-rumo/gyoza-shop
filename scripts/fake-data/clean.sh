#!/usr/bin/env bash
# Wipes orders, production sessions, and slots (and the customers created by
# those orders) from the dev database, in FK-safe order. Products, packs, raw
# materials/purchases, and users are left untouched. Direct SQL is the only
# option here — there is no DELETE endpoint for orders or production sessions.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/docker-compose.dev.yml}"
DB_NAME="${DB_NAME:-gyoza}"
DB_USER="${DB_USER:-gyoza}"

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
