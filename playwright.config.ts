import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL;

// Enforce PROD-only URLs
if (BASE_URL && !BASE_URL.match(/^https:\/\/atlas-(proof-messenger|admin-insights|dev-portal)\.vercel\.app$/)) {
  throw new Error('BLOCKER_LOCALHOST');
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL || 'https://atlas-proof-messenger.vercel.app',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'sku-basic',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL || 'https://atlas-proof-messenger.vercel.app'
      },
    },
    {
      name: 'sku-pro',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: BASE_URL || 'https://atlas-proof-messenger.vercel.app'
      },
    },
  ],
});