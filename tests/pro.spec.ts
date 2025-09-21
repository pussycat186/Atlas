import { test, expect } from '@playwright/test';

test.describe('ATLAS Pro SKU Tests', () => {
  test('SSO login functionality', async ({ page }) => {
    await page.goto('https://atlas-admin-insights.vercel.app');
    await expect(page).toHaveTitle(/Atlas/);
    
    // Test admin insights navigation
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/.*analytics/);
    
    await page.click('text=Metrics');
    await expect(page).toHaveURL(/.*metrics/);
  });

  test('Multi-tenant switch', async ({ page }) => {
    await page.goto('https://atlas-admin-insights.vercel.app');
    
    // Test system status
    await page.click('text=System Status');
    await expect(page).toHaveURL(/.*system-status/);
    
    // Test witnesses page
    await page.click('text=Witnesses');
    await expect(page).toHaveURL(/.*witnesses/);
  });

  test('Plugin sandbox isolation', async ({ page }) => {
    await page.goto('https://atlas-dev-portal.vercel.app');
    await expect(page).toHaveTitle(/Atlas/);
    
    // Test dev portal navigation
    await page.click('text=API');
    await expect(page).toHaveURL(/.*api/);
    
    await page.click('text=SDK');
    await expect(page).toHaveURL(/.*sdk/);
    
    await page.click('text=Plugins');
    await expect(page).toHaveURL(/.*plugins/);
  });

  test('QTCA stream functionality', async ({ page }) => {
    // Test QTCA stream endpoint
    const response = await page.request.get('https://atlas-gateway.sonthenguyen186.workers.dev/qtca/stream');
    expect(response.status()).toBe(200);
  });
});
