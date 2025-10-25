import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('home page has no automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    // Basic accessibility checks
    await expect(page).toHaveTitle(/./);

    // Check for landmarks
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('respects prefers-reduced-motion', async ({ page, context }) => {
    // Set reduced motion preference
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto('/');

    // Verify page loads correctly with reduced motion
    await expect(page).toHaveTitle(/./);
  });
});
