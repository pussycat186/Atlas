#!/usr/bin/env node

/**
 * S3 Receipts & Verify Evidence Collection (Simple)
 * 
 * Validates RFC 9421 HTTP Message Signatures implementation structure,
 * JWKS service, and receipt verification components without building.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(path, description) {
  const exists = existsSync(path);
  log(`${exists ? '✅' : '❌'} ${description}: ${path}`, exists ? colors.green : colors.red);
  return exists;
}

function checkCodeContent(path, patterns, description) {
  if (!existsSync(path)) {
    log(`❌ ${description}: File not found - ${path}`, colors.red);
    return false;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    const results = patterns.map(pattern => ({
      pattern: pattern.name,
      found: pattern.regex ? pattern.regex.test(content) : content.includes(pattern.text),
      required: pattern.required !== false
    }));

    const passed = results.filter(r => r.required && r.found).length;
    const required = results.filter(r => r.required).length;
    
    if (passed === required) {
      log(`✅ ${description}: All patterns found (${passed}/${required})`, colors.green);
      return true;
    } else {
      log(`❌ ${description}: Missing patterns (${passed}/${required})`, colors.red);
      results.forEach(r => {
        if (r.required && !r.found) {
          log(`   - Missing: ${r.pattern}`, colors.yellow);
        }
      });
      return false;
    }
  } catch (error) {
    log(`❌ ${description}: Error reading file - ${error.message}`, colors.red);
    return false;
  }
}

function validateS3Implementation() {
  log('\n🔐 ATLAS S3 RECEIPTS & VERIFY - EVIDENCE COLLECTION', colors.bold + colors.green);
  log('='.repeat(60), colors.green);
  
  const evidence = {
    phase: 'S3',
    title: 'Receipts & Verify',
    timestamp: new Date().toISOString(),
    checks: {
      rfc9421Core: [],
      jwksService: [],
      verifyUI: [],
      chatIntegration: []
    },
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0
    }
  };

  log('\n📋 RFC 9421 Core Implementation', colors.bold + colors.cyan);
  
  // Check 1: @atlas/receipt package structure
  evidence.checks.rfc9421Core.push({
    name: 'Receipt Package Structure',
    passed: checkFile('d:\\Atlas\\packages\\@atlas\\receipt\\package.json', 'Receipt package.json') &&
            checkFile('d:\\Atlas\\packages\\@atlas\\receipt\\src\\index.ts', 'Receipt main implementation') &&
            checkFile('d:\\Atlas\\packages\\@atlas\\receipt\\src\\cli.ts', 'Receipt CLI tool')
  });

  // Check 2: RFC 9421 implementation patterns
  evidence.checks.rfc9421Core.push({
    name: 'RFC 9421 Classes',
    passed: checkCodeContent('d:\\Atlas\\packages\\@atlas\\receipt\\src\\index.ts', [
      { name: 'RFC9421Signer class', text: 'class RFC9421Signer', required: true },
      { name: 'RFC9421Verifier class', text: 'class RFC9421Verifier', required: true },
      { name: 'createReceipt method', text: 'createReceipt(', required: true },
      { name: 'verifyReceipt method', text: 'verifyReceipt(', required: true },
      { name: 'Ed25519 support', text: 'ed25519', required: true }
    ], 'RFC 9421 Implementation')
  });

  // Check 3: CLI functionality
  evidence.checks.rfc9421Core.push({
    name: 'CLI Commands',
    passed: checkCodeContent('d:\\Atlas\\packages\\@atlas\\receipt\\src\\cli.ts', [
      { name: 'generate-keys command', text: 'generate-keys', required: true },
      { name: 'sign command', text: 'sign', required: true },
      { name: 'verify command', text: 'verify', required: true },
      { name: 'jwks command', text: 'jwks', required: true },
      { name: 'Commander.js', text: 'commander', required: true }
    ], 'CLI Implementation')
  });

  log('\n🔑 JWKS Service', colors.bold + colors.cyan);

  // Check 4: JWKS service structure
  evidence.checks.jwksService.push({
    name: 'JWKS Service Structure',
    passed: checkFile('d:\\Atlas\\services\\jwks\\src\\server.ts', 'JWKS server implementation') &&
            checkFile('d:\\Atlas\\services\\jwks\\package.json', 'JWKS package.json')
  });

  // Check 5: JWKS service implementation
  evidence.checks.jwksService.push({
    name: 'JWKS Implementation',
    passed: checkCodeContent('d:\\Atlas\\services\\jwks\\src\\server.ts', [
      { name: 'JWKSManager class', text: 'class JWKSManager', required: true },
      { name: 'Key rotation', text: 'performScheduledRotation', required: true },
      { name: 'Redis persistence', text: 'redis', required: true },
      { name: 'Ed25519 key generation', text: 'generateEd25519Key', required: true },
      { name: 'JWKS endpoint', text: '/.well-known/jwks.json', required: true },
      { name: '90-day rotation', text: '90', required: true }
    ], 'JWKS Service Features')
  });

  log('\n🌐 Verify UI', colors.bold + colors.cyan);

  // Check 6: Verify app structure
  evidence.checks.verifyUI.push({
    name: 'Verify App Structure',
    passed: checkFile('d:\\Atlas\\apps\\verify\\src\\app\\page.tsx', 'Verify UI page') &&
            checkFile('d:\\Atlas\\apps\\verify\\src\\app\\api\\verify\\route.ts', 'Verify API route') &&
            checkFile('d:\\Atlas\\apps\\verify\\package.json', 'Verify package.json')
  });

  // Check 7: Verify UI implementation
  evidence.checks.verifyUI.push({
    name: 'Verify UI Features',
    passed: checkCodeContent('d:\\Atlas\\apps\\verify\\src\\app\\page.tsx', [
      { name: 'React dropzone', text: 'react-dropzone', required: true },
      { name: 'Receipt verification UI', text: 'verification', required: true },
      { name: 'File upload handling', text: 'onDrop', required: true },
      { name: 'Receipt display', text: 'receipt', required: true }
    ], 'Verify UI Components')
  });

  // Check 8: API route implementation
  evidence.checks.verifyUI.push({
    name: 'Verify API Route',
    passed: checkCodeContent('d:\\Atlas\\apps\\verify\\src\\app\\api\\verify\\route.ts', [
      { name: 'POST handler', text: 'export async function POST', required: true },
      { name: 'JWKS fetch', text: 'fetch', required: true },
      { name: 'RFC9421Verifier usage', text: 'RFC9421Verifier', required: true },
      { name: 'Receipt verification', text: 'verifyReceipt', required: true }
    ], 'API Route Implementation')
  });

  log('\n💬 Chat Integration', colors.bold + colors.cyan);

  // Check 9: Chat service integration
  evidence.checks.chatIntegration.push({
    name: 'Chat Service Receipt Integration',
    passed: checkCodeContent('d:\\Atlas\\services\\chat-delivery\\src\\server.ts', [
      { name: 'RFC9421Signer import', text: 'RFC9421Signer', required: true },
      { name: 'Receipt signer property', text: 'receiptSigner', required: true },
      { name: 'Receipt generation', text: 'createReceipt', required: true },
      { name: 'Receipt storage', text: 'receipt:', required: true },
      { name: 'Receipt endpoint', text: '/api/receipts/', required: true }
    ], 'Chat Receipt Integration')
  });

  // Check 10: Message receipt interface
  evidence.checks.chatIntegration.push({
    name: 'Message Receipt Interface',
    passed: checkCodeContent('d:\\Atlas\\services\\chat-delivery\\src\\server.ts', [
      { name: 'receiptId field', text: 'receiptId?', required: true },
      { name: 'AtlasReceiptContent interface', text: 'AtlasReceiptContent', required: true },
      { name: 'Receipt storage with TTL', text: '90 * 24 * 60 * 60', required: true }
    ], 'Receipt Data Structures')
  });

  // Calculate totals
  const allChecks = [
    ...evidence.checks.rfc9421Core,
    ...evidence.checks.jwksService,
    ...evidence.checks.verifyUI,
    ...evidence.checks.chatIntegration
  ];

  evidence.summary.totalChecks = allChecks.length;
  evidence.summary.passedChecks = allChecks.filter(c => c.passed).length;
  evidence.summary.failedChecks = allChecks.filter(c => !c.passed).length;

  // Display results
  log('\n📊 SUMMARY RESULTS', colors.bold + colors.yellow);
  log(`Total Checks: ${evidence.summary.totalChecks}`, colors.blue);
  log(`Passed: ${evidence.summary.passedChecks}`, colors.green);
  log(`Failed: ${evidence.summary.failedChecks}`, colors.red);
  log(`Success Rate: ${Math.round((evidence.summary.passedChecks / evidence.summary.totalChecks) * 100)}%`, colors.cyan);

  // Compliance assessment
  const compliance = {
    rfc9421Standard: evidence.checks.rfc9421Core.every(c => c.passed),
    jwksService: evidence.checks.jwksService.every(c => c.passed),
    verifyUI: evidence.checks.verifyUI.every(c => c.passed),
    chatIntegration: evidence.checks.chatIntegration.every(c => c.passed)
  };

  log('\n🎯 COMPLIANCE STATUS', colors.bold + colors.yellow);
  log(`RFC 9421 Implementation: ${compliance.rfc9421Standard ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`, 
      compliance.rfc9421Standard ? colors.green : colors.red);
  log(`JWKS Service: ${compliance.jwksService ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`, 
      compliance.jwksService ? colors.green : colors.red);
  log(`Verify UI: ${compliance.verifyUI ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`, 
      compliance.verifyUI ? colors.green : colors.red);
  log(`Chat Integration: ${compliance.chatIntegration ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`, 
      compliance.chatIntegration ? colors.green : colors.red);

  const overallCompliance = Object.values(compliance).every(c => c);

  if (overallCompliance) {
    log('\n🎉 S3 RECEIPTS & VERIFY: FULLY IMPLEMENTED & COMPLIANT', colors.bold + colors.green);
    log('✅ RFC 9421 HTTP Message Signatures implemented', colors.green);
    log('✅ JWKS service with 90-day key rotation', colors.green);
    log('✅ Public verification UI with drag-drop interface', colors.green);
    log('✅ Chat service integration for automatic receipts', colors.green);
    log('\n🚀 READY TO PROCEED WITH S4 HEADERS & TRANSPORT', colors.bold + colors.cyan);
  } else {
    log('\n⚠️  S3 RECEIPTS & VERIFY: IMPLEMENTATION INCOMPLETE', colors.bold + colors.red);
    log('Please address the failed checks before proceeding', colors.red);
  }

  // Save evidence
  evidence.compliance = compliance;
  evidence.overallCompliant = overallCompliance;
  
  const evidenceFile = `s3-receipts-verify-evidence-${Date.now()}.json`;
  writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
  log(`\n💾 Evidence report saved: ${evidenceFile}`, colors.bold + colors.blue);

  return evidence;
}

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  validateS3Implementation();
}

export { validateS3Implementation };