import { test, expect } from '@playwright/test';

test.describe('UI Hard-Reset Smoke Tests', () => {
  const REQUIRED_TEST_IDS = [
    'sku-basic', 'sku-pro', 'theme-toggle', 'composer-input', 
    'send-btn', 'verify-btn', 'receipt', 'minimap-toggle', 
    'copy-javascript', 'copy-curl'
  ];

  test('Page has exactly one tab container for the current app', async ({ page }) => {
    await page.goto('/');
    
    // Determine which app we're testing based on the URL
    const url = page.url();
    let expectedTab;
    if (url.includes('proof-messenger')) {
      expectedTab = 'tab-messenger';
    } else if (url.includes('admin-insights')) {
      expectedTab = 'tab-admin';
    } else if (url.includes('dev-portal')) {
      expectedTab = 'tab-dev';
    } else {
      throw new Error('Unknown app URL: ' + url);
    }

    // Check that exactly one tab container exists
    const tabContainer = page.locator(`[data-testid="${expectedTab}"]`);
    await expect(tabContainer).toHaveCount(1);
    await expect(tabContainer).toBeVisible();
  });

  test('All required testids are visible', async ({ page }) => {
    await page.goto('/');
    
    // Check that all required test IDs exist and are visible
    for (const testId of REQUIRED_TEST_IDS) {
      const element = page.locator(`[data-testid="${testId}"]`);
      await expect(element).toHaveCount(1, `Test ID ${testId} should exist exactly once`);
      await expect(element).toBeVisible();
    }
  });

  test('No duplicate data-testid attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check for duplicates of critical test IDs
    for (const testId of REQUIRED_TEST_IDS) {
      const elements = page.locator(`[data-testid="${testId}"]`);
      const count = await elements.count();
      if (count > 1) {
        console.log('BLOCKER_DUPLICATE_TESTIDS');
        process.exit(1);
      }
      expect(count).toBe(1);
    }
  });

  test('Send flow: fill composer-input, click send-btn, receipt shows timestamp', async ({ page }) => {
    await page.goto('/');
    
    // Fill composer input
    const composerInput = page.locator('[data-testid="composer-input"]');
    await composerInput.fill('Test message for smoke test');
    
    // Click send button
    const sendBtn = page.locator('[data-testid="send-btn"]');
    await sendBtn.click();
    
    // Wait for receipt to appear and check it contains a timestamp
    const receipt = page.locator('[data-testid="receipt"]');
    await expect(receipt).toBeVisible();
    
    // Check that receipt contains timestamp-related content
    await expect(receipt).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|Timestamp/i);
  });

  test('Verify button mutates receipt', async ({ page }) => {
    await page.goto('/');
    
    // Fill and send a message first
    const composerInput = page.locator('[data-testid="composer-input"]');
    await composerInput.fill('Test message for verify test');
    
    const sendBtn = page.locator('[data-testid="send-btn"]');
    await sendBtn.click();
    
    // Wait for receipt to appear
    const receipt = page.locator('[data-testid="receipt"]');
    await expect(receipt).toBeVisible();
    
    // Get initial receipt content
    const initialContent = await receipt.textContent();
    
    // Click verify button
    const verifyBtn = page.locator('[data-testid="verify-btn"]');
    await verifyBtn.click();
    
    // Wait for some change (could be status change or additional content)
    await page.waitForTimeout(1000);
    
    const finalContent = await receipt.textContent();
    
    // Receipt should either have changed content or show verified status
    expect(finalContent).not.toBe(initialContent);
  });

  test('Minimap: center click changes scrollTop', async ({ page }) => {
    await page.goto('/');
    
    // Enable minimap if it's not on by default
    const minimapToggle = page.locator('[data-testid="minimap-toggle"]');
    await minimapToggle.click();
    
    // Wait for minimap to be visible
    await page.waitForTimeout(500);
    
    // Get initial scroll position
    const initialScrollTop = await page.evaluate(() => window.scrollY);
    
    // Find and click center of minimap (look for clickable area)
    const minimapArea = page.locator('.h-32.bg-gray-100, .h-32.bg-gray-700, [class*="minimap"]');
    if (await minimapArea.count() > 0) {
      await minimapArea.first().click({ position: { x: 64, y: 64 } }); // Center of 128x128 area
      
      // Wait for scroll to complete
      await page.waitForTimeout(1000);
      
      const finalScrollTop = await page.evaluate(() => window.scrollY);
      
      // Scroll position should have changed
      expect(finalScrollTop).not.toBe(initialScrollTop);
    }
  });

  test('Minimap default OFF for messenger basic, ON for admin/dev pro', async ({ page }) => {
    await page.goto('/');
    
    const url = page.url();
    const minimapToggle = page.locator('[data-testid="minimap-toggle"]');
    
    if (url.includes('proof-messenger')) {
      // For messenger, minimap should default to OFF
      // Check if toggle shows "OFF" or minimap is not visible initially
      const toggleText = await minimapToggle.textContent();
      expect(toggleText).toContain('OFF');
    } else if (url.includes('admin-insights') || url.includes('dev-portal')) {
      // For admin/dev, minimap should default to ON  
      const toggleText = await minimapToggle.textContent();
      expect(toggleText).toContain('ON');
    }
  });

  test('Clipboard after copy-javascript contains gateway host', async ({ page }) => {
    await page.goto('/');
    
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
    
    const copyJsBtn = page.locator('[data-testid="copy-javascript"]');
    await copyJsBtn.click();
    
    // Wait a moment for clipboard operation
    await page.waitForTimeout(500);
    
    // Check clipboard content contains gateway
    const clipboardContent = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    expect(clipboardContent).toContain('atlas-gateway.sonthenguyen186.workers.dev');
  });

  test('Clipboard after copy-curl contains gateway host', async ({ page }) => {
    await page.goto('/');
    
    // Grant clipboard permissions  
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
    
    const copyCurlBtn = page.locator('[data-testid="copy-curl"]');
    await copyCurlBtn.click();
    
    // Wait a moment for clipboard operation
    await page.waitForTimeout(500);
    
    // Check clipboard content contains gateway
    const clipboardContent = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    
    expect(clipboardContent).toContain('atlas-gateway.sonthenguyen186.workers.dev');
  });

  test.describe('Pro-only features (in sku-pro)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      
      // Switch to Pro SKU
      const skuPro = page.locator('[data-testid="sku-pro"]');
      await skuPro.click();
      await page.waitForTimeout(500);
    });

    test('Tenant Live badge visible', async ({ page }) => {
      // Check for tenant badge containing "enterprise-demo" or "Live"
      await expect(page.getByText(/Tenant.*enterprise-demo|Live/i)).toBeVisible();
    });

    test('/qtca/stream badge present', async ({ page }) => {
      await expect(page.getByText('/qtca/stream')).toBeVisible();
    });

    test('PQC chip visible', async ({ page }) => {
      await expect(page.getByText(/PQC/i)).toBeVisible();
    });
  });
});