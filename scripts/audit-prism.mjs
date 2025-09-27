#!/usr/bin/env node

import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';

const MARKER = 'ATLAS • Prism UI — Peak Preview';

let URLS;
try {
  const liveUrls = JSON.parse(readFileSync('LIVE_URLS.json', 'utf8'));
  URLS = {
    admin_insights: liveUrls.frontends.admin_insights + '/prism',
    dev_portal: liveUrls.frontends.dev_portal + '/prism',
    proof_messenger: liveUrls.frontends.proof_messenger + '/prism'
  };
} catch {
  console.error('BLOCKER_WORKFLOW_ERROR:audit-prism.mjs');
  process.exit(1);
}

async function fetchWithRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        return fetchWithRedirects(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkApp(name, url) {
  try {
    // Check both /prism and /prism/
    let result = await fetchWithRedirects(url);
    if (result.status < 200 || result.status >= 300) {
      result = await fetchWithRedirects(url + '/');
    }
    const marker = result.body.includes(MARKER);
    return { status: result.status, marker };
  } catch (error) {
    return { status: 0, marker: false };
  }
}

async function main() {
  const results = {};
  
  for (const [name, url] of Object.entries(URLS)) {
    results[name] = await checkApp(name, url);
  }
  
  console.log(JSON.stringify(results));
  
  const allGood = Object.values(results).every(r => r.marker);
  process.exit(allGood ? 0 : 1);
}

main().catch(() => {
  console.error('BLOCKER_WORKFLOW_ERROR:audit-prism.mjs');
  process.exit(1);
});