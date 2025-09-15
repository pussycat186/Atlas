import { test, expect } from '@playwright/test';

test('Atlas Web App - Basic Navigation', async ({ page }) => {
  // Navigate to home page
  await page.goto('http://localhost:3000');
  
  // Check page title
  await expect(page).toHaveTitle(/Atlas/);
  
  // Check main heading
  await expect(page.getByRole('heading', { name: 'Welcome to Atlas' })).toBeVisible();
  
  // Check navigation links
  await expect(page.getByRole('link', { name: 'Chat' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Drive' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  
  // Check stats cards
  await expect(page.getByText('Active Keys')).toBeVisible();
  await expect(page.getByText('Messages Sent')).toBeVisible();
  await expect(page.getByText('Quorum Rate')).toBeVisible();
  await expect(page.getByText('Avg Latency')).toBeVisible();
  
  // Check system status
  await expect(page.getByText('System Status')).toBeVisible();
  await expect(page.getByText('Gateway')).toBeVisible();
  await expect(page.getByText('Witness Nodes')).toBeVisible();
  await expect(page.getByText('Observability')).toBeVisible();
  
  // Test navigation to keys page
  await page.getByRole('link', { name: 'Create API Key' }).click();
  await expect(page).toHaveURL(/.*keys/);
  
  // Test navigation to playground
  await page.goto('http://localhost:3000');
  await page.getByRole('link', { name: 'Try Playground' }).click();
  await expect(page).toHaveURL(/.*playground/);
});

test('Atlas Web App - API Key Creation Flow', async ({ page }) => {
  // Navigate to keys page
  await page.goto('http://localhost:3000/keys');
  
  // Check page loads
  await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible();
  
  // Check create button exists
  await expect(page.getByRole('button', { name: 'Create New Key' })).toBeVisible();
  
  // Test create key flow (simulated)
  await page.getByRole('button', { name: 'Create New Key' }).click();
  
  // Check for key creation form or modal
  await expect(page.getByText('Key Name')).toBeVisible();
});

test('Atlas Web App - Playground Functionality', async ({ page }) => {
  // Navigate to playground
  await page.goto('http://localhost:3000/playground');
  
  // Check page loads
  await expect(page.getByRole('heading', { name: 'Message Playground' })).toBeVisible();
  
  // Check form elements
  await expect(page.getByPlaceholder('Enter your message')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
  
  // Test message sending (simulated)
  await page.getByPlaceholder('Enter your message').fill('Test message');
  await page.getByRole('button', { name: 'Send Message' }).click();
  
  // Check for response or status
  await expect(page.getByText('Message sent')).toBeVisible();
});

