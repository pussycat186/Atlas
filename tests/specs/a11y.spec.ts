import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('A11y (axe) has no critical issues on Messenger home', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});