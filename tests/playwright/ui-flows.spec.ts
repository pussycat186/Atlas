import { test, expect } from '@playwright/test';

const APPS = [
  { name: 'proof-messenger', url: 'https://atlas-proof-messenger.vercel.app/prism' },
  { name: 'admin-insights', url: 'https://atlas-admin-insights.vercel.app/prism' },
  { name: 'dev-portal', url: 'https://atlas-dev-portal.vercel.app/prism' }
];

test.describe('Atlas UI Flows', () => {
  for (const app of APPS) {
    test.describe(app.name, () => {
      test(`should contain prism marker`, async ({ page }) => {
        await page.goto(app.url);
        await expect(page.getByTestId('prism-marker')).toContainText('ATLAS • Prism UI — Peak Preview');
      });

      test(`should have proper ARIA roles`, async ({ page }) => {
        await page.goto(app.url);
        
        const headings = page.getByRole('heading');
        await expect(headings.first()).toBeVisible();
        
        const buttons = page.getByRole('button');
        await expect(buttons.first()).toBeVisible();
      });
    });
  }

  test.describe('Proof Messenger Interactions', () => {
    test('should handle basic messaging flow', async ({ page }) => {
      await page.goto('https://atlas-proof-messenger.vercel.app/prism');
      
      await expect(page.getByTestId('messenger-sidebar')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Message folders' })).toBeVisible();
      await expect(page.getByTestId('chat-area')).toBeVisible();
      
      const messageInput = page.getByTestId('message-input');
      await expect(messageInput).toBeVisible();
      await messageInput.fill('Test message');
      
      const sendButton = page.getByTestId('send-button');
      await expect(sendButton).toBeVisible();
    });
  });

  test.describe('Admin Insights Visualization', () => {
    test('should render constellation view', async ({ page }) => {
      await page.goto('https://atlas-admin-insights.vercel.app/prism');
      await expect(page.getByTestId('constellation-view')).toBeVisible();
    });

    test('should display SLO gauges', async ({ page }) => {
      await page.goto('https://atlas-admin-insights.vercel.app/prism');
      await expect(page.getByTestId('uptime-gauge')).toBeVisible();
    });
  });

  test.describe('Dev Portal Navigation', () => {
    test('should load app list', async ({ page }) => {
      await page.goto('https://atlas-dev-portal.vercel.app/prism');
      
      const appList = page.getByTestId('app-list');
      await expect(appList).toBeVisible();
      
      const appCards = appList.locator('> div');
      await expect(appCards.first()).toBeVisible();
    });
  });
});