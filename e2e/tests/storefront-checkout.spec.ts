import { expect, test } from '@playwright/test';

test('a customer can walk the checkout wizard and place an order', async ({ page }) => {
  await page.goto('/');

  const firstProductCard = page.locator('ds-product-card').first();
  await expect(firstProductCard).toBeVisible();

  await firstProductCard.getByRole('button', { name: 'Ajouter' }).click();

  await page.getByRole('button', { name: /Panier \(1\)/ }).click();
  await page.getByRole('button', { name: 'Confirmer la commande' }).click();

  await expect(page).toHaveURL(/\/checkout$/);

  // Step 1: Panier
  await expect(page.getByRole('heading', { name: 'Panier' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Step 2: Récupération — choosing Surgelé sidesteps the fresh-availability
  // window state, which is admin-controlled and not guaranteed open here.
  await expect(page.getByRole('heading', { name: 'Récupération' })).toBeVisible();
  await page.getByLabel('Livraison').check();
  await page.getByLabel('Mardi 18h–20h').check();
  await page.getByLabel('Surgelé').check();
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Step 3: Coordonnées
  await expect(page.getByRole('heading', { name: 'Coordonnées' })).toBeVisible();
  await page.getByLabel('Prénom').fill('Jean');
  await page.getByLabel('Nom', { exact: true }).fill('Dupont');
  await page.getByLabel('Email').fill('jean.dupont@example.com');
  await page.getByLabel('Adresse').fill('1 rue du Test, Lausanne');

  await page.getByRole('button', { name: 'Payer' }).click();

  // Step 4: Paiement (stub) — the order was created at the end of "Coordonnées".
  await expect(page.getByText('Commande envoyée')).toBeVisible();
});

test('a pickup order does not require an address', async ({ page }) => {
  await page.goto('/');

  const firstProductCard = page.locator('ds-product-card').first();
  await expect(firstProductCard).toBeVisible();
  await firstProductCard.getByRole('button', { name: 'Ajouter' }).click();

  await page.getByRole('button', { name: /Panier \(1\)/ }).click();
  await page.getByRole('button', { name: 'Confirmer la commande' }).click();

  await page.getByRole('button', { name: 'Continuer' }).click();

  await page.getByLabel('Retrait').check();
  await page.getByLabel('Samedi 10h–12h').check();
  await page.getByLabel('Surgelé').check();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByLabel('Adresse')).toHaveCount(0);

  await page.getByLabel('Prénom').fill('Jean');
  await page.getByLabel('Nom', { exact: true }).fill('Dupont');
  await page.getByLabel('Email').fill('jean.dupont@example.com');

  await page.getByRole('button', { name: 'Payer' }).click();

  await expect(page.getByText('Commande envoyée')).toBeVisible();
});
