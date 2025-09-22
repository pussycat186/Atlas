import { test, expect } from '@playwright/test';
import 'dotenv/config';

const BASE = process.env.BASE_URL!; // set by CI to the Vercel Preview URL

test.describe('Atlas Dev Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE + '/');
  });

  test('Portal loads and displays content', async ({ page }) => {
    // Check main elements
    await expect(page.getByTestId('dev-portal')).toBeVisible();
    await expect(page.getByTestId('portal-title')).toBeVisible();
    await expect(page.getByTestId('portal-description')).toBeVisible();
  });

  test('Hero section displays correctly', async ({ page }) => {
    // Check hero buttons
    await expect(page.getByTestId('quick-start-button')).toBeVisible();
    await expect(page.getByTestId('view-docs-button')).toBeVisible();
    await expect(page.getByTestId('command-palette-button')).toBeVisible();
  });

  test('Features grid displays', async ({ page }) => {
    // Check features are visible
    await expect(page.getByTestId('features-grid')).toBeVisible();
    await expect(page.getByTestId('feature-card-zero-crypto-verification')).toBeVisible();
    await expect(page.getByTestId('feature-card-multi-witness-quorum')).toBeVisible();
    await expect(page.getByTestId('feature-card-idempotent-operations')).toBeVisible();
    await expect(page.getByTestId('feature-card-real-time-monitoring')).toBeVisible();
  });

  test('Code examples functionality', async ({ page }) => {
    // Check code examples card
    await expect(page.getByTestId('code-examples-card')).toBeVisible();
    await expect(page.getByTestId('code-examples-title')).toBeVisible();
    await expect(page.getByTestId('code-examples-description')).toBeVisible();
    
    // Check language tabs
    await expect(page.getByTestId('language-tabs')).toBeVisible();
    await expect(page.getByTestId('language-tab-javascript')).toBeVisible();
    await expect(page.getByTestId('language-tab-python')).toBeVisible();
    await expect(page.getByTestId('language-tab-curl')).toBeVisible();
  });

  test('Copy button yields snippet containing production gatewayUrl', async ({ page }) => {
    // Click copy button
    const copyButton = page.getByRole('button', { name: /copy/i }).first();
    await copyButton.click();
    
    // Check clipboard contains production URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('atlas-gateway.sonthenguyen186.workers.dev');
  });

  test('Language switching works', async ({ page }) => {
    // Switch to Python
    await page.getByTestId('language-tab-python').click();
    await expect(page.getByTestId('language-tab-python')).toHaveAttribute('aria-selected', 'true');
    
    // Switch to cURL
    await page.getByTestId('language-tab-curl').click();
    await expect(page.getByTestId('language-tab-curl')).toHaveAttribute('aria-selected', 'true');
    
    // Switch back to JavaScript
    await page.getByTestId('language-tab-javascript').click();
    await expect(page.getByTestId('language-tab-javascript')).toHaveAttribute('aria-selected', 'true');
  });

  test('SDK downloads section displays', async ({ page }) => {
    // Check SDK downloads are visible
    const sdkSection = page.locator('h2:has-text("SDK Downloads")');
    await expect(sdkSection).toBeVisible();
    
    // Check individual SDK cards
    const sdkCards = page.locator('[data-testid*="sdk"]');
    await expect(sdkCards).toHaveCount(3);
  });

  test('API reference section displays', async ({ page }) => {
    // Check API reference card
    const apiCard = page.locator('h3:has-text("Core Endpoints")');
    await expect(apiCard).toBeVisible();
    
    // Check endpoint examples
    const postEndpoint = page.locator('code:has-text("POST /record")');
    const getEndpoint = page.locator('code:has-text("GET /record/:id")');
    await expect(postEndpoint).toBeVisible();
    await expect(getEndpoint).toBeVisible();
  });

  test('What/Why/Verify/Rollback cards display', async ({ page }) => {
    // Check all four cards are visible
    const whatCard = page.locator('h3:has-text("What")');
    const whyCard = page.locator('h3:has-text("Why")');
    const verifyCard = page.locator('h3:has-text("Verify")');
    const rollbackCard = page.locator('h3:has-text("Rollback")');
    
    await expect(whatCard).toBeVisible();
    await expect(whyCard).toBeVisible();
    await expect(verifyCard).toBeVisible();
    await expect(rollbackCard).toBeVisible();
  });

  test('No localhost requests in network', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    
    // Check no localhost requests
    const localhostRequests = requests.filter(url => url.includes('localhost'));
    expect(localhostRequests).toHaveLength(0);
  });
});

