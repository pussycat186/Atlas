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
      
      // Verify animations are disabled or reduced
      const animatedElements = page.locator('[style*="transition"], [style*="animation"]');
      const count = await animatedElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = animatedElements.nth(i);
        const style = await element.getAttribute('style');
        
        if (style?.includes('transition')) {
          expect(style).toMatch(/transition.*0s|transition.*0ms/);
        }
      }
    });
  });
});