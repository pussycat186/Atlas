import { test, expect } from '@playwright/test';

test('Admin metrics page loads and shows content', async ({ page }) => {
  await page.goto('/metrics');
  
  // Check that the page loads
  await expect(page).toHaveURL(/.*metrics/);
  
  // Check that there's some content on the page
  const body = await page.locator('body').textContent();
  expect(body).toBeTruthy();
  
  // Record all network URLs and assert none contain localhost
  const requests: string[] = [];
  page.on('request', request => {
    requests.push(request.url());
  });
  
  await page.waitForLoadState('networkidle');
  
  const localhostRequests = requests.filter(url => url.includes('localhost'));
  expect(localhostRequests).toHaveLength(0);
});
