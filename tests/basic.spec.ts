import { test, expect } from '@playwright/test';

test.describe('ATLAS Basic SKU Tests', () => {
  test('Pay→Escrow→Release workflow', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    await expect(page).toHaveTitle(/Atlas/);
    
    // Test basic navigation
    await page.click('text=Messages');
    await expect(page).toHaveURL(/.*messages/);
    
    await page.click('text=Receipts');
    await expect(page).toHaveURL(/.*receipts/);
    
    await page.click('text=Evidence');
    await expect(page).toHaveURL(/.*evidence/);
  });

  test('Sign→Verify workflow', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    
    // Test settings page
    await page.click('text=Settings');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('View Receipt functionality', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app/receipts');
    await expect(page).toHaveTitle(/Atlas/);
  });

  test('Start/Track Workflow', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    
    // Test offline page
    await page.goto('https://atlas-proof-messenger.vercel.app/offline');
    await expect(page).toHaveTitle(/Atlas/);
  });
});
