import { test, expect } from '@playwright/test';

test('Theme Toggle - Dark to Light', async ({ page }) => {
  await page.goto('/');

  // Check theme toggle button exists
  await expect(page.getByTestId('theme-toggle')).toBeVisible();

  // Test dark theme (default)
  await expect(page.locator('body')).toHaveClass(/dark/);
  
  // Toggle to light theme
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('body')).not.toHaveClass(/dark/);

  // Check light theme background
  const bodyStyles = await page.locator('body').evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color
    };
  });

  // Verify light theme colors
  expect(bodyStyles.backgroundColor).toContain('247, 247, 251'); // #f7f7fb
  expect(bodyStyles.color).toContain('17, 24, 39'); // #111827
});

test('Theme Toggle - Light to Dark', async ({ page }) => {
  await page.goto('/');

  // Start with light theme
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('body')).not.toHaveClass(/dark/);

  // Toggle to dark theme
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('body')).toHaveClass(/dark/);

  // Check dark theme background
  const bodyStyles = await page.locator('body').evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color
    };
  });

  // Verify dark theme colors
  expect(bodyStyles.backgroundColor).toContain('11, 15, 20'); // #0b0f14
  expect(bodyStyles.color).toContain('245, 245, 245'); // #f5f5f5
});
