import { defineConfig, devices } from '@playwright/test';

// Validate BASE_URL is a production URL
const baseUrl = process.env.BASE_URL;
if (!baseUrl || !baseUrl.match(/^https:\/\/atlas-(proof-messenger|admin-insights|dev-portal)\.vercel\.app$/)) {
  console.log('BLOCKER_LOCALHOST');
  process.exit(1);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'sku-basic',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sku-pro', 
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});