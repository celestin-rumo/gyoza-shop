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
  // window state, which is admin-controlled and not guaranteed open here. The
  // slot group only appears once both a method and a content type are chosen.
  await expect(page.getByRole('heading', { name: 'Récupération' })).toBeVisible();
  await page.getByRole('radio', { name: 'Livraison' }).click();
  await page.getByRole('radio', { name: 'Surgelé' }).click();
  await page.getByRole('radio', { name: '18h00–20h00' }).click();
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

  await page.getByRole('radio', { name: 'Retrait' }).click();
  await page.getByRole('radio', { name: 'Surgelé' }).click();
  await page.getByRole('radio', { name: '10h00–12h00' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByLabel('Adresse')).toHaveCount(0);

  await page.getByLabel('Prénom').fill('Jean');
  await page.getByLabel('Nom', { exact: true }).fill('Dupont');
  await page.getByLabel('Email').fill('jean.dupont@example.com');

  await page.getByRole('button', { name: 'Payer' }).click();

  await expect(page.getByText('Commande envoyée')).toBeVisible();
});
