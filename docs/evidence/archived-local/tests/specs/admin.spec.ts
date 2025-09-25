import { test, expect } from '@playwright/test';

test('Admin metrics page loads and shows data', async ({ page }) => {
  await page.goto('/metrics');
  
  // Check that metrics cards exist
  await expect(page.getByTestId('rps-card')).toBeVisible();
  await expect(page.getByTestId('p95-card')).toBeVisible();
  await expect(page.getByTestId('error-rate-card')).toBeVisible();
  await expect(page.getByTestId('witness-quorum-card')).toBeVisible();
  
  // Check that at least one numeric value is displayed
  const rpsValue = page.getByTestId('rps-value');
  await expect(rpsValue).toBeVisible();
  
  // Record all network URLs and assert none contain localhost
  const requests: string[] = [];
  page.on('request', request => {
    requests.push(request.url());
  });
  
  await page.waitForLoadState('networkidle');
  
  const localhostRequests = requests.filter(url => url.includes('localhost'));
  expect(localhostRequests).toHaveLength(0);
});
