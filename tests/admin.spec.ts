import { test, expect } from '@playwright/test';
import 'dotenv/config';

const BASE = process.env.BASE_URL!; // set by CI to the Vercel Preview URL

test.describe('Atlas Admin Insights', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/metrics`);
  });

  test('Metrics page loads and displays data', async ({ page }) => {
    // Check page title
    await expect(page.getByTestId('metrics-title')).toBeVisible();
    
    // Check metrics cards are visible
    await expect(page.getByTestId('metrics-cards')).toBeVisible();
    await expect(page.getByTestId('rps-card')).toBeVisible();
    await expect(page.getByTestId('p95-card')).toBeVisible();
    await expect(page.getByTestId('error-rate-card')).toBeVisible();
    await expect(page.getByTestId('witness-quorum-card')).toBeVisible();
  });

  test('Metrics values are displayed', async ({ page }) => {
    // Wait for metrics to load
    await page.waitForTimeout(2000);
    
    // Check that metrics have values (not just 0)
    const rpsValue = page.getByTestId('rps-value');
    const p95Value = page.getByTestId('p95-value');
    const errorRateValue = page.getByTestId('error-rate-value');
    const witnessQuorumValue = page.getByTestId('witness-quorum-value');
    
    await expect(rpsValue).toBeVisible();
    await expect(p95Value).toBeVisible();
    await expect(errorRateValue).toBeVisible();
    await expect(witnessQuorumValue).toBeVisible();
  });

  test('System health metrics display', async ({ page }) => {
    // Check uptime card
    await expect(page.getByTestId('uptime-card')).toBeVisible();
    await expect(page.getByTestId('uptime-value')).toBeVisible();
    
    // Check records card
    await expect(page.getByTestId('records-card')).toBeVisible();
    await expect(page.getByTestId('total-records-value')).toBeVisible();
    await expect(page.getByTestId('verified-records-value')).toBeVisible();
    await expect(page.getByTestId('pending-records-value')).toBeVisible();
    
    // Check health score card
    await expect(page.getByTestId('health-score-card')).toBeVisible();
    await expect(page.getByTestId('health-score-value')).toBeVisible();
  });

  test('Timeline scrubber functionality', async ({ page }) => {
    // Check timeline card is visible
    await expect(page.getByTestId('timeline-card')).toBeVisible();
    
    // Check time range selector
    const timeRangeSelect = page.getByTestId('time-range-select');
    await expect(timeRangeSelect).toBeVisible();
    
    // Test time range change
    await timeRangeSelect.selectOption('24h');
    await expect(timeRangeSelect).toHaveValue('24h');
  });

  test('No localhost requests in network', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto(`${BASE}/metrics`);
    await page.waitForLoadState('networkidle');
    
    // Check no localhost requests
    const localhostRequests = requests.filter(url => url.includes('localhost'));
    expect(localhostRequests).toHaveLength(0);
  });
});
