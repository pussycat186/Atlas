import { test, expect } from '@playwright/test';

const MARKER = 'ATLAS • Prism UI — Peak Preview';

test('SSR prism marker exists (Unicode-safe)', async ({ page }) => {
  await page.goto('/prism', { waitUntil: 'domcontentloaded' });
  // Prefer locator assertions; Playwright auto-waits. If missing, fall back to raw HTML.
  await expect(page.locator('body')).toContainText(MARKER, { useInnerText: true });
  const html = (await page.content()).normalize('NFKC');
  expect(html).toContain(MARKER); // redundancy to avoid flakiness
});