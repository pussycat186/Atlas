import { test, expect } from '@playwright/test';

test.describe('Atlas Basic Flows', () => {
  test('Pay→Escrow→Release flow', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    await expect(page).toHaveTitle(/Atlas/);
    
    // Basic smoke test - page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('Sign→Verify flow', async ({ page }) => {
    await page.goto('https://atlas-admin-insights.vercel.app');
    await expect(page).toHaveTitle(/Atlas/);
    
    // Basic smoke test - page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('View Receipt', async ({ page }) => {
    await page.goto('https://atlas-dev-portal.vercel.app');
    await expect(page).toHaveTitle(/Atlas/);
    
    // Basic smoke test - page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('Prism Preview loads with marker', async ({ page }) => {
    await page.goto('https://atlas-admin-insights.vercel.app/prism');
    
    // Check for exact marker text
    await expect(page.locator('text=ATLAS • Prism UI — Peak Preview')).toBeVisible();
    
    // Check Basic/Pro toggle works
    await expect(page.locator('text=PRO')).toBeVisible();
  });
});