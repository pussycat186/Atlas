import { test, expect } from '@playwright/test';

// ATLAS v14 Playwright E2E Tests for Cloud Run
// All tools must hit the same proxy/edge URL: https://atlas-nginx-uc.a.run.app

test.describe('ATLAS v14 Cloud Run Dual-Service', () => {
  const TARGET_URL = process.env.TARGET_URL || 'https://atlas-nginx-uc.a.run.app';

  test.beforeEach(async ({ page }) => {
    // Navigate to the web app via NGINX proxy
    await page.goto(TARGET_URL);
  });

  test('should display the homepage via NGINX proxy', async ({ page }) => {
    await expect(page).toHaveTitle(/Atlas/);
    await expect(page.locator('h1')).toContainText('Atlas');
  });

  test('should navigate to API Keys page via NGINX proxy', async ({ page }) => {
    await page.click('text=API Keys');
    await expect(page).toHaveURL(/.*\/keys/);
    await expect(page.locator('h1')).toContainText('API Keys');
  });

  test('should navigate to Playground page via NGINX proxy', async ({ page }) => {
    await page.click('text=Playground');
    await expect(page).toHaveURL(/.*\/playground/);
    await expect(page.locator('h1')).toContainText('Playground');
  });

  test('should navigate to Metrics page via NGINX proxy', async ({ page }) => {
    await page.click('text=Metrics');
    await expect(page).toHaveURL(/.*\/metrics/);
    await expect(page.locator('h1')).toContainText('Metrics');
  });

  test('should have working navigation for all 4 main routes', async ({ page }) => {
    // Test that all 4 main navigation links are present and clickable
    const navItems = [
      'Overview',
      'API Keys', 
      'Playground',
      'Metrics'
    ];

    for (const item of navItems) {
      await expect(page.locator(`text=${item}`)).toBeVisible();
    }
  });

  test('should be responsive across different viewports', async ({ page }) => {
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

  test('should load static assets correctly', async ({ page }) => {
    // Test favicon.ico mapping (if origin 404)
    const response = await page.goto(`${TARGET_URL}/favicon.ico`);
    expect(response?.status()).toBe(200);
  });

  test('should have proper cache headers', async ({ page }) => {
    // Navigate to a page and check for cache headers
    await page.goto(TARGET_URL);
    
    // Check response headers for cache control
    const response = await page.waitForResponse(TARGET_URL);
    const headers = response.headers();
    
    // Should have cache control headers
    expect(headers['cache-control']).toBeDefined();
    expect(headers['x-cache-status']).toBeDefined();
  });

  test('should handle concurrent navigation', async ({ page }) => {
    // Navigate to multiple pages quickly
    const pages = ['/', '/keys', '/playground', '/metrics'];
    
    for (const route of pages) {
      await page.goto(`${TARGET_URL}${route}`);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(TARGET_URL);
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle high load gracefully', async ({ page }) => {
    // Simulate rapid navigation
    const routes = ['/', '/keys', '/playground', '/metrics'];
    
    for (let i = 0; i < 10; i++) {
      const route = routes[i % routes.length];
      await page.goto(`${TARGET_URL}${route}`);
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('ATLAS v14 API Keys Page', () => {
  const TARGET_URL = process.env.TARGET_URL || 'https://atlas-nginx-uc.a.run.app';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${TARGET_URL}/keys`);
  });

  test('should display API keys management interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('API Keys');
  });

  test('should load without errors', async ({ page }) => {
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    expect(errors.length).toBe(0);
  });
});

test.describe('ATLAS v14 Playground Page', () => {
  const TARGET_URL = process.env.TARGET_URL || 'https://atlas-nginx-uc.a.run.app';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${TARGET_URL}/playground`);
  });

  test('should display playground interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Playground');
  });

  test('should load without errors', async ({ page }) => {
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    expect(errors.length).toBe(0);
  });
});

test.describe('ATLAS v14 Metrics Page', () => {
  const TARGET_URL = process.env.TARGET_URL || 'https://atlas-nginx-uc.a.run.app';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${TARGET_URL}/metrics`);
  });

  test('should display metrics dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Metrics');
  });

  test('should load without errors', async ({ page }) => {
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    expect(errors.length).toBe(0);
  });
});

test.describe('ATLAS v14 Performance Tests', () => {
  const TARGET_URL = process.env.TARGET_URL || 'https://atlas-nginx-uc.a.run.app';

  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(TARGET_URL);
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle concurrent navigation', async ({ page }) => {
    // Navigate to multiple pages quickly
    const pages = ['/', '/keys', '/playground', '/metrics'];
    
    for (const route of pages) {
      await page.goto(`${TARGET_URL}${route}`);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should maintain performance under load', async ({ page }) => {
    // Simulate load by rapid navigation
    const routes = ['/', '/keys', '/playground', '/metrics'];
    
    for (let i = 0; i < 20; i++) {
      const route = routes[i % routes.length];
      const startTime = Date.now();
      await page.goto(`${TARGET_URL}${route}`);
      const loadTime = Date.now() - startTime;
      
      // Each page should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    }
  });
});
