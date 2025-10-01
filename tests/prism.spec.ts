import { test, expect } from '@playwright/test';

test('SSR prism marker exists', async ({ page, browserName }, testInfo) => {
  const path = testInfo.project.name === 'proof' ? '/prism/' : '/prism';
  await page.goto(path);
  await expect(page.locator('text=ATLAS • Prism UI — Peak Preview')).toHaveCount(1);
});