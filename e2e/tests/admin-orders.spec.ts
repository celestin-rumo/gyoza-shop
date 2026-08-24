import { APIRequestContext, expect, test } from '@playwright/test';

const ADMIN_EMAIL = 'admin@e2e.local';
const ADMIN_PASSWORD = 'e2e-admin-password';

async function fetchCsrfToken(request: APIRequestContext): Promise<string> {
  await request.get('/api/products');
  const { cookies } = await request.storageState();
  const csrfCookie = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN');
  return decodeURIComponent(csrfCookie!.value);
}

test('an unauthenticated visitor is redirected to the login page', async ({ page }) => {
  await page.goto('/admin/orders');

  await expect(page).toHaveURL(/\/login$/);
});

test('an admin can log in, adjust stock, and move an order forward', async ({ page, request }) => {
  // Log in as admin through the API context first: creating an open slot below
  // requires an admin session, and the browser-side login further down exercises
  // the real login form independently (a separate session/cookie jar).
  const csrfForLogin = await fetchCsrfToken(request);
  const loginResponse = await request.post('/api/auth/login', {
    headers: { 'X-XSRF-TOKEN': csrfForLogin },
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(loginResponse.ok()).toBe(true);

  // Seed an open delivery slot for a fixed future date — the order below needs one to exist.
  // The slot itself now carries its content type directly.
  const slotDate = '2027-06-01';
  const csrfForSlot = await fetchCsrfToken(request);
  const slotResponse = await request.post('/api/admin/slots', {
    headers: { 'X-XSRF-TOKEN': csrfForSlot },
    data: {
      date: slotDate,
      fulfillmentMethod: 'DELIVERY',
      startTime: '18:00',
      endTime: '20:00',
      contentType: 'FROZEN',
    },
  });
  expect(slotResponse.ok()).toBe(true);

  const products = await (await request.get('/api/products')).json();
  const chicken = products.find((product: { name: string }) => product.name === 'Chicken');
  const sixPack = chicken.packs.find((pack: { count?: number; size?: number }) =>
    'size' in pack ? pack.size === 6 : pack.count === 6,
  );

  // Seed one order directly through the API: the admin journey below only needs
  // *an* order to act on, not one placed through the storefront UI.
  const csrfForOrder = await fetchCsrfToken(request);
  const orderResponse = await request.post('/api/orders', {
    headers: {
      'X-XSRF-TOKEN': csrfForOrder,
    },
    data: {
      customer: {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        address: '2 avenue du Test, Lausanne',
      },
      lines: [{ packId: sixPack.id, quantity: 1 }],
      fulfillmentMethod: 'DELIVERY',
      date: slotDate,
      startTime: '18:00',
      endTime: '20:00',
      contentType: 'FROZEN',
    },
  });
  expect(orderResponse.ok()).toBe(true);
  const order = await orderResponse.json();

  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/stocks');
  const chickenRow = page.locator('.admin-product', { hasText: 'Chicken' });
  const stockBefore = Number((await chickenRow.locator('.admin-product__stock').innerText()).match(/\d+/)![0]);

  await chickenRow.getByRole('button', { name: '+50' }).click();
  await expect(chickenRow.locator('.admin-product__stock')).toHaveText(`Stock : ${stockBefore + 50}`);

  await page.goto('/admin/orders');
  const orderRow = page.locator('.admin-order', { hasText: `Commande #${order.id}` });
  await expect(orderRow).toBeVisible();

  await orderRow.getByRole('button', { name: `Commande #${order.id}` }).click();
  await orderRow.getByRole('button', { name: 'En préparation' }).click();

  await expect(orderRow.locator('.admin-order__badge')).toHaveText('En préparation');
});
