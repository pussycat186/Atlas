import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Filter for critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical'
    );
    
    if (criticalViolations.length > 0) {
      console.log('BLOCKER_FATAL:axe');
      console.log('Critical accessibility violations found:');
      criticalViolations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
      process.exit(1);
    }
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('Theme toggle should be accessible', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    
    // Check that the theme toggle can be accessed via keyboard
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();
    
    // Test keyboard interaction
    await themeToggle.press('Enter');
    
    // Run accessibility scan on the theme toggle specifically
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="theme-toggle"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test('Form controls should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Test composer input accessibility
    const composerInput = page.locator('[data-testid="composer-input"]');
    await expect(composerInput).toBeVisible();
    
    // Check that form controls have proper labels or aria-labels
    const hasLabel = await composerInput.getAttribute('aria-label') || 
                     await composerInput.getAttribute('placeholder');
    expect(hasLabel).toBeTruthy();
    
    // Test keyboard navigation through form elements
    await composerInput.focus();
    await expect(composerInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    const sendBtn = page.locator('[data-testid="send-btn"]');
    await expect(sendBtn).toBeFocused();
    
    // Run accessibility scan on form elements
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="composer-input"], [data-testid="send-btn"], [data-testid="verify-btn"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test('SKU selector should be accessible', async ({ page }) => {
    await page.goto('/');
    
    const skuBasic = page.locator('[data-testid="sku-basic"]');
    const skuPro = page.locator('[data-testid="sku-pro"]');
    
    await expect(skuBasic).toBeVisible();
    await expect(skuPro).toBeVisible();
    
    // Test keyboard navigation
    await skuBasic.focus();
    await expect(skuBasic).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(skuPro).toBeFocused();
    
    // Test activation with space/enter
    await skuPro.press('Enter');
    
    // Run accessibility scan on SKU selector
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="sku-basic"], [data-testid="sku-pro"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test('Dark theme should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Wait for theme change
    await page.waitForTimeout(500);
    
    // Run accessibility scan in dark theme
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });
});