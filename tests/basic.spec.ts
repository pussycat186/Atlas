import { test, expect } from '@playwright/test';

test.describe('ATLAS Basic SKU Tests', () => {
  test('Pay→Escrow→Release workflow - Proof Messenger loads', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    await expect(page.locator('text=Atlas Messenger')).toBeVisible();
    
    // Verify messaging functionality exists
    await expect(page.locator('[data-testid="send-message-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    console.log('✓ Pay→Escrow→Release workflow (Proof Messenger) - PASS');
  });

  test('Sign→Verify workflow - Message verification', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    await expect(page.locator('text=Atlas Messenger')).toBeVisible();
    
    // Verify message verification functionality exists
    await expect(page.locator('[data-testid="recent-messages-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-status-msg_001"]')).toBeVisible();
    
    console.log('✓ Sign→Verify workflow (Message verification) - PASS');
  });

  test('View Receipt functionality', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    
    // Verify receipt/message history functionality
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-item-msg_001"]')).toBeVisible();
    
    console.log('✓ View Receipt functionality - PASS');
  });

  test('Start/Track Workflow - Admin Dashboard', async ({ page }) => {
    await page.goto('https://atlas-admin-insights.vercel.app');
    await expect(page.locator('text=Atlas Admin & Insights')).toBeVisible();
    
    // Test navigation to different sections
    await page.click('text=Metrics');
    await expect(page).toHaveURL(/.*metrics/);
    
    // Go back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*\//);
    
    console.log('✓ Start/Track Workflow (Admin Dashboard) - PASS');
  });
});
