import { test, expect } from '@playwright/test';

test('Messenger - Send Message Flow', async ({ page }) => {
  await page.goto('/');

  // Ensure we're on messenger tab
  await page.getByTestId('tab-messenger').click();

  // Check composer input exists
  await expect(page.getByTestId('composer-input')).toBeVisible();
  await expect(page.getByTestId('send-btn')).toBeVisible();

  // Type a message
  await page.getByTestId('composer-input').fill('Hello Atlas Prism UI');
  
  // Send the message
  await page.getByTestId('send-btn').click();

  // Check that a new message bubble appears
  await expect(page.locator('text=Hello Atlas Prism UI')).toBeVisible();
  
  // Check that timestamp appears
  await expect(page.locator('text=/\\d{1,2}:\\d{2}/')).toBeVisible();
});

test('Messenger - Pro Features', async ({ page }) => {
  await page.goto('/');

  // Switch to Pro SKU
  await page.getByTestId('sku-pro').click();
  await page.getByTestId('tab-messenger').click();

  // Check that verify button exists in Pro mode
  await expect(page.getByTestId('verify-btn')).toBeVisible();

  // Check that minimap toggle exists
  await expect(page.getByTestId('minimap-toggle')).toBeVisible();

  // Test minimap toggle
  await page.getByTestId('minimap-toggle').click();
  await expect(page.getByTestId('minimap-toggle')).toContainText('Hide');
});
