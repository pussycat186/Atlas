import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import 'dotenv/config';

const BASE = process.env.BASE_URL!; // set by CI to the Vercel Preview URL

test.describe('Accessibility Tests', () => {
  test('A11y (axe) has no critical issues - Messenger', async ({ page }) => {
    await page.goto(`${BASE}/`);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('A11y (axe) has no critical issues - Admin', async ({ page }) => {
    await page.goto(`${BASE}/metrics`);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('A11y (axe) has no critical issues - Dev Portal', async ({ page }) => {
    await page.goto(`${BASE}/`);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation works - Messenger', async ({ page }) => {
    await page.goto(`${BASE}/`);
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('ARIA labels are present', async ({ page }) => {
    await page.goto(`${BASE}/`);
    
    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button[aria-label]');
    await expect(buttons).toHaveCount.greaterThan(0);
    
    const inputs = page.locator('input[aria-label], textarea[aria-label]');
    await expect(inputs).toHaveCount.greaterThan(0);
  });

  test('Color contrast meets WCAG standards', async ({ page }) => {
    await page.goto(`${BASE}/`);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Focus management works correctly', async ({ page }) => {
    await page.goto(`${BASE}/`);
    
    // Test that focus is managed properly
    const messageInput = page.getByRole('textbox', { name: /message/i });
    await messageInput.focus();
    await expect(messageInput).toBeFocused();
    
    // Test tab order
    await page.keyboard.press('Tab');
    const nextFocused = page.locator(':focus');
    await expect(nextFocused).toBeVisible();
  });
});
