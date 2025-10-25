import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Family Wallet/i);
  });

  test('displays main navigation', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('wallet connect button is visible', async ({ page }) => {
    await page.goto('/');

    // Look for connect wallet button
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();
  });
});
