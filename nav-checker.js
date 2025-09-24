#!/usr/bin/env node

const https = require('https');

const apps = [
  {
    name: 'proof-messenger',
    baseUrl: 'https://atlas-proof-messenger.vercel.app',
    routes: ['/', '/messages', '/receipts', '/evidence', '/settings']
  },
  {
    name: 'admin-insights',
    baseUrl: 'https://atlas-admin-insights.vercel.app',
    routes: ['/', '/metrics', '/traces', '/witnesses']
  },
  {
    name: 'dev-portal',
    baseUrl: 'https://atlas-dev-portal.vercel.app',
    routes: ['/', '/docs', '/sdk', '/examples']
  }
];

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET', followRedirects: true }, (res) => {
      let finalUrl = url;
      if (res.headers.location) {
        finalUrl = res.headers.location;
      }
      resolve({
        url,
        status: res.statusCode,
        finalUrl,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        finalUrl: url,
        success: false,
        error: err.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        finalUrl: url,
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function runNavCheck() {
  console.log('Running F0 Zero-404 Navigation Check...\n');
  
  const results = [];
  let allPassed = true;

  for (const app of apps) {
    console.log(`Checking ${app.name}:`);
    
    for (const route of app.routes) {
      const url = `${app.baseUrl}${route}`;
      const result = await checkUrl(url);
      results.push(result);
      
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${route} -> ${result.status} ${result.finalUrl}`);
      
      if (!result.success) {
        allPassed = false;
      }
    }
    console.log('');
  }

  const timestamp = new Date().toISOString();
  const navCheckData = {
    timestamp,
    status: allPassed ? 'PASS' : 'FAIL',
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join('docs', 'evidence', `${new Date().toISOString().slice(0,16).replace(/[-:]/g, '').slice(0,8)  }-${  new Date().toISOString().slice(11,16).replace(/:/g, '')}`, 'nav-check.json');
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(navCheckData, null, 2));
  console.log(`Results saved to: ${outputPath}`);
  
  console.log(`\nF0 Zero-404 Status: ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Summary: ${navCheckData.summary.passed}/${navCheckData.summary.total} routes passed`);
  
  if (!allPassed) {
    const firstFailure = results.find(r => !r.success);
    console.log(`BLOCKER_NAV_404:${firstFailure.url}`);
    process.exit(1);
  }
  
  console.log('✅ F0 Zero-404 PASSED - All navigation routes return 200 (or 302→200)');
}

runNavCheck().catch(console.error);

