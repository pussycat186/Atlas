#!/usr/bin/env node

import https from 'https';
import http from 'http';

const MARKER = 'ATLAS • Prism UI — Peak Preview';
const URLS = {
  admin_insights: 'https://atlas-admin-insights.vercel.app/prism',
  dev_portal: 'https://atlas-dev-portal.vercel.app/prism', 
  proof_messenger: 'https://atlas-proof-messenger.vercel.app/prism'
};

async function fetchWithRedirects(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchWithRedirects(res.headers.location).then(resolve).catch(reject);
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
    const { status, body } = await fetchWithRedirects(url);
    const marker = body.includes(MARKER);
    return { status, marker };
  } catch (error) {
    return { status: 0, marker: false };
  }
}

async function main() {
  const results = {};
  
  for (const [name, url] of Object.entries(URLS)) {
    results[name] = await checkApp(name, url);
  }
  
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('BLOCKER_WORKFLOW_ERROR:audit-prism.mjs');
  process.exit(1);
});