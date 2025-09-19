import { test, expect } from '@playwright/test';

// @legacy - These tests are for the old Atlas v12 UI and need to be migrated to the new Atlas Proof Messenger interface
test.describe('Atlas v12 Web App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the web app (assuming it's running on port 3006)
    await page.goto('http://localhost:3006');
  });

  test('should display the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Atlas v12/);
    await expect(page.locator('h1')).toContainText('Atlas v12');
  });

  test('should navigate to API Keys page', async ({ page }) => {
    await page.click('text=API Keys');
    await expect(page).toHaveURL(/.*\/keys/);
    await expect(page.locator('h1')).toContainText('API Keys');
  });

  test('should navigate to Playground page', async ({ page }) => {
    await page.click('text=Playground');
    await expect(page).toHaveURL(/.*\/playground/);
    await expect(page.locator('h1')).toContainText('Ingest Playground');
  });

  test('should navigate to Witness Status page', async ({ page }) => {
    await page.click('text=Witness Status');
    await expect(page).toHaveURL(/.*\/witness/);
    await expect(page.locator('h1')).toContainText('Witness Network Status');
  });

  test('should navigate to Metrics page', async ({ page }) => {
    await page.click('text=Metrics View');
    await expect(page).toHaveURL(/.*\/metrics/);
    await expect(page.locator('h1')).toContainText('Metrics Dashboard');
  });

  test('should navigate to Docs page', async ({ page }) => {
    await page.click('text=Docs Pane');
    await expect(page).toHaveURL(/.*\/docs/);
    await expect(page.locator('h1')).toContainText('Documentation');
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should navigate to Admin Dashboard', async ({ page }) => {
    await page.click('text=Admin Dashboard');
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should display demo mode indicator', async ({ page }) => {
    await expect(page.locator('text=DEMO MODE')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Test that all navigation links are present and clickable
    const navItems = [
      'Overview',
      'API Keys', 
      'Playground',
      'Witness Status',
      'Metrics View',
      'Docs Pane',
      'Settings'
    ];

    for (const item of navItems) {
      await expect(page.locator(`text=${item}`)).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Atlas v12 API Keys Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/keys');
  });

  test('should display API keys management interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('API Keys');
    await expect(page.locator('text=Generate New Key')).toBeVisible();
  });

  test('should allow generating new API key', async ({ page }) => {
    await page.fill('input[placeholder*="New API Key Name"]', 'Test Key');
    await page.click('button:has-text("Generate New Key")');
    
    // Should show the new key in the list
    await expect(page.locator('text=Test Key')).toBeVisible();
  });

  test('should allow copying API key', async ({ page }) => {
    // Generate a key first
    await page.fill('input[placeholder*="New API Key Name"]', 'Copy Test Key');
    await page.click('button:has-text("Generate New Key")');
    
    // Click copy button
    await page.click('button[title="Copy Key"]');
    
    // Should show alert (in real app, this would be a toast)
    // For now, just verify the button is clickable
    await expect(page.locator('button[title="Copy Key"]')).toBeVisible();
  });
});

test.describe('Atlas v12 Playground Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/playground');
  });

  test('should display ingest playground interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ingest Playground');
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button:has-text("Send to Gateway")')).toBeVisible();
  });

  test('should allow sending test message', async ({ page }) => {
    await page.fill('textarea', '{"test": "message", "timestamp": "2024-01-01T00:00:00Z"}');
    await page.click('button:has-text("Send to Gateway")');
    
    // Should show loading state
    await expect(page.locator('text=Ingesting...')).toBeVisible();
    
    // Wait for response (mock will take ~1.5s)
    await page.waitForSelector('text=Gateway Response', { timeout: 5000 });
    await expect(page.locator('text=Gateway Response')).toBeVisible();
  });

  test('should handle error cases', async ({ page }) => {
    await page.fill('textarea', '{"test": "fail"}');
    await page.click('button:has-text("Send to Gateway")');
    
    // Should show error
    await page.waitForSelector('text=Error', { timeout: 5000 });
    await expect(page.locator('text=Error')).toBeVisible();
  });
});

test.describe('Atlas v12 Witness Status Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/witness');
  });

  test('should display witness network status', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Witness Network Status');
    await expect(page.locator('text=Quorum Status')).toBeVisible();
  });

  test('should show individual witness nodes', async ({ page }) => {
    // Wait for witness data to load
    await page.waitForSelector('text=W1', { timeout: 5000 });
    
    const witnessNodes = ['W1', 'W2', 'W3', 'W4', 'W5'];
    for (const node of witnessNodes) {
      await expect(page.locator(`text=${node}`)).toBeVisible();
    }
  });

  test('should display quorum status', async ({ page }) => {
    await page.waitForSelector('text=Quorum Status', { timeout: 5000 });
    await expect(page.locator('text=Required: 4/5 witnesses')).toBeVisible();
  });
});

test.describe('Atlas v12 Metrics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/metrics');
  });

  test('should display metrics dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Metrics Dashboard');
    await expect(page.locator('text=Message Rate')).toBeVisible();
    await expect(page.locator('text=Latency P50')).toBeVisible();
    await expect(page.locator('text=Latency P95')).toBeVisible();
    await expect(page.locator('text=Error Rate')).toBeVisible();
  });

  test('should show time range controls', async ({ page }) => {
    const timeRanges = ['1 Hour', '6 Hours', '24 Hours', '7 Days'];
    for (const range of timeRanges) {
      await expect(page.locator(`button:has-text("${range}")`)).toBeVisible();
    }
  });

  test('should display Grafana link', async ({ page }) => {
    await expect(page.locator('text=Advanced Metrics')).toBeVisible();
    await expect(page.locator('a:has-text("Open Grafana")')).toBeVisible();
  });
});

test.describe('Atlas v12 Docs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/docs');
  });

  test('should display documentation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Documentation');
    await expect(page.locator('text=Quick Start')).toBeVisible();
    await expect(page.locator('text=API Reference')).toBeVisible();
    await expect(page.locator('text=Examples')).toBeVisible();
    await expect(page.locator('text=Troubleshooting')).toBeVisible();
  });

  test('should allow switching between sections', async ({ page }) => {
    await page.click('text=API Reference');
    await expect(page.locator('text=API Reference')).toHaveClass(/bg-primary/);
    
    await page.click('text=Examples');
    await expect(page.locator('text=Examples')).toHaveClass(/bg-primary/);
  });

  test('should display code examples', async ({ page }) => {
    await expect(page.locator('pre')).toBeVisible();
    await expect(page.locator('button:has-text("Copy")')).toBeVisible();
  });
});

test.describe('Atlas v12 Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/settings');
  });

  test('should display settings interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('text=General Settings')).toBeVisible();
    await expect(page.locator('text=API Settings')).toBeVisible();
    await expect(page.locator('text=Security Settings')).toBeVisible();
    await expect(page.locator('text=Advanced Settings')).toBeVisible();
  });

  test('should allow changing theme', async ({ page }) => {
    await page.click('text=Theme');
    await expect(page.locator('text=Light')).toBeVisible();
    await expect(page.locator('text=Dark')).toBeVisible();
    await expect(page.locator('text=System')).toBeVisible();
  });

  test('should allow changing language', async ({ page }) => {
    await page.click('text=Language');
    await expect(page.locator('text=English')).toBeVisible();
  });

  test('should display danger zone', async ({ page }) => {
    await expect(page.locator('text=Danger Zone')).toBeVisible();
    await expect(page.locator('text=Delete Account')).toBeVisible();
  });
});

test.describe('Atlas v12 Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/admin');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=DEMO MODE')).toBeVisible();
  });

  test('should show system stats', async ({ page }) => {
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Sessions')).toBeVisible();
    await expect(page.locator('text=Total Messages')).toBeVisible();
    await expect(page.locator('text=System Uptime')).toBeVisible();
  });

  test('should allow switching between tabs', async ({ page }) => {
    const tabs = ['Overview', 'Users', 'Witnesses', 'Security', 'System'];
    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await expect(page.locator(`text=${tab}`)).toHaveClass(/bg-white/);
    }
  });

  test('should display recent activity', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    await expect(page.locator('text=Latest system events')).toBeVisible();
  });
});
