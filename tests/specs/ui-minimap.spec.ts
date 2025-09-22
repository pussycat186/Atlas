import { test, expect } from '@playwright/test';

test('Minimap - Toggle Functionality', async ({ page }) => {
  await page.goto('/');

  // Switch to Pro SKU and messenger tab
  await page.getByTestId('sku-pro').click();
  await page.getByTestId('tab-messenger').click();

  // Check minimap toggle exists
  await expect(page.getByTestId('minimap-toggle')).toBeVisible();

  // Test minimap toggle
  await page.getByTestId('minimap-toggle').click();
  await expect(page.getByTestId('minimap-toggle')).toContainText('Hide');

  // Toggle back
  await page.getByTestId('minimap-toggle').click();
  await expect(page.getByTestId('minimap-toggle')).toContainText('Show');
});

test('Minimap - Scroll to Message', async ({ page }) => {
  await page.goto('/');

  // Switch to Pro SKU and messenger tab
  await page.getByTestId('sku-pro').click();
  await page.getByTestId('tab-messenger').click();

  // Send a few messages to create minimap dots
  await page.getByTestId('composer-input').fill('Message 1');
  await page.getByTestId('send-btn').click();
  
  await page.getByTestId('composer-input').fill('Message 2');
  await page.getByTestId('send-btn').click();

  // Enable minimap
  await page.getByTestId('minimap-toggle').click();

  // Check that minimap dots exist
  const minimapDots = page.locator('[data-testid="minimap-toggle"]').locator('..').locator('div').filter({ hasText: '' });
  await expect(minimapDots.first()).toBeVisible();

  // Test clicking minimap dot (scroll behavior)
  const initialScrollTop = await page.evaluate(() => window.scrollY);
  await minimapDots.first().click();
  
  // Wait for scroll animation
  await page.waitForTimeout(500);
  
  const finalScrollTop = await page.evaluate(() => window.scrollY);
  expect(Math.abs(finalScrollTop - initialScrollTop)).toBeGreaterThan(0);
});
