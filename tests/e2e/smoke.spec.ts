import { test, expect } from '@playwright/test';

test.describe('Atlas Messenger Smoke Tests', () => {
  test('Complete onboarding and verify flow', async ({ page }) => {
    // Start at home
    await page.goto('/');
    
    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Fill username
    await page.fill('input#username', 'Smoke Test User');
    await page.click('button:has-text("Tiếp theo")');
    
    // Passkey setup
    await expect(page.locator('text=Thiết lập Passkey')).toBeVisible();
    await page.click('button:has-text("Tạo Passkey")');
    
    // Should be at chats
    await expect(page).toHaveURL(/\/chats/);
    
    // Navigate to verify
    await page.goto('/verify');
    await expect(page.locator('h1:has-text("Xác minh chữ ký")')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/verify.png', fullPage: true });
  });

  test('All pages are accessible', async ({ page, context }) => {
    // Set onboarded
    await context.addCookies([]);
    await page.addInitScript(() => {
      localStorage.setItem('atlas_onboarded', 'true');
      localStorage.setItem('atlas_username', 'Test');
    });

    const pages = ['/chats', '/settings', '/trust', '/verify'];
    
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});
