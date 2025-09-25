#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ATLAS Commercializer v10 - Setup Verification\n');

// Check if LIVE_URLS.json exists and has correct structure
console.log('1. Checking LIVE_URLS.json...');
try {
  const liveUrls = JSON.parse(fs.readFileSync('LIVE_URLS.json', 'utf8'));
  if (liveUrls.gateway && liveUrls.frontends && liveUrls.witnesses) {
    console.log('   ✅ LIVE_URLS.json structure is correct');
    console.log(`   📡 Gateway: ${liveUrls.gateway}`);
    console.log(`   🌐 Frontends: ${Object.keys(liveUrls.frontends).length} configured`);
    console.log(`   👥 Witnesses: ${liveUrls.witnesses.length} configured`);
  } else {
    console.log('   ❌ LIVE_URLS.json missing required fields');
    process.exit(1);
  }
} catch (error) {
  console.log('   ❌ LIVE_URLS.json not found or invalid JSON');
  process.exit(1);
}

// Check if config package is built
console.log('\n2. Checking @atlas/config package...');
const configDist = 'packages/config/dist';
if (fs.existsSync(configDist)) {
  console.log('   ✅ Config package is built');
} else {
  console.log('   ❌ Config package not built - running build...');
  const { execSync } = require('child_process');
  try {
    execSync('cd packages/config && npm run build', { stdio: 'inherit' });
    console.log('   ✅ Config package built successfully');
  } catch (error) {
    console.log('   ❌ Failed to build config package');
    process.exit(1);
  }
}

// Check if apps have config dependency
console.log('\n3. Checking app dependencies...');
const apps = ['proof-messenger', 'admin-insights', 'dev-portal'];
apps.forEach(app => {
  const packageJson = JSON.parse(fs.readFileSync(`apps/${app}/package.json`, 'utf8'));
  if (packageJson.dependencies['@atlas/config']) {
    console.log(`   ✅ ${app} has @atlas/config dependency`);
  } else {
    console.log(`   ❌ ${app} missing @atlas/config dependency`);
  }
});

// Check if tests exist
console.log('\n4. Checking test files...');
const testFiles = [
  'tests/playwright.config.ts',
  'tests/messenger.spec.ts',
  'tests/admin.spec.ts',
  'tests/dev-portal.spec.ts',
  'tests/accessibility.spec.ts',
  'tests/lhci.json',
  'tests/lhci-pro.json'
];

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// Check if CI workflow exists
console.log('\n5. Checking CI workflow...');
if (fs.existsSync('.github/workflows/ux-ci.yml')) {
  console.log('   ✅ CI workflow exists');
} else {
  console.log('   ❌ CI workflow missing');
}

// Check for localhost references in critical files
console.log('\n6. Checking for localhost references...');
const criticalFiles = [
  'apps/proof-messenger/src/app/page.tsx',
  'apps/admin-insights/src/app/metrics/page.tsx',
  'apps/dev-portal/src/app/page.tsx'
];

let localhostFound = false;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('localhost')) {
      console.log(`   ⚠️  ${file} contains localhost references`);
      localhostFound = true;
    }
  }
});

if (!localhostFound) {
  console.log('   ✅ No localhost references found in critical files');
}

console.log('\n🎉 Setup verification complete!');
console.log('\n📋 Next steps:');
console.log('   1. Set up Vercel projects for each app');
console.log('   2. Configure GitHub secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID_*');
console.log('   3. Run: pnpm install to ensure all dependencies are installed');
console.log('   4. Test locally: pnpm exec playwright test --config=tests/playwright.config.ts');
console.log('   5. Create a pull request to trigger CI gates');
