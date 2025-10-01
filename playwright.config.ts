import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  retries: 2,
  reporter: [['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'admin', use: { ...devices['Desktop Chrome'], baseURL: process.env.BASE_ADMIN } },
    { name: 'dev',   use: { ...devices['Desktop Chrome'], baseURL: process.env.BASE_DEV   } },
    { name: 'proof', use: { ...devices['Desktop Chrome'], baseURL: process.env.BASE_PROOF } },
  ],
});