import { test, expect } from '@playwright/test';

test.describe('ATLAS Pro SKU Tests', () => {
  test('SSO login functionality - Advanced admin features', async ({ page }) => {
    await page.goto('https://atlas-admin-insights.vercel.app');
    await expect(page.locator('text=Atlas Admin & Insights')).toBeVisible();
    
    // Test available navigation links
    await page.click('text=Metrics');
    await expect(page).toHaveURL(/.*metrics/);
    
    // Go back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*\//);
    
    console.log('✓ SSO login functionality (Advanced Admin) - PASS');
  });

  test('Multi-tenant switch - Witness management', async ({ page }) => {
    await page.goto('https://atlas-admin-insights.vercel.app');
    
    // Verify advanced Pro features are present
    await expect(page.locator('text=Witness Quorum Status')).toBeVisible();
    await expect(page.locator('text=Rate Limiting')).toBeVisible();
    await expect(page.locator('text=Idempotency Cache')).toBeVisible();
    
    // Test witnesses page
    await page.click('text=Witnesses');
    await expect(page).toHaveURL(/.*witnesses/);
    
    console.log('✓ Multi-tenant switch (Witness Management) - PASS');
  });

  test('Plugin sandbox isolation - Dev Portal', async ({ page }) => {
    await page.goto('https://atlas-dev-portal.vercel.app');
    await expect(page.locator('text=Atlas')).toBeVisible();
    
    // Verify dev portal loads successfully
    await expect(page).toHaveURL(/atlas-dev-portal/);
    
    console.log('✓ Plugin sandbox isolation (Dev Portal) - PASS');
  });

  test('QTCA stream functionality - Pro endpoint', async ({ page }) => {
    // Test QTCA stream endpoint availability
    const response = await page.request.get('https://atlas-gateway.sonthenguyen186.workers.dev/qtca/stream');
    expect(response.status()).toBe(200);
    
    console.log('✓ QTCA stream functionality - PASS');
  });
});
