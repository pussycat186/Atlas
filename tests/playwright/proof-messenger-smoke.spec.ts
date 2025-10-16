import { test, expect } from '@playwright/test';

test.describe('Proof Messenger Smoke Tests', () => {
  test('should have prism marker and basic interactions', async ({ page }) => {
    await page.goto('https://atlas-proof-messenger.vercel.app/prism');
    
    // Check prism marker
    await expect(page.getByTestId('prism-marker')).toContainText('ATLAS • Prism UI — Peak Preview');
    
    // Check basic elements exist
    await expect(page.getByRole('heading', { name: 'Atlas Prism Preview' })).toBeVisible();
    
    // Check if send button exists (may not have proper label yet)
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeVisible();
    
    // Check message input
    const messageInput = page.getByTestId('message-input');
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Test message');
    
    // Check command palette trigger
    const paletteButton = page.getByTestId('command-palette-trigger');
    await expect(paletteButton).toBeVisible();
  });
});