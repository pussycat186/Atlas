import { test, expect } from '@playwright/test';

test('Dev portal quickstart copy functionality', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Click copy-javascript button
  await page.getByTestId('copy-javascript').click();
  
  // Read clipboard content
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  
  // Must contain https:// and /record
  expect(clipboardText).toContain('https://');
  expect(clipboardText).toContain('/record');
});
