import { test, expect } from '@playwright/test';

test('SSR prism marker exists', async ({ page }) => {
  await page.goto('/prism');
  await expect(page.getByTestId('prism-marker')).toHaveCount(1);
});