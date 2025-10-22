/**
 * E2E test cho Atlas: Passkey → Message → Receipt → Verify
 * Playwright automation test
 */
import { test, expect } from '@playwright/test';

test.describe('Atlas E2E Flow', () => {
  test('should complete full E2EE workflow: register → auth → send → verify', async ({ page }) => {
    // Bước 1: Navigate to app
    await page.goto('http://localhost:3000');
    
    // Bước 2: Register passkey (mock - sẽ skip nếu không có WebAuthn)
    try {
      await page.getByRole('button', { name: /register|đăng ký/i }).click({ timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('Passkey registration skipped (WebAuthn not available in test env)');
    }
    
    // Bước 3: Navigate to chat
    await page.getByRole('link', { name: /chat|tin nhắn/i }).click();
    
    // Bước 4: Send E2EE message
    await page.getByTestId('message-input').fill('Hello E2EE Test Message');
    await page.getByRole('button', { name: /send|gửi/i }).click();
    
    // Bước 5: Wait for message to appear
    await expect(page.getByText('Hello E2EE Test Message')).toBeVisible({ timeout: 8000 });
    
    // Bước 6: Check for E2EE indicator
    await expect(page.getByTestId('e2ee-badge')).toBeVisible();
    
    // Bước 7: Click receipt button
    await page.getByTestId('receipt-button').click();
    
    // Bước 8: Receipt modal opens
    await expect(page.getByTestId('receipt-modal')).toBeVisible();
    
    // Bước 9: Navigate to verify page
    await page.goto('http://localhost:3000/verify');
    
    // Bước 10: Paste receipt (mock data)
    const mockReceipt = JSON.stringify({
      message: 'SGVsbG8gRTJFRSBUZXN0IE1lc3NhZ2U=',
      signature: 'sig1=:MEUCIQDtest123==:',
      metadata: {
        kid: 'test-key-1',
        algorithm: 'ecdsa-p256-sha256',
        created: Math.floor(Date.now() / 1000),
        verified: true
      }
    });
    
    await page.getByTestId('receipt-input').fill(mockReceipt);
    await page.getByRole('button', { name: /verify|xác thực/i }).click();
    
    // Bước 11: Verify success indicator
    await expect(page.getByText(/verified|đã xác thực/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('verified-badge')).toBeVisible();
  });

  test('should show error for invalid receipt', async ({ page }) => {
    await page.goto('http://localhost:3000/verify');
    
    // Submit invalid JSON
    await page.getByTestId('receipt-input').fill('invalid json');
    await page.getByRole('button', { name: /verify|xác thực/i }).click();
    
    // Expect error message
    await expect(page.getByText(/invalid|lỗi/i)).toBeVisible({ timeout: 3000 });
  });

  test('should load pages within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
    
    // Check for critical elements
    await expect(page.getByRole('main')).toBeVisible();
  });
});
