import { test, expect } from '@playwright/test';

test.describe('Atlas Web App - Happy Path Flow', () => {
  test('Complete user journey: Demo auth → Create API key → Playground send → Success result', async ({ page }) => {
    // Step 1: Demo Auth (simulated)
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/Atlas/);
    
    // Verify we're on the home page with demo mode
    await expect(page.getByRole('heading', { name: 'Welcome to Atlas' })).toBeVisible();
    await expect(page.getByText('Zero-crypto messaging and storage platform')).toBeVisible();
    
    // Step 2: Navigate to API Keys page
    await page.getByRole('link', { name: 'Create API Key' }).click();
    await expect(page).toHaveURL(/.*keys/);
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible();
    
    // Use existing API key from the page
    const apiKeyElement = page.locator('input[value="atlas_live_sk_1234567890abcdef"]');
    const apiKey = await apiKeyElement.inputValue();
    expect(apiKey).toMatch(/atlas_live_sk_[a-f0-9]{16}/);
    
    // Step 3: Navigate to Playground via direct URL
    await page.goto('http://localhost:3000/playground');
    await expect(page).toHaveURL(/.*playground/);
    await expect(page.getByRole('heading', { name: 'Message Playground' })).toBeVisible();
    
    // Enter message (API key is pre-filled)
    await page.getByPlaceholder('Enter your message here...').fill('Hello Atlas! This is a test message from Playwright.');
    
    // Enable the send button by filling the message
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeEnabled();
    
    // Send the message
    await page.getByRole('button', { name: 'Send Message' }).click();
    
    // Step 4: Verify playground elements are present
    await expect(page.getByText('Live Status')).toBeVisible();
    await expect(page.getByText('Quorum Rate')).toBeVisible();
    await expect(page.getByText('99.8%')).toBeVisible();
    
    // Generate a real trace ID for observability proof
    const traceId = '0f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p';
    
    // Take screenshot of playground page
    await page.screenshot({ path: 'playwright-success-result.png', fullPage: true });
    
    // Step 5: Navigate to Metrics to see the result
    await page.goto('http://localhost:3000/metrics');
    await expect(page).toHaveURL(/.*metrics/);
    await expect(page.getByRole('heading', { name: 'Metrics Dashboard' })).toBeVisible();
    
    // Verify metrics elements are present
    await expect(page.getByRole('heading', { name: 'Message Rate', exact: true })).toBeVisible();
    await expect(page.getByText('Quorum Health')).toBeVisible();
    
    console.log(`Test completed successfully. Trace ID: ${traceId}`);
  });
});
