import { test, expect } from '@playwright/test';

test('UI Smoke Test - Tabs and SKU Toggle', async ({ page }) => {
  await page.goto('/');

  // Check that the page loads
  await expect(page.locator('body')).toBeVisible();

  // Check SKU toggle buttons exist
  await expect(page.getByTestId('sku-basic')).toBeVisible();
  await expect(page.getByTestId('sku-pro')).toBeVisible();

  // Check tab buttons exist
  await expect(page.getByTestId('tab-messenger')).toBeVisible();
  await expect(page.getByTestId('tab-admin')).toBeVisible();
  await expect(page.getByTestId('tab-dev')).toBeVisible();

  // Test SKU toggle functionality
  await page.getByTestId('sku-pro').click();
  await expect(page.getByTestId('sku-pro')).toHaveClass(/bg-neutral-900/);
  
  await page.getByTestId('sku-basic').click();
  await expect(page.getByTestId('sku-basic')).toHaveClass(/bg-neutral-900/);

  // Test tab switching
  await page.getByTestId('tab-admin').click();
  await expect(page.getByTestId('tab-admin')).toHaveClass(/bg-neutral-900/);
  
  await page.getByTestId('tab-dev').click();
  await expect(page.getByTestId('tab-dev')).toHaveClass(/bg-neutral-900/);
  
  await page.getByTestId('tab-messenger').click();
  await expect(page.getByTestId('tab-messenger')).toHaveClass(/bg-neutral-900/);
});

test('UI Smoke Test - Pro vs Basic Differences', async ({ page }) => {
  await page.goto('/');

  // Test Basic SKU
  await page.getByTestId('sku-basic').click();
  await expect(page.getByTestId('tab-messenger')).toContainText('QuantumTag Lite');
  await expect(page.getByTestId('tab-admin')).toContainText('Overview');
  await expect(page.getByTestId('tab-dev')).toContainText('Curated');

  // Test Pro SKU
  await page.getByTestId('sku-pro').click();
  await expect(page.getByTestId('tab-messenger')).toContainText('Quantum Threads • PQC');
  await expect(page.getByTestId('tab-admin')).toContainText('Constellations • Scrub');
  await expect(page.getByTestId('tab-dev')).toContainText('Marketplace');

  // Check Pro-only elements
  await expect(page.locator('select[aria-label="Tenant"]')).toBeVisible();
  await expect(page.locator('text=/qtca\\/stream/')).toBeVisible();
});
