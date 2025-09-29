#!/usr/bin/env node

import { readFileSync } from 'fs';

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

async function checkApp(name, url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(30000)
    });
    
    const body = await response.text();
    const marker = body.includes(MARKER);
    return { status: response.status, marker };
  } catch (error) {
    // Try with trailing slash
    try {
      const response = await fetch(url + '/', {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(30000)
      });
      
      const body = await response.text();
      const marker = body.includes(MARKER);
      return { status: response.status, marker };
    } catch (error2) {
      return { status: 0, marker: false };
    }
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