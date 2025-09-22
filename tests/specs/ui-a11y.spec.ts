import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('A11y - No Critical Violations', async ({ page }) => {
  await page.goto('/');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test('A11y - Focus Management', async ({ page }) => {
  await page.goto('/');

  // Test tab navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();

  // Test that focus is visible
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toBeVisible();

  // Test that focus ring is present
  const focusStyles = await focusedElement.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      outline: computed.outline,
      outlineOffset: computed.outlineOffset
    };
  });

  expect(focusStyles.outline).not.toBe('none');
});

test('A11y - ARIA Labels and Roles', async ({ page }) => {
  await page.goto('/');

  // Check that buttons have proper roles
  await expect(page.getByTestId('sku-basic')).toHaveAttribute('role', 'tab');
  await expect(page.getByTestId('sku-pro')).toHaveAttribute('role', 'tab');
  
  // Check that tablist has proper role
  await expect(page.locator('[role="tablist"]')).toBeVisible();
  
  // Check that tenant selector has proper aria-label
  await expect(page.locator('select[aria-label="Tenant"]')).toBeVisible();
});
