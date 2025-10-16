import { test, expect } from '@playwright/test';

test('Dev portal page loads and shows content', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads
  await expect(page).toHaveURL(/.*dev-portal/);
  
  // Check that there's some content on the page
  const body = await page.locator('body').textContent();
  expect(body).toBeTruthy();
  
  // Check for any code blocks or quickstart content
  const codeBlocks = page.locator('code, pre');
  const codeCount = await codeBlocks.count();
  expect(codeCount).toBeGreaterThan(0);
});
