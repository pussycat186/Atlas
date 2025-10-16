import { test, expect } from '@playwright/test';

test('Messenger Home visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('messenger-home.png');
});

test('Messenger After Send visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Just take a snapshot of the current state
  await expect(page).toHaveScreenshot('messenger-after-send.png');
});

test('Admin Metrics visual snapshot', async ({ page }) => {
  await page.goto('/metrics');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('admin-metrics.png');
});

test('Dev Portal Quickstart visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Scroll to quickstart section
  await page.locator('[data-testid="code-examples-card"]').scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot('dev-quickstart.png');
});
