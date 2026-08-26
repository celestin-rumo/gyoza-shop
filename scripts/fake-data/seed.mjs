#!/usr/bin/env node
// Populates a local dev backend with fake data through the real REST API (not
// direct SQL), so every business invariant (frozen raw-material unit costs,
// batch numbers, slot matching, stock allocation...) is respected exactly as
// if a real admin/customer had done it. Run against docker-compose.dev.yml.
//
// Usage: node scripts/fake-data/seed.mjs
// Config (env vars, all optional): API_BASE, ADMIN_EMAIL, ADMIN_PASSWORD,
// DAYS_BACK, DAYS_FORWARD, SLOT_COUNT, SESSION_COUNT.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.API_BASE ?? 'http://localhost:8080';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@gyoza.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'changeme';
const DAYS_BACK = Number(process.env.DAYS_BACK ?? 60);
const DAYS_FORWARD = Number(process.env.DAYS_FORWARD ?? 14);
// Total slot rows created (spread over a few distinct dates — each date gets every
// method x content-type combination below, so this should be a multiple of 4).
const SLOT_COUNT = Number(process.env.SLOT_COUNT ?? 8);
const SESSION_COUNT = Number(process.env.SESSION_COUNT ?? 11);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const COMPOSE_FILE = process.env.COMPOSE_FILE ?? path.join(REPO_ROOT, 'docker-compose.dev.yml');
const DB_NAME = process.env.DB_NAME ?? 'gyoza';
const DB_USER = process.env.DB_USER ?? 'gyoza';

const RAW_MATERIALS = [
  { name: 'Farine de blé', unit: 'kg' },
  { name: 'Poulet', unit: 'kg' },
  { name: 'Légumes mélangés', unit: 'kg' },
  { name: 'Huile de sésame', unit: 'L' },
  { name: 'Sauce soja', unit: 'L' },
  { name: 'Gingembre', unit: 'kg' },
];

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

// --- seeding steps ---

async function login() {
  await api('GET', '/api/products'); // primes the XSRF-TOKEN cookie
  await api('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  console.log(`Connecté en tant que ${ADMIN_EMAIL}`);
}

async function ensureRawMaterials() {
  const existing = await api('GET', '/api/admin/raw-materials');
  // Case-insensitive: the backend rejects a create as a duplicate the same way
  // (e.g. an existing "sauce soja" blocks creating "Sauce soja").
  const byName = new Map(existing.map((material) => [material.name.trim().toLowerCase(), material]));

  const materials = [];
  let created = 0;

  for (const definition of RAW_MATERIALS) {
    const key = definition.name.toLowerCase();
    let material = byName.get(key);
    if (!material) {
      material = await api('POST', '/api/admin/raw-materials', definition);
      byName.set(key, material);
      created++;
    }
    materials.push(material);
  }

  console.log(`  + ${created} matière(s) première(s) créée(s) (${materials.length} au total)`);
  return materials;
}

async function ensurePurchases(materials) {
  const existingPurchases = await api('GET', '/api/admin/raw-material-purchases');
  const alreadyPurchased = new Set(existingPurchases.map((purchase) => purchase.rawMaterialId));

  let created = 0;
  for (const material of materials) {
    if (alreadyPurchased.has(material.id)) {
      continue;
    }

    await api('POST', '/api/admin/raw-material-purchases', {
      rawMaterialId: material.id,
      date: isoDate(daysAgo(DAYS_BACK + 30)),
      quantityPurchased: 20,
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
  const offsets = evenlySpacedOffsets(dateCount, -DAYS_FORWARD, DAYS_BACK);

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

  console.log(`  + ${created} créneau(x) créé(s) sur ${offsets.length} jour(s) (${slots.length} disponibles pour les commandes)`);
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
  const offsets = evenlySpacedOffsets(SESSION_COUNT, 1, DAYS_BACK);
  let created = 0;

  for (const offset of offsets) {
    const date = isoDate(daysAgo(offset));

    try {
      await api('POST', '/api/admin/production-sessions', {
        date,
        durationHours: randomInt(2, 6),
        notes: 'Session générée automatiquement (fake data)',
        otherCosts: 0,
        rawMaterialUsages: [pick(materials), pick(materials)].map((material) => ({
          rawMaterialId: material.id,
          quantityUsed: randomInt(2, 10),
          targetProductId: null,
        })),
        participants: [{ userId: participantUserId }],
        outputs: [{ productId: pick(products).id, quantityProduced: randomInt(40, 120) }],
      });
      created++;
    } catch (error) {
      console.warn(`  ! session du ${date} ignorée : ${error.message}`);
    }
  }

  console.log(`  + ${created} session(s) de production créée(s)`);
}

async function seedOrders(slots, products) {
  const slotsByDate = new Map();
  for (const slot of slots) {
    const list = slotsByDate.get(slot.date) ?? [];
    list.push(slot);
    slotsByDate.set(slot.date, list);
  }

  let created = 0;
  // Analytics groups revenue/customers by createdAt, not the order's fulfillment
  // date — and createdAt is stamped server-side to "now" (see Order/Customer
  // constructors). Every order created here would land on the exact same day
  // otherwise, so we backdate createdAt afterward to spread them realistically.
  const backdateEntries = [];

  for (let offset = DAYS_BACK; offset >= 0; offset--) {
    const date = isoDate(daysAgo(offset));
    const daySlots = slotsByDate.get(date);
    if (!daySlots?.length) {
      continue;
    }

    for (let i = 0; i < randomInt(0, 2); i++) {
      const slot = pick(daySlots);
      const product = pick(products.filter((candidate) => candidate.packs.length > 0));
      const pack = pick(product.packs);
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const email = `${firstName}.${lastName}.${Date.now()}.${i}@example.com`.toLowerCase();

      try {
        const order = await api('POST', '/api/orders', {
          customer: {
            firstName,
            lastName,
            email,
            address: slot.fulfillmentMethod === 'DELIVERY' ? '1 rue du Test, Lausanne' : '',
          },
          lines: [{ packId: pack.id, quantity: randomInt(1, 3) }],
          fulfillmentMethod: slot.fulfillmentMethod,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          contentType: slot.contentType,
        });
        created++;
        backdateEntries.push({ orderId: order.id, email, createdAt: `${date} 12:00:00` });
      } catch (error) {
        console.warn(`  ! commande du ${date} ignorée : ${error.message}`);
      }
    }
  }

  console.log(`  + ${created} commande(s) créée(s)`);
  backdateOrders(backdateEntries);
}

function backdateOrders(entries) {
  if (entries.length === 0) {
    return;
  }

  const escape = (value) => value.replace(/'/g, "''");

  const orderValues = entries
    .map(({ orderId, createdAt }) => `(${orderId}, '${createdAt}'::timestamp)`)
    .join(',\n');
  const customerValues = entries
    .map(({ email, createdAt }) => `('${escape(email)}', '${createdAt}'::timestamp)`)
    .join(',\n');

  const sql = `
BEGIN;

UPDATE customer_orders SET created_at = v.created_at
FROM (VALUES\n${orderValues}\n) AS v(id, created_at)
WHERE customer_orders.id = v.id;

UPDATE customers SET created_at = v.created_at
FROM (VALUES\n${customerValues}\n) AS v(email, created_at)
WHERE customers.email = v.email;

COMMIT;
`;

  execFileSync(
    'docker',
    ['compose', '-f', COMPOSE_FILE, 'exec', '-T', 'database', 'psql', '-U', DB_USER, '-d', DB_NAME],
    { input: sql, stdio: ['pipe', 'inherit', 'inherit'] },
  );

  console.log(`  + dates de création corrigées pour ${entries.length} commande(s)/client(s)`);
}

async function main() {
  console.log(`== Génération de fake data (${API_BASE}) ==`);

  await login();

  console.log('Matières premières...');
  const materials = await ensureRawMaterials();
  await ensurePurchases(materials);

  console.log('Créneaux (récupération : livraison + retrait, frais + surgelé)...');
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
