import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const PRISM_URLS = [
  'https://atlas-admin-insights.vercel.app/prism',
  'https://atlas-dev-portal.vercel.app/prism',
  'https://atlas-proof-messenger.vercel.app/prism'
];

PRISM_URLS.forEach(url => {
  test.describe(`Accessibility tests for ${url}`, () => {
    test('should not have any accessibility violations', async ({ page }) => {
      await page.goto(url);
      await injectAxe(page);
      
      // Check for accessibility violations
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
    });

    test('should have proper keyboard navigation', async ({ page }) => {
      await page.goto(url);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test escape key functionality if dialogs are present
      const dialogs = page.locator('[role="dialog"]');
      const dialogCount = await dialogs.count();
      
      if (dialogCount > 0) {
        await page.keyboard.press('Escape');
        // Verify dialog closes or focus returns appropriately
      }
    });

    test('should contain the required marker text', async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('text=ATLAS • Prism UI — Peak Preview')).toBeVisible();
    });

    test('should respect reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(url);
      
      // Wait for theme system to initialize
      await page.waitForTimeout(100);
      
      // Check if motion is properly disabled
      const motionElements = page.locator('[data-motion="true"], .motion-safe');
      const count = await motionElements.count();
      
      // Verify no motion-enabled elements are present when reduced motion is set
      expect(count).toBe(0);
    });

    test('should have proper focus management', async ({ page }) => {
      await page.goto(url);
      
      // Test tab order
      const focusableElements = page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const count = await focusableElements.count();
      
      if (count > 0) {
        await page.keyboard.press('Tab');
        const firstFocused = page.locator(':focus');
        await expect(firstFocused).toBeVisible();
        
        // Test Escape key handling
        await page.keyboard.press('Escape');
        // Should not cause errors
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      await page.goto(url);
      
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        await buttons.first().focus();
        
        // Check for focus styles
        const focusedButton = page.locator('button:focus');
        const styles = await focusedButton.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            boxShadow: computed.boxShadow,
            borderColor: computed.borderColor
          };
        });
        
        // Should have some form of focus indication
        const hasFocusStyle = styles.outline !== 'none' || 
                             styles.boxShadow !== 'none' || 
                             styles.borderColor !== 'initial';
        
        expect(hasFocusStyle).toBe(true);
      }
    });
  });
});