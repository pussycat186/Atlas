import { test, expect } from '@playwright/test';

test('Send → Receipt → Verified', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('composer-input').fill('Hello Atlas');
  await page.getByTestId('send-btn').click();
  await expect(page.getByTestId('receipt')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('verify-btn').click();
  await expect(page.getByTestId('receipt')).toContainText(/verified/i, { timeout: 8000 });
});
