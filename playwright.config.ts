import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'basic',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_PROOF || 'https://atlas-proof-messenger.vercel.app',
      },
    },
    {
      name: 'pro',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_PROOF || 'https://atlas-proof-messenger.vercel.app',
      },
    },
  ],
});