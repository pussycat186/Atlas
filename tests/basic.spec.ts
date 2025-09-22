import { test, expect } from '@playwright/test';

test.describe('ATLAS Basic SKU Tests', () => {
  test('Messenger functionality - Send and verify messages', async ({ page }) => {
    const baseUrl = process.env.BASE_PROOF || 'https://atlas-proof-messenger.vercel.app';
    await page.goto(baseUrl);
    
    // Wait for page to load - check for either Prism UI or legacy UI
    const hasPrismUI = await page.locator('text=ATLAS • Prism UI').isVisible().catch(() => false);
    const hasLegacyUI = await page.locator('text=Atlas Messenger').isVisible().catch(() => false);
    
    if (hasPrismUI) {
      // Prism UI tests
      await expect(page.locator('[data-testid="sku-basic"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-messenger"]')).toBeVisible();
      await expect(page.locator('[data-testid="composer-input"]')).toBeVisible();
      await page.fill('[data-testid="composer-input"]', 'Test message from Playwright');
      await page.click('[data-testid="send-btn"]');
      await expect(page.locator('text=Test message from Playwright')).toBeVisible();
      await expect(page.locator('[data-testid="receipt"]')).toBeVisible();
    } else if (hasLegacyUI) {
      // Legacy UI tests (fallback)
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
      await page.fill('[data-testid="message-input"]', 'Test message from Playwright');
      await page.click('[data-testid="send-message-button"]');
      await expect(page.locator('text=Test message from Playwright')).toBeVisible();
    } else {
      throw new Error('Neither Prism UI nor legacy UI detected');
    }
    
    console.log('✓ Messenger functionality - PASS');
  });

  test('Admin dashboard - Basic metrics display', async ({ page }) => {
    const baseUrl = process.env.BASE_ADMIN || 'https://atlas-admin-insights.vercel.app';
    await page.goto(baseUrl);
    
    // Wait for page to load - check for either Prism UI or legacy UI
    const hasPrismUI = await page.locator('text=ATLAS • Prism UI').isVisible().catch(() => false);
    const hasLegacyUI = await page.locator('text=Atlas Admin').isVisible().catch(() => false) || 
                       await page.locator('text=Atlas Admin & Insights').isVisible().catch(() => false);
    
    if (hasPrismUI) {
      // Prism UI tests
      await page.click('[data-testid="tab-admin"]');
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      await expect(page.locator('text=RPS')).toBeVisible();
      await expect(page.locator('text=p95')).toBeVisible();
      await expect(page.locator('text=Error%')).toBeVisible();
      await expect(page.locator('text=Quorum')).toBeVisible();
    } else if (hasLegacyUI) {
      // Legacy UI tests (fallback)
      await expect(page.locator('text=Atlas Admin & Insights')).toBeVisible();
      // Check for any admin content
      await expect(page.locator('main').first()).toBeVisible();
    } else {
      throw new Error('Neither Prism UI nor legacy UI detected');
    }
    
    console.log('✓ Admin dashboard - PASS');
  });

  test('Dev Portal - Basic functionality', async ({ page }) => {
    const baseUrl = process.env.BASE_DEV || 'https://atlas-dev-portal.vercel.app';
    await page.goto(baseUrl);
    
    // Wait for page to load - check for either Prism UI or legacy UI
    await page.waitForLoadState('networkidle');
    
    const hasPrismUI = await page.locator('text=ATLAS • Prism UI').isVisible().catch(() => false);
    const hasLegacyUI = await page.locator('h1').isVisible().catch(() => false) ||
                       await page.locator('text=Atlas Developer Portal').isVisible().catch(() => false) ||
                       await page.locator('[data-testid="dev-portal"]').isVisible().catch(() => false);
    
    // Debug: log what we found
    console.log('Dev Portal - hasPrismUI:', hasPrismUI, 'hasLegacyUI:', hasLegacyUI);
    
    if (hasPrismUI) {
      // Prism UI tests
      await page.click('[data-testid="tab-dev"]');
      await expect(page.locator('text=Developer Portal')).toBeVisible();
      await expect(page.locator('text=Quickstart')).toBeVisible();
      await expect(page.locator('[data-testid="copy-javascript"]')).toBeVisible();
      await expect(page.locator('[data-testid="copy-curl"]')).toBeVisible();
    } else if (hasLegacyUI) {
      // Legacy UI tests (fallback)
      await expect(page.locator('text=Atlas Developer Portal').first()).toBeVisible();
      // Check for any dev portal content
      await expect(page.locator('main').first()).toBeVisible();
    } else {
      throw new Error('Neither Prism UI nor legacy UI detected');
    }
    
    console.log('✓ Dev Portal - PASS');
  });

  test('Theme toggle functionality', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app');
    
    // Wait for page to load - check for either Prism UI or legacy UI
    const hasPrismUI = await page.locator('text=ATLAS • Prism UI').isVisible().catch(() => false);
    const hasLegacyUI = await page.locator('text=Atlas Messenger').isVisible().catch(() => false);
    
    if (hasPrismUI) {
      // Prism UI tests
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500); // Allow theme transition
    } else if (hasLegacyUI) {
      // Legacy UI tests (fallback)
      await expect(page.locator('button[aria-label="Toggle theme"]')).toBeVisible();
      await page.click('button[aria-label="Toggle theme"]');
      await page.waitForTimeout(500); // Allow theme transition
    } else {
      throw new Error('Neither Prism UI nor legacy UI detected');
    }
    
    console.log('✓ Theme toggle - PASS');
  });
});
