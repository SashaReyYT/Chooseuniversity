/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, type Page } from '@playwright/test';

interface AuthFixtures {
  authenticatedPage: Page;
  testUser: {
    email: string;
    password: string;
  };
}

const TEST_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'e2e-test@example.com';
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!';

async function signInTestUser(page: Page) {
  await page.goto('/en/sign-in');
  await page.fill('input[name="email"]', TEST_USER_EMAIL);
  await page.fill('input[name="password"]', TEST_USER_PASSWORD);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/en\/(onboarding|discover|results)/, { timeout: 15000 });
}

export const test = base.extend<AuthFixtures>({
  testUser: [
    { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
    { scope: 'test' },
  ],

  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await signInTestUser(page);

    const storageState = await context.storageState();
    await context.close();

    const authContext = await browser.newContext({ storageState });
    const authPage = await authContext.newPage();

    await use(authPage);
    await authContext.close();
  },
});

export { expect } from '@playwright/test';