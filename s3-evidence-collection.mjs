#!/usr/bin/env node

/**
 * S3 Receipts & Verify Evidence Collection
 * 
 * Validates RFC 9421 HTTP Message Signatures implementation,
 * JWKS service with key rotation, and receipt verification.
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
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

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command: string, args: string[] = []): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code: code || 0, stdout, stderr });
    });
  });
}

async function testRFC9421Implementation() {
  log('\n🔐 Testing RFC 9421 HTTP Message Signatures Implementation', colors.bold + colors.cyan);
  
  const tests = [];
  
  // Test 1: Key generation
  log('\n1️⃣ Testing Ed25519 key generation...', colors.blue);
  const keyGenResult = await runCommand('node', [
    'packages/@atlas/receipt/src/cli.ts',
    'generate-keys',
    '--algorithm', 'ed25519',
    '--output', 'test-keys.json'
  ]);
  
  tests.push({
    name: 'Ed25519 Key Generation',
    passed: keyGenResult.code === 0,
    details: keyGenResult.stdout || keyGenResult.stderr
  });

  // Test 2: Receipt signing
  log('\n2️⃣ Testing receipt signing...', colors.blue);
  const signResult = await runCommand('node', [
    'packages/@atlas/receipt/src/cli.ts',
    'sign',
    '--resource', 'test-message',
    '--subject', 'user123',
    '--action', 'message.send',
    '--content', '{"test": "data"}',
    '--keyfile', 'test-keys.json'
  ]);
  
  tests.push({
    name: 'Receipt Signing',
    passed: signResult.code === 0 && signResult.stdout.includes('Receipt signed successfully'),
    details: signResult.stdout || signResult.stderr
  });

  // Test 3: Receipt verification
  if (signResult.code === 0 && signResult.stdout.includes('Receipt ID:')) {
    log('\n3️⃣ Testing receipt verification...', colors.blue);
    const receiptMatch = signResult.stdout.match(/Receipt ID: (.+)/);
    
    if (receiptMatch) {
      const receiptId = receiptMatch[1].trim();
      const verifyResult = await runCommand('node', [
        'packages/@atlas/receipt/src/cli.ts',
        'verify',
        '--receipt-id', receiptId,
        '--keyfile', 'test-keys.json'
      ]);
      
      tests.push({
        name: 'Receipt Verification',
        passed: verifyResult.code === 0 && verifyResult.stdout.includes('✅ Receipt verified'),
        details: verifyResult.stdout || verifyResult.stderr
      });
    }
  }

  // Test 4: JWKS generation
  log('\n4️⃣ Testing JWKS generation...', colors.blue);
  const jwksResult = await runCommand('node', [
    'packages/@atlas/receipt/src/cli.ts',
    'jwks',
    '--keyfile', 'test-keys.json'
  ]);
  
  tests.push({
    name: 'JWKS Generation',
    passed: jwksResult.code === 0 && jwksResult.stdout.includes('"keys"'),
    details: jwksResult.stdout || jwksResult.stderr
  });

  return tests;
}

async function testJWKSService() {
  log('\n🔑 Testing JWKS Service with Key Rotation', colors.bold + colors.cyan);
  
  const tests = [];
  
  // Test 1: Service startup
  log('\n1️⃣ Testing JWKS service startup...', colors.blue);
  const serviceTest = `
    import { JWKSManager } from './services/jwks/src/server.ts';
    
    const manager = new JWKSManager();
    await manager.initialize();
    
    const jwks = manager.getJWKS();
    console.log('JWKS keys count:', jwks.keys.length);
    console.log('Key algorithms:', jwks.keys.map(k => k.alg).join(', '));
    
    process.exit(0);
  `;
  
  writeFileSync('test-jwks.mjs', serviceTest);
  
  const serviceResult = await runCommand('node', ['test-jwks.mjs']);
  
  tests.push({
    name: 'JWKS Service Initialization',
    passed: serviceResult.code === 0 && serviceResult.stdout.includes('JWKS keys count:'),
    details: serviceResult.stdout || serviceResult.stderr
  });

  // Test 2: Key rotation simulation
  log('\n2️⃣ Testing key rotation logic...', colors.blue);
  const rotationTest = `
    import { JWKSManager } from './services/jwks/src/server.ts';
    
    const manager = new JWKSManager();
    await manager.initialize();
    
    const beforeCount = manager.getJWKS().keys.length;
    console.log('Keys before rotation:', beforeCount);
    
    // Simulate rotation
    await manager.performScheduledRotation();
    
    const afterCount = manager.getJWKS().keys.length;
    console.log('Keys after rotation:', afterCount);
    console.log('Rotation successful:', afterCount > beforeCount);
    
    process.exit(0);
  `;
  
  writeFileSync('test-rotation.mjs', rotationTest);
  
  const rotationResult = await runCommand('node', ['test-rotation.mjs']);
  
  tests.push({
    name: 'Key Rotation Logic',
    passed: rotationResult.code === 0 && rotationResult.stdout.includes('Rotation successful: true'),
    details: rotationResult.stdout || rotationResult.stderr
  });

  return tests;
}

async function testVerifyUI() {
  log('\n🌐 Testing Verify UI Components', colors.bold + colors.cyan);
  
  const tests = [];
  
  // Test 1: Component compilation
  log('\n1️⃣ Testing React component compilation...', colors.blue);
  const compileResult = await runCommand('npx', [
    'tsc',
    '--noEmit',
    '--jsx', 'react-jsx',
    'apps/verify/src/app/page.tsx'
  ]);
  
  tests.push({
    name: 'Verify UI Compilation',
    passed: compileResult.code === 0,
    details: compileResult.stderr || 'No compilation errors'
  });

  // Test 2: API route validation
  log('\n2️⃣ Testing API route structure...', colors.blue);
  try {
    const apiRoute = readFileSync('apps/verify/src/app/api/verify/route.ts', 'utf-8');
    const hasPostHandler = apiRoute.includes('export async function POST');
    const hasJWKSFetch = apiRoute.includes('fetch') && apiRoute.includes('jwks');
    const hasVerifier = apiRoute.includes('RFC9421Verifier');
    
    tests.push({
      name: 'API Route Structure',
      passed: hasPostHandler && hasJWKSFetch && hasVerifier,
      details: `POST handler: ${hasPostHandler}, JWKS fetch: ${hasJWKSFetch}, Verifier: ${hasVerifier}`
    });
  } catch (error) {
    tests.push({
      name: 'API Route Structure',
      passed: false,
      details: `Error reading route file: ${error.message}`
    });
  }

  return tests;
}

async function testChatIntegration() {
  log('\n💬 Testing Chat Service Receipt Integration', colors.bold + colors.cyan);
  
  const tests = [];
  
  // Test 1: Chat service compilation
  log('\n1️⃣ Testing chat service compilation...', colors.blue);
  const compileResult = await runCommand('npx', [
    'tsc',
    '--noEmit',
    'services/chat-delivery/src/server.ts'
  ]);
  
  tests.push({
    name: 'Chat Service Compilation',
    passed: compileResult.code === 0,
    details: compileResult.stderr || 'No compilation errors'
  });

  // Test 2: Receipt integration validation
  log('\n2️⃣ Testing receipt integration...', colors.blue);
  try {
    const chatService = readFileSync('services/chat-delivery/src/server.ts', 'utf-8');
    const hasReceiptSigner = chatService.includes('RFC9421Signer');
    const hasReceiptGeneration = chatService.includes('createReceipt');
    const hasReceiptStorage = chatService.includes('receipt:${receipt.id}');
    const hasReceiptEndpoint = chatService.includes('/api/receipts/:receiptId');
    
    tests.push({
      name: 'Receipt Integration',
      passed: hasReceiptSigner && hasReceiptGeneration && hasReceiptStorage && hasReceiptEndpoint,
      details: `Signer: ${hasReceiptSigner}, Generation: ${hasReceiptGeneration}, Storage: ${hasReceiptStorage}, Endpoint: ${hasReceiptEndpoint}`
    });
  } catch (error) {
    tests.push({
      name: 'Receipt Integration',
      passed: false,
      details: `Error reading chat service: ${error.message}`
    });
  }

  return tests;
}

async function generateS3Evidence() {
  log('\n📊 ATLAS S3 RECEIPTS & VERIFY - EVIDENCE COLLECTION', colors.bold + colors.green);
  log('='.repeat(60), colors.green);
  
  const evidence = {
    phase: 'S3',
    title: 'Receipts & Verify',
    description: 'Legal-grade verifiable receipts with RFC 9421 HTTP Message Signatures',
    timestamp: new Date().toISOString(),
    tests: {
      rfc9421: [],
      jwks: [],
      verifyUI: [],
      chatIntegration: []
    },
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0
    },
    compliance: {
      rfc9421Standard: false,
      jwksRotation: false,
      publicVerification: false,
      chatIntegration: false
    }
  };

  // Run all test suites
  evidence.tests.rfc9421 = await testRFC9421Implementation();
  evidence.tests.jwks = await testJWKSService();
  evidence.tests.verifyUI = await testVerifyUI();
  evidence.tests.chatIntegration = await testChatIntegration();

  // Calculate summary
  const allTests = [
    ...evidence.tests.rfc9421,
    ...evidence.tests.jwks,
    ...evidence.tests.verifyUI,
    ...evidence.tests.chatIntegration
  ];

  evidence.summary.totalTests = allTests.length;
  evidence.summary.passedTests = allTests.filter(t => t.passed).length;
  evidence.summary.failedTests = allTests.filter(t => !t.passed).length;
  evidence.summary.successRate = Math.round((evidence.summary.passedTests / evidence.summary.totalTests) * 100);

  // Check compliance
  evidence.compliance.rfc9421Standard = evidence.tests.rfc9421.every(t => t.passed);
  evidence.compliance.jwksRotation = evidence.tests.jwks.every(t => t.passed);
  evidence.compliance.publicVerification = evidence.tests.verifyUI.every(t => t.passed);
  evidence.compliance.chatIntegration = evidence.tests.chatIntegration.every(t => t.passed);

  // Display results
  log('\n📋 TEST RESULTS:', colors.bold + colors.yellow);
  
  for (const [category, tests] of Object.entries(evidence.tests)) {
    log(`\n${category.toUpperCase()}:`, colors.cyan);
    tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      log(`  ${status} ${test.name}`, test.passed ? colors.green : colors.red);
      if (!test.passed && test.details) {
        log(`     ${test.details}`, colors.yellow);
      }
    });
  }

  log('\n📊 SUMMARY:', colors.bold + colors.yellow);
  log(`Total Tests: ${evidence.summary.totalTests}`, colors.blue);
  log(`Passed: ${evidence.summary.passedTests}`, colors.green);
  log(`Failed: ${evidence.summary.failedTests}`, colors.red);
  log(`Success Rate: ${evidence.summary.successRate}%`, colors.cyan);

  log('\n🎯 COMPLIANCE STATUS:', colors.bold + colors.yellow);
  log(`RFC 9421 Standard: ${evidence.compliance.rfc9421Standard ? '✅' : '❌'}`, 
      evidence.compliance.rfc9421Standard ? colors.green : colors.red);
  log(`JWKS Key Rotation: ${evidence.compliance.jwksRotation ? '✅' : '❌'}`, 
      evidence.compliance.jwksRotation ? colors.green : colors.red);
  log(`Public Verification: ${evidence.compliance.publicVerification ? '✅' : '❌'}`, 
      evidence.compliance.publicVerification ? colors.green : colors.red);
  log(`Chat Integration: ${evidence.compliance.chatIntegration ? '✅' : '❌'}`, 
      evidence.compliance.chatIntegration ? colors.green : colors.red);

  // Save evidence
  const evidenceFile = `s3-receipts-verify-evidence-${Date.now()}.json`;
  writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
  
  log(`\n💾 Evidence saved to: ${evidenceFile}`, colors.bold + colors.green);

  // Cleanup
  try {
    await runCommand('rm', ['-f', 'test-keys.json', 'test-jwks.mjs', 'test-rotation.mjs']);
  } catch (e) {
    // Ignore cleanup errors
  }

  const allCompliant = Object.values(evidence.compliance).every(c => c);
  
  if (allCompliant) {
    log('\n🎉 S3 RECEIPTS & VERIFY: FULLY COMPLIANT', colors.bold + colors.green);
    log('Ready to proceed with S4 Headers & Transport', colors.green);
  } else {
    log('\n⚠️  S3 RECEIPTS & VERIFY: COMPLIANCE ISSUES DETECTED', colors.bold + colors.red);
    log('Review failed tests before proceeding to S4', colors.red);
  }

  return evidence;
}

// Run evidence collection
if (import.meta.url === `file://${process.argv[1]}`) {
  generateS3Evidence().catch(console.error);
}

export { generateS3Evidence };