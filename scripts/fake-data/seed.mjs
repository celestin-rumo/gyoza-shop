#!/usr/bin/env node
// Populates a local dev backend with fake data through the real REST API (not
// direct SQL), so every business invariant (frozen raw-material unit costs,
// batch numbers, slot matching, stock allocation...) is respected exactly as
// if a real admin/customer had done it. Run against docker-compose.dev.yml.
//
// Usage: node scripts/fake-data/seed.mjs
// Config (env vars, all optional): API_BASE, ADMIN_EMAIL, ADMIN_PASSWORD,
// DAYS_BACK, DAYS_FORWARD, SLOT_COUNT, SESSION_COUNT, CUSTOMER_COUNT, ORDER_COUNT.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');

// A deploy directory (e.g. staging, copied there by deploy.yml's "Sync fake-data
// scripts" step) only has its own compose file, not the full repo's — used both to
// pick the right compose file below and to gate loading a co-located .env (the git
// checkout may have an unrelated stray .env at its root; only trust one that sits
// next to a deploy-only compose file).
const IS_DEPLOY_DIR = !existsSync(path.join(REPO_ROOT, 'docker-compose.dev.yml'));

const ENV_FILE = path.join(REPO_ROOT, '.env');
if (IS_DEPLOY_DIR && existsSync(ENV_FILE) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(ENV_FILE);
}

const API_BASE = process.env.API_BASE ?? 'http://localhost:8080';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@gyoza.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'changeme';
// Production sessions look back this far (they're historical work, already done).
const DAYS_BACK = Number(process.env.DAYS_BACK ?? 60);
// Recuperation slots always look forward this far (~2 months) — they're future
// availability windows to book, never in the past.
const DAYS_FORWARD = Number(process.env.DAYS_FORWARD ?? 60);
// Total slot rows created (spread over a few distinct future dates — each date gets
// every method x content-type combination below, so this should be a multiple of 4).
const SLOT_COUNT = Number(process.env.SLOT_COUNT ?? 8);
const SESSION_COUNT = Number(process.env.SESSION_COUNT ?? 11);
const CUSTOMER_COUNT = Number(process.env.CUSTOMER_COUNT ?? 23);
const ORDER_COUNT = Number(process.env.ORDER_COUNT ?? 47);

const COMPOSE_FILE =
  process.env.COMPOSE_FILE ??
  (IS_DEPLOY_DIR ? path.join(REPO_ROOT, 'docker-compose.staging.yml') : path.join(REPO_ROOT, 'docker-compose.dev.yml'));
// docker-compose.{dev,staging}.yml both name these POSTGRES_DB/POSTGRES_USER — the
// same .env loaded above already uses those names, so no separate DB_NAME/DB_USER
// entries are needed there.
const DB_NAME = process.env.DB_NAME ?? process.env.POSTGRES_DB ?? 'gyoza';
const DB_USER = process.env.DB_USER ?? process.env.POSTGRES_USER ?? 'gyoza';

// A fixed recipe: every session uses these four base ingredients, plus whichever
// flavor-specific one matches its output (Poulet for Chicken, Légumes for Vegetable).
// "gingembre frais" matches the name/unit of a raw material already seeded by hand in
// some environments — reused instead of creating a near-duplicate.
const RAW_MATERIALS = {
  farine: { name: 'Farine de blé', unit: 'kg' },
  poulet: { name: 'Poulet', unit: 'kg' },
  legumes: { name: 'Légumes mélangés', unit: 'kg' },
  huileSesame: { name: 'Huile de sésame', unit: 'L' },
  gingembre: { name: 'gingembre frais', unit: 'grammes' },
  ciboulette: { name: 'Ciboulette', unit: 'grammes' },
};

// "Créneaux de récupération" — both fulfillment methods, both content types,
// mirroring the pattern DataInitializer already seeds for a single day.
const SLOT_WINDOWS = [
  { fulfillmentMethod: 'DELIVERY', startTime: '18:00', endTime: '20:00' },
  { fulfillmentMethod: 'PICKUP', startTime: '10:00', endTime: '12:00' },
];
const CONTENT_TYPES = ['FRESH', 'FROZEN'];

const FIRST_NAMES = ['Marie', 'Jean', 'Sophie', 'Luc', 'Claire', 'Thomas', 'Julie', 'Nicolas'];
const LAST_NAMES = ['Martin', 'Dupont', 'Bernard', 'Rochat', 'Favre', 'Perrin', 'Moser'];

// --- tiny cookie jar (session cookie + CSRF double-submit), same dance the frontend does ---

const jar = new Map();

function updateJar(res) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const pair = raw.split(';')[0];
    const separator = pair.indexOf('=');
    jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }
}

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json', Cookie: cookieHeader() };
  const csrf = jar.get('XSRF-TOKEN');
  if (csrf && method !== 'GET') {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  updateJar(res);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }

  return res.headers.get('content-type')?.includes('application/json') ? res.json() : null;
}

function cookieHeader() {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

// --- helpers ---

function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** `count` day-offsets spread evenly across [min, max] (inclusive), as distinct integers. */
function evenlySpacedOffsets(count, min, max) {
  if (count <= 1) {
    return [max];
  }

  const offsets = new Set();
  for (let i = 0; i < count; i++) {
    offsets.add(Math.round(min + (i * (max - min)) / (count - 1)));
  }
  return [...offsets];
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// --- seeding steps ---

async function login() {
  await api('GET', '/api/products'); // primes the XSRF-TOKEN cookie
  await api('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  console.log(`Connecté en tant que ${ADMIN_EMAIL}`);
}

async function ensureRawMaterials() {
  const existing = await api('GET', '/api/admin/raw-materials');
  // Case-insensitive: the backend rejects a create as a duplicate the same way
  // (e.g. an existing "gingembre frais" blocks creating "Gingembre Frais").
  const byName = new Map(existing.map((material) => [material.name.trim().toLowerCase(), material]));

  const materials = {};
  let created = 0;

  for (const [key, definition] of Object.entries(RAW_MATERIALS)) {
    const lookupKey = definition.name.toLowerCase();
    let material = byName.get(lookupKey);
    if (!material) {
      material = await api('POST', '/api/admin/raw-materials', definition);
      byName.set(lookupKey, material);
      created++;
    }
    materials[key] = material;
  }

  console.log(`  + ${created} matière(s) première(s) créée(s) (${Object.keys(materials).length} au total)`);
  return materials;
}

// A bulk purchase batch sized to the unit — 20 (kg or L) is a normal restock, but
// 20 grammes of chives/ginger is a tiny reference batch that inflates the implied
// unit price to absurd levels once a session uses 200g of it.
const PURCHASE_QUANTITY_BY_UNIT = { kg: 20, L: 5, grammes: 1000 };

async function ensurePurchases(materials) {
  const existingPurchases = await api('GET', '/api/admin/raw-material-purchases');
  const alreadyPurchased = new Set(existingPurchases.map((purchase) => purchase.rawMaterialId));

  let created = 0;
  for (const material of Object.values(materials)) {
    if (alreadyPurchased.has(material.id)) {
      continue;
    }

    await api('POST', '/api/admin/raw-material-purchases', {
      rawMaterialId: material.id,
      date: isoDate(daysAgo(DAYS_BACK + 30)),
      quantityPurchased: PURCHASE_QUANTITY_BY_UNIT[material.unit] ?? 20,
      totalPricePaid: randomInt(20, 80),
      source: 'MANUAL',
      originCountry: 'Suisse',
      store: 'Grossiste local (fake data)',
    });
    created++;
  }

  console.log(`  + ${created} achat(s) créé(s) (prix de référence pour le calcul de coût)`);
}

async function seedSlots() {
  const combosPerDate = SLOT_WINDOWS.length * CONTENT_TYPES.length;
  const dateCount = Math.max(1, Math.round(SLOT_COUNT / combosPerDate));
  // Always in the future (tomorrow through DAYS_FORWARD) — these are booking
  // windows, never a slot for a day that's already passed.
  const offsets = evenlySpacedOffsets(dateCount, -DAYS_FORWARD, -1);

  const slots = [];
  let created = 0;

  for (const offset of offsets) {
    const date = isoDate(daysAgo(offset));

    for (const window of SLOT_WINDOWS) {
      for (const contentType of CONTENT_TYPES) {
        try {
          const slot = await api('POST', '/api/admin/slots', { date, contentType, ...window });
          slots.push(slot);
          created++;
        } catch {
          // Already exists (DataInitializer's seeded day, or a previous run) — skip it.
        }
      }
    }
  }

  console.log(`  + ${created} créneau(x) créé(s) sur ${offsets.length} jour(s) futur(s) (${slots.length} disponibles pour les commandes)`);
  return slots;
}

async function getAdminUserId() {
  const admins = await api('GET', '/api/admin/users?role=ADMIN');
  if (admins.length === 0) {
    throw new Error('Aucun utilisateur ADMIN trouvé pour participer aux sessions.');
  }
  return admins[0].id;
}

async function seedProductionSessions(materials, products, participantUserId) {
  const chicken = products.find((product) => product.name === 'Chicken') ?? products[0];
  const vegetable = products.find((product) => product.name === 'Vegetable') ?? products[0];

  const offsets = evenlySpacedOffsets(SESSION_COUNT, 1, DAYS_BACK);
  let created = 0;

  for (const offset of offsets) {
    const date = isoDate(daysAgo(offset));
    const isChicken = Math.random() < 0.5;
    const product = isChicken ? chicken : vegetable;
    // "au moins 1 kilo" — a bit over 1kg, never under.
    const flourQuantity = Math.round((1 + Math.random() * 0.5) * 100) / 100;

    const rawMaterialUsages = [
      { rawMaterialId: materials.farine.id, quantityUsed: flourQuantity, targetProductId: null },
      { rawMaterialId: materials.huileSesame.id, quantityUsed: 0.2, targetProductId: null }, // 2 dl
      { rawMaterialId: materials.gingembre.id, quantityUsed: 0.4, targetProductId: null },
      { rawMaterialId: materials.ciboulette.id, quantityUsed: 200, targetProductId: null },
      isChicken
        ? { rawMaterialId: materials.poulet.id, quantityUsed: 1.5, targetProductId: null }
        : { rawMaterialId: materials.legumes.id, quantityUsed: 1.5, targetProductId: null },
    ];

    try {
      await api('POST', '/api/admin/production-sessions', {
        date,
        durationHours: randomInt(2, 6),
        notes: 'Session générée automatiquement (fake data)',
        otherCosts: 0,
        rawMaterialUsages,
        participants: [{ userId: participantUserId }],
        outputs: [{ productId: product.id, quantityProduced: randomInt(40, 120) }],
      });
      created++;
    } catch (error) {
      console.warn(`  ! session du ${date} ignorée : ${error.message}`);
    }
  }

  console.log(`  + ${created} session(s) de production créée(s)`);
}

function buildCustomerPool(count) {
  const pool = [];
  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    pool.push({
      firstName,
      lastName,
      email: `${firstName}.${lastName}.${Date.now()}.${i}@example.com`.toLowerCase(),
    });
  }
  return pool;
}

/** Every customer gets at least one order, then the rest are handed out at random —
 *  "plusieurs commandes des fois par client" without forcing an even split. */
function buildCustomerAssignments(orderCount, customerCount) {
  const boundedCustomerCount = Math.max(1, Math.min(customerCount, orderCount));
  const assignments = [];

  for (let c = 0; c < boundedCustomerCount; c++) {
    assignments.push(c);
  }
  while (assignments.length < orderCount) {
    assignments.push(randomInt(0, boundedCustomerCount - 1));
  }

  return shuffle(assignments);
}

async function seedOrders(slots, products) {
  if (slots.length === 0) {
    console.warn('  ! aucun créneau disponible, aucune commande créée');
    return;
  }

  const customers = buildCustomerPool(CUSTOMER_COUNT);
  const assignments = buildCustomerAssignments(ORDER_COUNT, customers.length);

  let created = 0;
  // Analytics groups revenue/customers by createdAt, which the API always stamps to
  // "now" (see Order/Customer constructors) — backdated afterward, independently of
  // the order's (future) fulfillment slot, so a fake order looks like it was placed
  // in the past for a future pickup/delivery, same as a real one would be.
  const orderRecords = []; // { orderId, email, createdAt }

  for (let i = 0; i < assignments.length; i++) {
    const slot = pick(slots);
    const customer = customers[assignments[i]];
    const product = pick(products.filter((candidate) => candidate.packs.length > 0));
    const pack = pick(product.packs);
    const createdAt = `${isoDate(daysAgo(randomInt(0, DAYS_BACK)))} 12:00:00`;

    try {
      const order = await api('POST', '/api/orders', {
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          address: slot.fulfillmentMethod === 'DELIVERY' ? '1 rue du Test, Lausanne' : '',
        },
        lines: [{ packId: pack.id, quantity: randomInt(1, 3) }],
        fulfillmentMethod: slot.fulfillmentMethod,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        contentType: slot.contentType,
      });
      created++;
      orderRecords.push({ orderId: order.id, email: customer.email, createdAt });
    } catch (error) {
      console.warn(`  ! commande ignorée : ${error.message}`);
    }
  }

  console.log(`  + ${created} commande(s) créée(s) pour ${customers.length} client(s)`);
  consolidateCustomersAndBackdate(orderRecords);
}

/**
 * The API always inserts a fresh Customer row per order (no lookup/reuse by email —
 * see OrderServiceImpl.createOrder), so N orders "for the same fake customer" still
 * produce N separate rows sharing that email. This merges each email's rows down to
 * one (repointing its orders, deleting the rest) and backdates createdAt, all in one
 * transaction — the only way to get both right, since neither is exposed by the API.
 */
function consolidateCustomersAndBackdate(orderRecords) {
  if (orderRecords.length === 0) {
    return;
  }

  const groups = new Map(); // email -> [{ orderId, createdAt }, ...]
  for (const record of orderRecords) {
    const list = groups.get(record.email) ?? [];
    list.push(record);
    groups.set(record.email, list);
  }

  const escape = (value) => value.replace(/'/g, "''");
  const statements = [];

  for (const [email, records] of groups) {
    const keeper = `(SELECT MIN(id) FROM customers WHERE email = '${escape(email)}')`;
    const earliestCreatedAt = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0].createdAt;

    for (const record of records) {
      statements.push(
        `UPDATE customer_orders SET customer_id = ${keeper}, created_at = '${record.createdAt}'::timestamp WHERE id = ${record.orderId};`,
      );
    }

    statements.push(`UPDATE customers SET created_at = '${earliestCreatedAt}'::timestamp WHERE id = ${keeper};`);
    statements.push(`DELETE FROM customers WHERE email = '${escape(email)}' AND id <> ${keeper};`);
  }

  const sql = `BEGIN;\n${statements.join('\n')}\nCOMMIT;\n`;

  execFileSync(
    'docker',
    ['compose', '-f', COMPOSE_FILE, 'exec', '-T', 'database', 'psql', '-U', DB_USER, '-d', DB_NAME],
    { input: sql, stdio: ['pipe', 'inherit', 'inherit'] },
  );

  console.log(`  + consolidé en ${groups.size} client(s) distinct(s), dates de création corrigées`);
}

async function main() {
  console.log(`== Génération de fake data (${API_BASE}) ==`);

  await login();

  console.log('Matières premières...');
  const materials = await ensureRawMaterials();
  await ensurePurchases(materials);

  console.log('Créneaux (récupération : livraison + retrait, frais + surgelé, toujours dans le futur)...');
  const slots = await seedSlots();

  console.log('Produits...');
  const products = await api('GET', '/api/products');

  console.log('Sessions de production...');
  const participantUserId = await getAdminUserId();
  await seedProductionSessions(materials, products, participantUserId);

  console.log('Commandes...');
  await seedOrders(slots, products);

  console.log('Terminé.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
