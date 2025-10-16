#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BUDGET_JS_KB = 200;
const apps = ['admin-insights', 'dev-portal', 'proof-messenger'];

function checkBundleSize(appName) {
  const buildManifest = path.join('apps', appName, '.next', 'build-manifest.json');
  
  if (!fs.existsSync(buildManifest)) {
    console.error(`❌ Build manifest not found for ${appName}`);
    return false;
  }
  
  const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
  const prismFiles = manifest.pages['/prism'] || [];
  
  let totalSize = 0;
  prismFiles.forEach(file => {
    const filePath = path.join('apps', appName, '.next', file);
    if (fs.existsSync(filePath)) {
      totalSize += fs.statSync(filePath).size;
    }
  });
  
  const sizeKB = Math.round(totalSize / 1024);
  const withinBudget = sizeKB <= BUDGET_JS_KB;
  
  console.log(`${withinBudget ? '✅' : '❌'} ${appName}: ${sizeKB}KB ${withinBudget ? '(within budget)' : `(exceeds ${BUDGET_JS_KB}KB budget)`}`);
  
  return withinBudget;
}

let allWithinBudget = true;
apps.forEach(app => {
  if (!checkBundleSize(app)) {
    allWithinBudget = false;
  }
});

if (!allWithinBudget) {
  console.error('\n❌ Performance budget exceeded');
  process.exit(1);
}

console.log('\n✅ All apps within performance budget');