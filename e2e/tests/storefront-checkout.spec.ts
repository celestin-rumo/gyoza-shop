import { expect, test } from '@playwright/test';

test('a customer can add a pack to the cart and place an order', async ({ page }) => {
  await page.goto('/');

  const firstProductCard = page.locator('ds-product-card').first();
  await expect(firstProductCard).toBeVisible();

  await firstProductCard.getByRole('button', { name: 'Ajouter' }).click();

  await page.getByRole('button', { name: /Panier \(1\)/ }).click();
  await page.getByRole('button', { name: 'Confirmer la commande' }).click();

  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByLabel('Prénom').fill('Jean');
  await page.getByLabel('Nom', { exact: true }).fill('Dupont');
  await page.getByLabel('Adresse').fill('1 rue du Test, Lausanne');
  await page.getByLabel('Email').fill('jean.dupont@example.com');

  await page.getByRole('button', { name: 'Valider la commande' }).click();

  await expect(page.getByText('Commande envoyée')).toBeVisible();
});
