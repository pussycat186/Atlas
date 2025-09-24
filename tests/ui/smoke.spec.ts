import { test, expect } from '@playwright/test';

test.describe('Atlas UI Hard-Reset Smoke Tests', () => {
  test.describe('Basic SKU Tests', () => {
    test('All required test IDs exist and basic SKU hides tenant/minimap OFF', async ({ page }) => {
      await page.goto('/');
      
      // Tab navigation test IDs
      await expect(page.getByTestId('tab-messenger')).toBeVisible();
      await expect(page.getByTestId('tab-admin')).toBeVisible();
      await expect(page.getByTestId('tab-dev')).toBeVisible();
      
      // SKU selection test IDs
      await expect(page.getByTestId('sku-basic')).toBeVisible();
      await expect(page.getByTestId('sku-pro')).toBeVisible();
      
      // Theme toggle
      await expect(page.getByTestId('theme-toggle')).toBeVisible();
      
      // Messenger specific test IDs
      await expect(page.getByTestId('composer-input')).toBeVisible();
      await expect(page.getByTestId('send-btn')).toBeVisible();
      
      // Basic SKU should hide tenant and have minimap OFF
      await page.getByTestId('sku-basic').click();
      
      // Check if tenant section is hidden (should not exist for basic)
      const tenantElement = page.locator('text=Tenant:');
      await expect(tenantElement).toBeHidden();
      
      // Minimap should be OFF for basic (and not visible)
      const minimapToggle = page.getByTestId('minimap-toggle');
      await expect(minimapToggle).toBeHidden();
    });

    test('Optimistic send → receipt → verify flow', async ({ page }) => {
      await page.goto('/');
      
      // Ensure we're on messenger tab and basic SKU
      await page.getByTestId('tab-messenger').click();
      await page.getByTestId('sku-basic').click();
      
      // Send a message
      await page.getByTestId('composer-input').fill('Test message for Atlas');
      await page.getByTestId('send-btn').click();
      
      // Check receipt appears
      await expect(page.getByTestId('receipt')).toBeVisible({ timeout: 8000 });
      
      // Verify the message
      await page.getByTestId('verify-btn').click();
      
      // Check receipt shows verified status
      await expect(page.getByTestId('receipt')).toContainText(/verified/i, { timeout: 8000 });
    });
  });

  test.describe('Pro SKU Tests', () => {
    test('Pro SKU shows tenant, badges, and minimap ON', async ({ page }) => {
      await page.goto('/');
      
      // Switch to Pro SKU
      await page.getByTestId('sku-pro').click();
      
      // Pro should show tenant information
      const tenantElement = page.locator('text=Tenant:');
      await expect(tenantElement).toBeVisible();
      
      // Pro should show PQC badge
      const pqcElement = page.locator('text=PQC');
      await expect(pqcElement).toBeVisible();
      
      // Pro should show /qtca/stream badge
      const qtcaElement = page.locator('text=/qtca/stream');
      await expect(qtcaElement).toBeVisible();
      
      // Minimap should be available and ON by default for Pro
      const minimapToggle = page.getByTestId('minimap-toggle');
      await expect(minimapToggle).toBeVisible();
      await expect(minimapToggle).toBeChecked();
    });
  });

  test.describe('Cross-app functionality', () => {
    test('Admin tab shows system metrics', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('tab-admin').click();
      
      // Check admin-specific content is visible
      await expect(page.locator('text=System Health')).toBeVisible();
      await expect(page.locator('text=Performance')).toBeVisible();
      await expect(page.locator('text=Network')).toBeVisible();
    });

    test('Dev tab shows code examples with copy functionality', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('tab-dev').click();
      
      // Check dev-specific content
      await expect(page.locator('text=JavaScript Example')).toBeVisible();
      await expect(page.locator('text=cURL Example')).toBeVisible();
      
      // Test copy buttons
      await expect(page.getByTestId('copy-javascript')).toBeVisible();
      await expect(page.getByTestId('copy-curl')).toBeVisible();
      
      // Check that clipboard contains gateway URL after copying
      await page.getByTestId('copy-javascript').click();
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardContent).toContain('atlas-gateway.sonthenguyen186.workers.dev');
    });
  });

  test.describe('Minimap interaction', () => {
    test('Minimap toggle works correctly for Pro SKU', async ({ page }) => {
      await page.goto('/');
      
      // Switch to Pro SKU
      await page.getByTestId('sku-pro').click();
      
      const minimapToggle = page.getByTestId('minimap-toggle');
      await expect(minimapToggle).toBeVisible();
      
      // Should be checked by default for Pro
      await expect(minimapToggle).toBeChecked();
      
      // Toggle off
      await minimapToggle.click();
      await expect(minimapToggle).not.toBeChecked();
      
      // Toggle back on
      await minimapToggle.click();
      await expect(minimapToggle).toBeChecked();
    });
  });

  test.describe('Theme toggle', () => {
    test('Theme toggle changes appearance', async ({ page }) => {
      await page.goto('/');
      
      const themeToggle = page.getByTestId('theme-toggle');
      await expect(themeToggle).toBeVisible();
      
      // Click theme toggle and verify change
      await themeToggle.click();
      await expect(themeToggle).toContainText(/dark|light/);
    });
  });
});