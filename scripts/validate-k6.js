#!/usr/bin/env node

/**
 * k6 Performance Validation Script
 * Validates k6 results against performance thresholds
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds
const THRESHOLDS = {
  p95: 200, // ms
  errorRate: 0.01 // 1%
};

function validateK6Results(summaryPath) {
  console.log('Validating k6 performance results...');
  
  if (!fs.existsSync(summaryPath)) {
    console.error(`k6 summary not found: ${summaryPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  
  // Extract metrics from k6 summary
  const metrics = data.metrics || {};
  
  const p95Ms = metrics.http_req_duration?.p95 || 0;
  const errorRate = metrics.http_req_failed?.rate || 0;
  
  console.log(`Performance metrics:`);
  console.log(`  p95 latency: ${p95Ms.toFixed(2)}ms (threshold: ≤${THRESHOLDS.p95}ms)`);
  console.log(`  error rate: ${(errorRate * 100).toFixed(2)}% (threshold: ≤${(THRESHOLDS.errorRate * 100)}%)`);

  let allPassed = true;
  const failures = [];

  // Check p95 latency
  if (p95Ms > THRESHOLDS.p95) {
    allPassed = false;
    failures.push(`p95=${p95Ms.toFixed(0)}ms`);
  }

  // Check error rate
  if (errorRate > THRESHOLDS.errorRate) {
    allPassed = false;
    failures.push(`error=${(errorRate * 100).toFixed(1)}%`);
  }

  if (!allPassed) {
    const blocker = `BLOCKER_PERF_GATE:${failures.join(',')}`;
    console.error(blocker);
    process.exit(1);
  }

  console.log(`✓ Performance tests passed all thresholds`);
  return {
    p95_ms: p95Ms,
    error_pct: errorRate * 100
  };
}

// CLI usage
if (require.main === module) {
  const [,, summaryPath] = process.argv;
  
  if (!summaryPath) {
    console.error('Usage: node validate-k6.js <summary-path>');
    console.error('Example: node validate-k6.js docs/evidence/20250922-1717/k6/summary.json');
    process.exit(1);
  }

  validateK6Results(summaryPath);
}

module.exports = { validateK6Results, THRESHOLDS };
