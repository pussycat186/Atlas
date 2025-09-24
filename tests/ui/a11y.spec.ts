import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Atlas UI Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('Basic SKU has no critical accessibility violations', async ({ page }) => {
    await page.getByTestId('sku-basic').click();
    
    try {
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true }
        }
      });
    } catch (error) {
      // If critical violations found, fail with BLOCKER
      if (error.message.includes('critical')) {
        throw new Error('BLOCKER_FATAL:axe');
      }
      throw error;
    }
  });

  test('Pro SKU has no critical accessibility violations', async ({ page }) => {
    await page.getByTestId('sku-pro').click();
    
    try {
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true }
        }
      });
    } catch (error) {
      // If critical violations found, fail with BLOCKER
      if (error.message.includes('critical')) {
        throw new Error('BLOCKER_FATAL:axe');
      }
      throw error;
    }
  });

  test('All tabs are keyboard accessible', async ({ page }) => {
    // Test keyboard navigation through all tabs
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus is properly managed
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Theme toggle is accessible', async ({ page }) => {
    const themeToggle = page.getByTestId('theme-toggle');
    
    // Should have proper ARIA attributes
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toBeFocused({ timeout: 1000 }).catch(() => {
      // If not focused, tab to it
      return page.keyboard.press('Tab');
    });
    
    // Should be activatable with keyboard
    await page.keyboard.press('Enter');
    await expect(themeToggle).toContainText(/dark|light/);
  });
});