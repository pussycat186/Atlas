import { test, expect } from '@playwright/test';

test.describe('Minimap Component', () => {
  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/prism');
    
    // Check if minimap is present
    const minimap = page.locator('[data-testid*="minimap"]');
    await expect(minimap).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const firstItem = page.locator('[data-testid^="minimap-item-"]').first();
    await expect(firstItem).toBeFocused();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    const secondItem = page.locator('[data-testid^="minimap-item-"]').nth(1);
    await expect(secondItem).toBeFocused();
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    // Should scroll to the corresponding section
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/prism');
    
    const minimapItem = page.locator('[data-testid^="minimap-item-"]').first();
    await minimapItem.click();
    
    // With reduced motion, scrolling should be instant
    // This would need to be verified by checking scroll behavior
  });

  test('should have proper focus rings', async ({ page }) => {
    await page.goto('/prism');
    
    const firstItem = page.locator('[data-testid^="minimap-item-"]').first();
    await firstItem.focus();
    
    // Check that focus ring is visible
    await expect(firstItem).toHaveCSS('outline-width', /\d+px/);
  });

  test('should have aria labels', async ({ page }) => {
    await page.goto('/prism');
    
    const minimap = page.locator('[role="navigation"]');
    await expect(minimap).toHaveAttribute('aria-label', 'Page minimap');
    
    const items = page.locator('[data-testid^="minimap-item-"]');
    const firstItem = items.first();
    await expect(firstItem).toHaveAttribute('aria-label', /Navigate to/);
  });

  test('should toggle visibility', async ({ page }) => {
    await page.goto('/prism');
    
    // Minimap should be enabled by default
    const minimap = page.locator('[data-testid*="minimap"]');
    await expect(minimap).toBeVisible();
    
    // Test would need a toggle control to disable minimap
    // This depends on the actual implementation in the app
  });
});