import { test, expect } from '../fixtures/auth';

test.describe('Authenticated Flow', () => {
  test('can access discover after sign-in', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    await page.goto('/en/discover');
    await expect(page).toHaveURL(/.*\/discover/);
    await expect(page.locator('h1')).toContainText('Discover');
  });

  test('discover shows programme cards', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    await page.goto('/en/discover');
    await expect(page.locator('a[href^="/en/programmes/"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('can open programme detail', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    await page.goto('/en/discover');
    const firstLink = page.locator('a[href^="/en/programmes/"]').first();
    await firstLink.click();
    
    await expect(page).toHaveURL(/\/en\/programmes\/[^/]+/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Key facts')).toBeVisible();
  });
});