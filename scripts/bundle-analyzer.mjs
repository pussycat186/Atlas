#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const BUDGET_KB = 200;
const apps = ['admin-insights', 'dev-portal', 'proof-messenger'];

function analyzeBundles() {
  let allWithinBudget = true;
  const results = {};
  
  apps.forEach(app => {
    const nextDir = path.join('apps', app, '.next');
    
    if (!fs.existsSync(nextDir)) {
      console.error(`❌ ${app}: Build not found`);
      results[app] = { error: 'Build not found' };
      allWithinBudget = false;
      return;
    }
    
    // Check static chunks
    const staticDir = path.join(nextDir, 'static', 'chunks');
    let totalSize = 0;
    
    if (fs.existsSync(staticDir)) {
      const files = fs.readdirSync(staticDir);
      files.forEach(file => {
        if (file.endsWith('.js')) {
          const filePath = path.join(staticDir, file);
          totalSize += fs.statSync(filePath).size;
        }
      });
    }
    
    const sizeKB = Math.round(totalSize / 1024);
    const withinBudget = sizeKB <= BUDGET_KB;
    
    results[app] = { sizeKB, withinBudget };
    
    console.log(`${withinBudget ? '✅' : '❌'} ${app}: ${sizeKB}KB ${withinBudget ? '(within budget)' : `(exceeds ${BUDGET_KB}KB)`}`);
    
    if (!withinBudget) {
      allWithinBudget = false;
    }
  });
  
  if (!allWithinBudget) {
    console.error('\n❌ Bundle size budget exceeded');
    process.exit(1);
  }
  
  console.log('\n✅ All bundles within budget');
  return results;
}

analyzeBundles();