#!/usr/bin/env node

/**
 * Lighthouse Validation Script
 * Validates Lighthouse results against Basic and Pro SKU thresholds
 */

const fs = require('fs');
const path = require('path');

// Thresholds per SKU
const THRESHOLDS = {
  basic: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 95
  },
  pro: {
    performance: 95,
    accessibility: 95,
    'best-practices': 100,
    seo: 100
  }
};

function validateLighthouseResults(resultsPath, sku = 'basic') {
  console.log(`Validating Lighthouse results for ${sku.toUpperCase()} SKU...`);
  
  if (!fs.existsSync(resultsPath)) {
    console.error(`Lighthouse results not found: ${resultsPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const appName = path.basename(resultsPath, '.json');
  
  const scores = {
    performance: Math.round(data.categories.performance.score * 100),
    accessibility: Math.round(data.categories.accessibility.score * 100),
    'best-practices': Math.round(data.categories['best-practices'].score * 100),
    seo: Math.round(data.categories.seo.score * 100)
  };

  console.log(`${appName} scores:`, scores);

  const thresholds = THRESHOLDS[sku];
  let allPassed = true;
  const failures = [];

  Object.entries(thresholds).forEach(([category, threshold]) => {
    const score = scores[category];
    const passed = score >= threshold;
    
    console.log(`  ${category}: ${score} (required: ≥${threshold}) - ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) {
      allPassed = false;
      failures.push(`${category}=${score}`);
    }
  });

  if (!allPassed) {
    const blocker = `BLOCKER_LIGHTHOUSE_A11Y:${appName}=${failures.join(',')}`;
    console.error(blocker);
    process.exit(1);
  }

  console.log(`✓ ${appName} passed all ${sku.toUpperCase()} thresholds`);
  return true;
}

// CLI usage
if (require.main === module) {
  const [,, resultsPath, sku] = process.argv;
  
  if (!resultsPath) {
    console.error('Usage: node validate-lighthouse.js <results-path> [sku]');
    console.error('Example: node validate-lighthouse.js docs/evidence/20250922-1717/lighthouse/proof-messenger.json basic');
    process.exit(1);
  }

  validateLighthouseResults(resultsPath, sku || 'basic');
}

module.exports = { validateLighthouseResults, THRESHOLDS };
