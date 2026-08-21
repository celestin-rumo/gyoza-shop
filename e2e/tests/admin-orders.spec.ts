import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = 'admin@e2e.local';
const ADMIN_PASSWORD = 'e2e-admin-password';

test('an unauthenticated visitor is redirected to the login page', async ({ page }) => {
  await page.goto('/admin/orders');

  await expect(page).toHaveURL(/\/login$/);
});

test('an admin can log in, adjust stock, and move an order forward', async ({ page, request }) => {
  const products = await (await request.get('/api/products')).json();
  const chicken = products.find((product: { name: string }) => product.name === 'Chicken');
  const sixPack = chicken.packs.find((pack: { count?: number; size?: number }) =>
    'size' in pack ? pack.size === 6 : pack.count === 6,
  );

  // The security rewrite made every mutating request go through the same
  // double-submit CSRF check the storefront's Angular HttpClient satisfies
  // automatically. A raw API call has to relay it by hand: read the
  // XSRF-TOKEN cookie the GET above caused the backend to set, and send it
  // back as the X-XSRF-TOKEN header.
  const { cookies } = await request.storageState();
  const csrfCookie = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN');

  // Seed one order directly through the API: the admin journey below only needs
  // *an* order to act on, not one placed through the storefront UI.
  const orderResponse = await request.post('/api/orders', {
    headers: {
      'X-XSRF-TOKEN': decodeURIComponent(csrfCookie!.value),
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
      slot: 'MARDI_18H_20H',
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
