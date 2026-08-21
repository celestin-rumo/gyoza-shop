import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the checkout wizard has no AXE violations at any step', async ({ page }) => {
  await page.goto('/');

  const firstProductCard = page.locator('ds-product-card').first();
  await expect(firstProductCard).toBeVisible();
  await firstProductCard.getByRole('button', { name: 'Ajouter' }).click();

  await page.getByRole('button', { name: /Panier \(1\)/ }).click();
  await page.getByRole('button', { name: 'Confirmer la commande' }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // Step 1: Panier
  await expect(page.getByRole('heading', { name: 'Panier' })).toBeVisible();
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('button', { name: 'Continuer' }).click();

  // Step 2: Récupération
  await expect(page.getByRole('heading', { name: 'Récupération' })).toBeVisible();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByLabel('Livraison').check();
  await page.getByLabel('Mardi 18h–20h').check();
  await page.getByLabel('Surgelé').check();
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Step 3: Coordonnées
  await expect(page.getByRole('heading', { name: 'Coordonnées' })).toBeVisible();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByLabel('Prénom').fill('Jean');
  await page.getByLabel('Nom', { exact: true }).fill('Dupont');
  await page.getByLabel('Email').fill('jean.dupont@example.com');
  await page.getByLabel('Adresse').fill('1 rue du Test, Lausanne');

  await page.getByRole('button', { name: 'Payer' }).click();

  // Step 4: Paiement (stub / confirmation)
  await expect(page.getByText('Commande envoyée')).toBeVisible();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
