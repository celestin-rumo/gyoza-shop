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
  await page.goto('/admin/slots');

  await expect(page).toHaveURL(/\/login$/);
});

test('an admin can start editing a slot and save the changes', async ({ page, request }) => {
  // Seed a slot directly through the API — the admin journey below only needs
  // *a* slot to edit, not one created through the storefront UI.
  const csrfForLogin = await fetchCsrfToken(request);
  const loginResponse = await request.post('/api/auth/login', {
    headers: { 'X-XSRF-TOKEN': csrfForLogin },
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(loginResponse.ok()).toBe(true);

  // Deliberately picked to not collide with DataInitializer's default seed data
  // (DELIVERY 18:00–20:00 and PICKUP 10:00–12:00, seeded for both content types) —
  // reusing one of those exact combinations makes list locators ambiguous.
  const slotDate = '2027-07-01';
  const csrfForSlot = await fetchCsrfToken(request);
  const slotResponse = await request.post('/api/admin/slots', {
    headers: { 'X-XSRF-TOKEN': csrfForSlot },
    data: {
      date: slotDate,
      fulfillmentMethod: 'PICKUP',
      startTime: '08:00',
      endTime: '09:00',
      contentType: 'FROZEN',
    },
  });
  expect(slotResponse.ok()).toBe(true);

  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/slots');

  const slotRow = page.locator('.admin-slots__list-item', { hasText: '08h00–09h00' });
  await expect(slotRow).toBeVisible();

  await slotRow.getByRole('button', { name: 'Modifier' }).click();

  // The form prefills with the existing slot's values.
  await expect(page.getByRole('heading', { name: 'Modifier le créneau' })).toBeVisible();
  await expect(page.locator('#slotDate')).toHaveValue(slotDate);
  await expect(page.locator('#slotStartTime')).toHaveValue('08:00');
  await expect(page.locator('#slotEndTime')).toHaveValue('09:00');

  await page.locator('#slotStartTime').fill('14:00');
  await page.locator('#slotEndTime').fill('16:00');
  await page.getByRole('radio', { name: 'Livraison' }).click();

  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();

  // The form resets to its "create" state and the row reflects the new values.
  await expect(page.getByRole('heading', { name: 'Nouveau créneau' })).toBeVisible();
  const updatedRow = page.locator('.admin-slots__list-item', { hasText: '14h00–16h00' });
  await expect(updatedRow).toBeVisible();
  await expect(updatedRow).toContainText('Livraison');
  await expect(page.locator('.admin-slots__list-item', { hasText: '08h00–09h00' })).toHaveCount(0);
});
