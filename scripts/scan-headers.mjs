#!/usr/bin/env node
/**
 * Security Headers Scanner
 * Kiểm tra các security headers từ server
 */

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';

const REQUIRED_HEADERS = {
  'content-security-policy': {
    required: true,
    mustContain: ["'self'", 'strict-dynamic'],
    description: 'CSP with strict-dynamic and self origin'
  },
  'strict-transport-security': {
    required: true,
    mustContain: ['max-age=63072000', 'preload'],
    description: 'HSTS with 2 years and preload'
  },
  'cross-origin-opener-policy': {
    required: true,
    mustContain: ['same-origin'],
    description: 'COOP same-origin'
  },
  'cross-origin-embedder-policy': {
    required: true,
    mustContain: ['require-corp'],
    description: 'COEP require-corp'
  },
  'x-content-type-options': {
    required: true,
    mustContain: ['nosniff'],
    description: 'X-Content-Type-Options nosniff'
  },
  'x-frame-options': {
    required: true,
    mustContain: ['DENY', 'SAMEORIGIN'],
    description: 'X-Frame-Options DENY or SAMEORIGIN'
  },
  'referrer-policy': {
    required: true,
    mustContain: ['no-referrer', 'strict-origin-when-cross-origin'],
    description: 'Referrer-Policy no-referrer or strict'
  },
  'permissions-policy': {
    required: false,
    description: 'Permissions-Policy (recommended)'
  }
};

async function scanHeaders() {
  console.log(`\n🔒 Scanning security headers: ${TARGET_URL}\n`);
  
  try {
    const response = await fetch(TARGET_URL);
    const headers = {};
    
    // Collect all headers
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    const results = {
      url: TARGET_URL,
      timestamp: new Date().toISOString(),
      passed: true,
      headers: {},
      issues: [],
      summary: {
        total: Object.keys(REQUIRED_HEADERS).length,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
    
    // Check each required header
    for (const [headerName, config] of Object.entries(REQUIRED_HEADERS)) {
      const headerValue = headers[headerName];
      const check = {
        present: !!headerValue,
        value: headerValue || null,
        valid: false,
        issues: []
      };
      
      if (!headerValue) {
        if (config.required) {
          check.issues.push(`Header missing: ${headerName}`);
          results.issues.push({
            severity: 'error',
            header: headerName,
            message: `Required header "${headerName}" is missing`,
            description: config.description
          });
          results.passed = false;
          results.summary.failed++;
        } else {
          check.issues.push(`Optional header missing: ${headerName}`);
          results.issues.push({
            severity: 'warning',
            header: headerName,
            message: `Recommended header "${headerName}" is missing`,
            description: config.description
          });
          results.summary.warnings++;
        }
      } else {
        // Header present, check value
        check.valid = true;
        
        if (config.mustContain) {
          const valueLower = headerValue.toLowerCase();
          const hasRequired = config.mustContain.some(required => 
            valueLower.includes(required.toLowerCase())
          );
          
          if (!hasRequired) {
            check.valid = false;
            check.issues.push(`Missing required directive. Expected one of: ${config.mustContain.join(', ')}`);
            results.issues.push({
              severity: 'error',
              header: headerName,
              message: `Header "${headerName}" missing required directive`,
              expected: config.mustContain,
              actual: headerValue,
              description: config.description
            });
            results.passed = false;
            results.summary.failed++;
          } else {
            results.summary.passed++;
          }
        } else {
          results.summary.passed++;
        }
      }
      
      results.headers[headerName] = check;
    }
    
    // Save results
    mkdirSync('evidence/headers', { recursive: true });
    const outputPath = join(process.cwd(), 'evidence/headers/scan.json');
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    // Print summary
    console.log('📊 Summary:');
    console.log(`  ✅ Passed: ${results.summary.passed}`);
    console.log(`  ❌ Failed: ${results.summary.failed}`);
    console.log(`  ⚠️  Warnings: ${results.summary.warnings}`);
    console.log(`\n📄 Report saved: ${outputPath}\n`);
    
    if (!results.passed) {
      console.log('❌ Security headers check FAILED\n');
      console.log('Issues:');
      results.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        console.log(`  ${icon} ${issue.message}`);
        if (issue.description) {
          console.log(`     ${issue.description}`);
        }
      });
      console.log('');
      process.exit(1);
    } else {
      console.log('✅ All security headers check PASSED\n');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error scanning headers:', error.message);
    
    const errorResult = {
      url: TARGET_URL,
      timestamp: new Date().toISOString(),
      passed: false,
      error: error.message,
      issues: [{
        severity: 'error',
        message: `Failed to fetch ${TARGET_URL}: ${error.message}`
      }]
    };
    
    mkdirSync('evidence/headers', { recursive: true });
    writeFileSync('evidence/headers/scan.json', JSON.stringify(errorResult, null, 2));
    
    process.exit(1);
  }
}

scanHeaders();
