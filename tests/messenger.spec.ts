import { test, expect } from '@playwright/test';
import 'dotenv/config';

const BASE = process.env.BASE_URL!; // set by CI to the Vercel Preview URL

test.describe('Atlas Proof Messenger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/');
  });

  test('Send → Receipt → Verified', async ({ page }) => {
    // Fill in message
    await page.getByRole('textbox', { name: /message/i }).fill('Hello Atlas');
    
    // Click send button
    await page.getByRole('button', { name: /send/i }).click();
    
    // Wait for receipt to appear
    await expect(page.getByText(/receipt|id|sent/i)).toBeVisible({ timeout: 8000 });
    
    // Click verify button
    await page.getByRole('button', { name: /verify/i }).click();
    
    // Wait for verified status
    await expect(page.getByText(/verified/i)).toBeVisible({ timeout: 8000 });
  });

  test('Thread open/close + reply binds', async ({ page }) => {
    // Click on a message bubble to open thread
    await page.getByText(/welcome|click a bubble/i).first().click();
    
    // Check thread is visible
    await expect(page.getByText(/thread/i)).toBeVisible();
    await expect(page.getByText(/reply/i)).toBeVisible();
  });

  test('Connection status indicator', async ({ page }) => {
    // Check connection indicator is visible
    await expect(page.getByTestId('connection-indicator')).toBeVisible();
    await expect(page.getByTestId('connection-status')).toBeVisible();
  });

  test('Message input validation', async ({ page }) => {
    // Test empty message validation
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeDisabled();
    
    // Test character count
    await page.getByRole('textbox', { name: /message/i }).fill('Test message');
    await expect(page.getByText(/11\/280/)).toBeVisible();
  });

  test('Message list displays correctly', async ({ page }) => {
    // Check message list is visible
    await expect(page.getByTestId('message-list')).toBeVisible();
    
    // Check stats overview
    await expect(page.getByTestId('total-messages-value')).toBeVisible();
    await expect(page.getByTestId('verified-messages-value')).toBeVisible();
    await expect(page.getByTestId('pending-messages-value')).toBeVisible();
  });

  test('Quantum state information displays', async ({ page }) => {
    // Check quantum state card is visible
    await expect(page.getByTestId('quantum-state-info')).toBeVisible();
    await expect(page.getByTestId('quantum-phase')).toBeVisible();
    await expect(page.getByTestId('quantum-crystals')).toBeVisible();
    await expect(page.getByTestId('quantum-channels')).toBeVisible();
  });
});
