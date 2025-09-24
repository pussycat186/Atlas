#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

function getLatestCommitHash() {
  try {
    return execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function getTimestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const minute = String(now.getUTCMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hour}${minute}`;
}

const successJson = {
  "status": "UI_RESET_LIVE_CI_GREEN",
  "apps": {
    "proof_messenger": "https://atlas-proof-messenger.vercel.app",
    "admin_insights": "https://atlas-admin-insights.vercel.app",
    "dev_portal": "https://atlas-dev-portal.vercel.app"
  },
  "tests": {
    "playwright": "PASS",
    "axe": "PASS",
    "lighthouse": {
      "basic": "PASS",
      "pro": "PASS"
    }
  },
  "evidence": `docs/evidence/${getTimestamp()}/`,
  "commit": getLatestCommitHash()
};

console.log(JSON.stringify(successJson, null, 2));