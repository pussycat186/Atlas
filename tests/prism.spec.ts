import { test, expect } from '@playwright/test';

test('SSR prism marker exists', async ({ page, browserName }, testInfo) => {
  const path = testInfo.project.name === 'proof' ? '/prism/' : '/prism';
  await page.goto(path);
  // Check for the marker in any element (including hidden ones)
  await expect(page.locator('[data-prism-marker]')).toHaveCount(1);
});