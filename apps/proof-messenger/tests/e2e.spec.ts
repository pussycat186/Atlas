// E2E Tests for Proof Messenger
import { test, expect } from '@playwright/test';

test.describe('Proof Messenger - User Journey', () => {
  test('Onboarding flow → Chats', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Check welcome screen
    await expect(page.locator('text=Chào mừng đến Atlas')).toBeVisible();
    await expect(page.locator('text=E2EE')).toBeVisible();

    // Click "Bắt đầu"
    await page.click('button:has-text("Bắt đầu")');

    // Passkey screen
    await expect(page.locator('text=Tạo Passkey')).toBeVisible();

    // Simulate passkey creation (stub)
    await page.click('button:has-text("Tạo Passkey")');

    // Wait for redirect to /chats
    await page.waitForURL('/chats', { timeout: 5000 });

    // Verify chats page loaded
    await expect(page.locator('h1:has-text("Tin nhắn")')).toBeVisible();
  });

  test('Send message → Verified badge shown', async ({ page }) => {
    // Go directly to a chat
    await page.goto('/chats/family');

    // Check security badge in header
    await expect(page.locator('text=E2EE')).toBeVisible();
    await expect(page.locator('text=Bound')).toBeVisible();

    // Type a message
    await page.fill('textarea[aria-label="Message input"]', 'Test message for verification');

    // Send message
    await page.click('button[aria-label="Send message"]');

    // Wait for message to appear
    await expect(page.locator('text=Test message for verification')).toBeVisible();

    // Check for "Verified" badge
    await expect(page.locator('text=Verified').last()).toBeVisible();
  });

  test('Click "Xem xác minh" → Receipt modal opens', async ({ page }) => {
    // Navigate to chat with existing messages
    await page.goto('/chats/family');

    // Click first "Verified" badge
    await page.click('button:has-text("Verified")');

    // Check receipt modal opened
    await expect(page.locator('text=Xác minh tin nhắn')).toBeVisible();
    await expect(page.locator('text=Đã xác minh')).toBeVisible();
    await expect(page.locator('text=Receipt JSON')).toBeVisible();

    // Check for metadata display
    await expect(page.locator('text=Key ID:')).toBeVisible();
    await expect(page.locator('text=Algorithm:')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Đóng")');

    // Modal should be gone
    await expect(page.locator('text=Xác minh tin nhắn')).not.toBeVisible();
  });

  test('/verify → Paste receipt → Valid result', async ({ page }) => {
    // Navigate to verify page
    await page.goto('/verify');

    // Check page loaded
    await expect(page.locator('h1:has-text("Xác minh tin nhắn")')).toBeVisible();

    // Sample receipt JSON
    const receipt = {
      message: 'SGVsbG8gV29ybGQ=',
      signature: 'sig1=:MEUCIQDtest...:',
      metadata: {
        kid: 'kid-2024-10',
        algorithm: 'ecdsa-p256-sha256',
        created: 1697500800,
        verified: true
      }
    };

    // Paste receipt
    await page.fill('textarea', JSON.stringify(receipt, null, 2));

    // Click verify button
    await page.click('button:has-text("Xác minh")');

    // Wait for verification result
    await expect(page.locator('text=Xác minh thành công')).toBeVisible({ timeout: 5000 });

    // Check metadata displayed
    await expect(page.locator('text=kid-2024-10')).toBeVisible();
    await expect(page.locator('text=ecdsa-p256-sha256')).toBeVisible();
  });

  test('Accessibility - Large text navigation', async ({ page }) => {
    // Navigate to chats
    await page.goto('/chats');

    // Check search input has aria-label
    const searchInput = page.locator('input[aria-label="Search chats"]');
    await expect(searchInput).toBeVisible();

    // Check bottom navigation has labels
    await expect(page.locator('text=Tin nhắn')).toBeVisible();
    await expect(page.locator('text=Liên hệ')).toBeVisible();
    await expect(page.locator('text=Xác minh')).toBeVisible();
    await expect(page.locator('text=Bảo mật')).toBeVisible();

    // Navigate to settings
    await page.click('button[aria-label="Settings"]');

    // Enable large text mode
    await page.goto('/settings');
    await expect(page.locator('text=Hiển thị lớn')).toBeVisible();
  });

  test('Security page - DPoP and PQC controls', async ({ page }) => {
    // Navigate to security page
    await page.goto('/security');

    // Check DPoP toggle exists
    await expect(page.locator('text=DPoP Binding')).toBeVisible();

    // Check PQC slider exists
    await expect(page.locator('text=Post-Quantum Cryptography')).toBeVisible();

    // Check JWKS download button
    await expect(page.locator('button:has-text("Tải JWKS")')).toBeVisible();

    // Simulate JWKS download (download event)
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Tải JWKS")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('jwks.json');
  });

  test('Complete user flow - Onboard → Chat → Verify', async ({ page }) => {
    // 1. Onboarding
    await page.goto('/onboarding');
    await page.click('button:has-text("Bắt đầu")');
    await page.click('button:has-text("Tạo Passkey")');
    await page.waitForURL('/chats');

    // 2. Navigate to chat
    await page.click('text=Gia đình');
    await expect(page.locator('h1:has-text("Gia đình")')).toBeVisible();

    // 3. Send message
    await page.fill('textarea', 'Complete flow test');
    await page.press('textarea', 'Enter');

    // 4. Verify badge appears
    await expect(page.locator('text=Verified').last()).toBeVisible();

    // 5. Open receipt modal
    await page.click('button:has-text("Verified")');
    await expect(page.locator('text=Receipt JSON')).toBeVisible();

    // 6. Navigate to verify page via modal link
    await page.click('a:has-text("Xem xác minh đầy đủ")');
    await page.waitForURL(/\/verify/);
    
    // Verify page should show pre-filled receipt
    await expect(page.locator('h1:has-text("Xác minh tin nhắn")')).toBeVisible();
  });
});
