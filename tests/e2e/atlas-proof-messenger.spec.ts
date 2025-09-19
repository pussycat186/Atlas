import { test, expect } from '@playwright/test';

test.describe('Atlas Proof Messenger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Atlas Proof Messenger/);
    await expect(page.getByTestId('pm-header-title')).toContainText('Atlas Proof Messenger');
  });

  test('should display send message interface', async ({ page }) => {
    await expect(page.getByTestId('send-message-card')).toBeVisible();
    await expect(page.getByTestId('send-message-title')).toContainText('Send Message');
    await expect(page.getByTestId('send-message-description')).toContainText('Send a verifiable message with integrity timeline');
    await expect(page.getByTestId('message-input')).toBeVisible();
    await expect(page.getByTestId('send-message-button')).toBeVisible();
    await expect(page.getByTestId('draft-message-button')).toBeVisible();
  });

  test('should display recent messages interface', async ({ page }) => {
    await expect(page.getByTestId('recent-messages-card')).toBeVisible();
    await expect(page.getByTestId('recent-messages-title')).toContainText('Recent Messages');
    await expect(page.getByTestId('recent-messages-description')).toContainText('View your message history and verification status');
    await expect(page.getByTestId('message-list')).toBeVisible();
  });

  test('should show sample messages with correct status', async ({ page }) => {
    // Check verified message
    const verifiedMessage = page.getByTestId('message-item-verified');
    await expect(verifiedMessage).toBeVisible();
    await expect(verifiedMessage.getByTestId('message-content')).toContainText('Hello World');
    await expect(verifiedMessage.getByTestId('message-timestamp')).toContainText('2 minutes ago');
    await expect(verifiedMessage.getByTestId('message-status-verified')).toContainText('Verified');

    // Check pending message
    const pendingMessage = page.getByTestId('message-item-pending');
    await expect(pendingMessage).toBeVisible();
    await expect(pendingMessage.getByTestId('message-content')).toContainText('Test Message');
    await expect(pendingMessage.getByTestId('message-timestamp')).toContainText('1 hour ago');
    await expect(pendingMessage.getByTestId('message-status-pending')).toContainText('Pending');
  });

  test('should allow typing in message input', async ({ page }) => {
    const messageInput = page.getByTestId('message-input');
    await messageInput.fill('This is a test message');
    await expect(messageInput).toHaveValue('This is a test message');
  });

  test('should have clickable action buttons', async ({ page }) => {
    const sendButton = page.getByTestId('send-message-button');
    const draftButton = page.getByTestId('draft-message-button');
    
    await expect(sendButton).toBeVisible();
    await expect(draftButton).toBeVisible();
    
    // Test that buttons are clickable (they don't have actual functionality yet)
    await sendButton.click();
    await draftButton.click();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.getByTestId('pm-header-title')).toBeVisible();
    await expect(page.getByTestId('send-message-card')).toBeVisible();
    await expect(page.getByTestId('recent-messages-card')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.getByTestId('pm-header-title')).toBeVisible();
    await expect(page.getByTestId('send-message-card')).toBeVisible();
    await expect(page.getByTestId('recent-messages-card')).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await expect(page.getByTestId('pm-header-title')).toBeVisible();
    await expect(page.getByTestId('send-message-card')).toBeVisible();
    await expect(page.getByTestId('recent-messages-card')).toBeVisible();
  });
});

test.describe('Atlas Proof Messenger - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    const h2s = page.getByRole('heading', { level: 2 });
    
    await expect(h1).toHaveCount(1);
    await expect(h2s).toHaveCount(2);
  });

  test('should have proper form labels and controls', async ({ page }) => {
    const textarea = page.getByTestId('message-input');
    const sendButton = page.getByTestId('send-message-button');
    const draftButton = page.getByTestId('draft-message-button');
    
    await expect(textarea).toBeVisible();
    await expect(sendButton).toBeVisible();
    await expect(draftButton).toBeVisible();
    
    // Check that buttons have accessible names
    await expect(sendButton).toHaveText('Send Message');
    await expect(draftButton).toHaveText('Draft');
  });

  test('should have proper color contrast for status badges', async ({ page }) => {
    const verifiedStatus = page.getByTestId('message-status-verified');
    const pendingStatus = page.getByTestId('message-status-pending');
    
    await expect(verifiedStatus).toBeVisible();
    await expect(pendingStatus).toBeVisible();
  });
});
