#!/usr/bin/env node
/**
 * Capture Screenshots for Marketing & Documentation
 * Uses Playwright to capture key routes from production
 */

import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, '../docs/screenshots');

// Ensure directory exists
mkdirSync(screenshotDir, { recursive: true });

const BASE_URL = process.env.BASE_URL || 'https://atlas-proof-messenger.vercel.app';

const routes = [
  { path: '/', name: 'landing', viewport: { width: 1280, height: 720 } },
  { path: '/onboarding', name: 'onboarding', viewport: { width: 390, height: 844 } },
  { path: '/chats', name: 'chats', viewport: { width: 390, height: 844 } },
  { path: '/verify', name: 'verify', viewport: { width: 1280, height: 720 } },
  { path: '/security', name: 'security', viewport: { width: 390, height: 844 } },
  { path: '/settings', name: 'settings', viewport: { width: 390, height: 844 } },
];

async function captureScreenshots() {
  console.log('📸 Starting screenshot capture...');
  console.log(`Base URL: ${BASE_URL}`);
  
  const browser = await chromium.launch();
  const results = [];

  for (const route of routes) {
    try {
      console.log(`\n📷 Capturing: ${route.path}`);
      
      const context = await browser.newContext({
        viewport: route.viewport,
        deviceScaleFactor: 2, // Retina display
      });
      
      const page = await context.newPage();
      
      // Navigate with timeout
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Capture screenshot
      const screenshotPath = join(screenshotDir, `${route.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false, // Capture viewport only
      });
      
      console.log(`✅ Saved: ${screenshotPath}`);
      
      results.push({
        route: route.path,
        name: route.name,
        file: `docs/screenshots/${route.name}.png`,
        viewport: route.viewport,
        timestamp: new Date().toISOString(),
      });
      
      await context.close();
      
    } catch (error) {
      console.error(`❌ Failed to capture ${route.path}:`, error.message);
      results.push({
        route: route.path,
        name: route.name,
        error: error.message,
      });
    }
  }

  await browser.close();

  // Write manifest
  const manifestPath = join(screenshotDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    base_url: BASE_URL,
    screenshots: results,
  }, null, 2));

  console.log(`\n✅ Screenshot manifest: ${manifestPath}`);
  console.log(`\n📊 Captured ${results.filter(r => !r.error).length}/${routes.length} screenshots`);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  captureScreenshots()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { captureScreenshots };
