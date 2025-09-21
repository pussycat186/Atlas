import { test, expect } from '@playwright/test';

test('Messenger page loads and displays correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads
  await expect(page.getByTestId('messenger-page')).toBeVisible();
  
  // Check that the input field exists
  await expect(page.getByTestId('message-input')).toBeVisible();
  
  // Check that the send button exists (even if disabled)
  await expect(page.getByTestId('send-message-button')).toBeVisible();
  
  // Check that the message list exists
  await expect(page.getByTestId('message-list')).toBeVisible();
  
  // Check that there are some messages displayed
  const messages = page.getByTestId(/message-item-/);
  await expect(messages.first()).toBeVisible();
  
  // Check that stats are displayed
  await expect(page.getByTestId('stats-overview')).toBeVisible();
});
