#!/usr/bin/env node
/**
 * S0 - Sanity & Inventory
 * Atlas PDF Tech Stack Integration
 * Evidence-first, remote-only CI
 */

const fs = require('fs');
const path = require('path');

// Read timestamp
const timestampFile = '.atlas-evidence-timestamp.txt';
const timestamp = fs.existsSync(timestampFile) 
  ? fs.readFileSync(timestampFile, 'utf8').trim() 
  : new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15);

const evidenceRoot = `docs/evidence/${timestamp}`;

console.log(`🔍 S0 - Sanity & Inventory`);
console.log(`📂 Evidence root: ${evidenceRoot}`);

// Ensure evidence directory exists
if (!fs.existsSync(evidenceRoot)) {
  fs.mkdirSync(evidenceRoot, { recursive: true });
}

// Inventory structure
const inventory = {
  timestamp: new Date().toISOString(),
  stage: 'S0',
  repository: {
    name: 'Atlas',
    owner: 'pussycat186',
    branch: 'feat/pdf-tech-stack-integration'
  },
  apps: [],
  packages: [],
  routes: {},
  middleware: {},
  securityHeaders: {},
  secrets: {
    checked: [],
    present: [],
    missing: []
  },
  nextConfigs: {}
};

// Scan apps
const appsDir = 'apps';
if (fs.existsSync(appsDir)) {
  const apps = fs.readdirSync(appsDir);
  for (const app of apps) {
    const appPath = path.join(appsDir, app);
    if (fs.statSync(appPath).isDirectory()) {
      const appInfo = {
        name: app,
        path: appPath,
        hasPackageJson: fs.existsSync(path.join(appPath, 'package.json')),
        hasNextConfig: fs.existsSync(path.join(appPath, 'next.config.js')) || 
                       fs.existsSync(path.join(appPath, 'next.config.ts')),
        hasMiddleware: fs.existsSync(path.join(appPath, 'middleware.ts')) ||
                       fs.existsSync(path.join(appPath, 'middleware.js')),
        hasAppDir: fs.existsSync(path.join(appPath, 'app')),
        hasPagesDir: fs.existsSync(path.join(appPath, 'pages'))
      };
      inventory.apps.push(appInfo);
      
      // Check middleware
      const middlewarePath = path.join(appPath, 'middleware.ts');
      if (fs.existsSync(middlewarePath)) {
        const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
        inventory.middleware[app] = {
          exists: true,
          hasCSP: middlewareContent.includes('Content-Security-Policy'),
          hasCOOP: middlewareContent.includes('Cross-Origin-Opener-Policy'),
          hasCOEP: middlewareContent.includes('Cross-Origin-Embedder-Policy'),
          hasHSTS: middlewareContent.includes('Strict-Transport-Security'),
          hasDPoP: middlewareContent.includes('DPoP') || middlewareContent.includes('dpop')
        };
      }
      
      // Check next.config
      const nextConfigPath = path.join(appPath, 'next.config.js');
      if (fs.existsSync(nextConfigPath)) {
        const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
        inventory.nextConfigs[app] = {
          hasHeaders: nextConfigContent.includes('async headers()'),
          hasOutputStandalone: nextConfigContent.includes("output: 'standalone'"),
          hasTranspilePackages: nextConfigContent.includes('transpilePackages'),
          hasOutputFileTracingRoot: nextConfigContent.includes('outputFileTracingRoot')
        };
      }
    }
  }
}

// Scan packages
const packagesDir = 'packages/@atlas';
if (fs.existsSync(packagesDir)) {
  const packages = fs.readdirSync(packagesDir);
  for (const pkg of packages) {
    const pkgPath = path.join(packagesDir, pkg);
    if (fs.statSync(pkgPath).isDirectory()) {
      inventory.packages.push({
        name: `@atlas/${pkg}`,
        path: pkgPath,
        hasPackageJson: fs.existsSync(path.join(pkgPath, 'package.json')),
        hasSrc: fs.existsSync(path.join(pkgPath, 'src')),
        hasDist: fs.existsSync(path.join(pkgPath, 'dist'))
      });
    }
  }
}

// Check secrets (without echoing values)
const requiredSecrets = [
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'GCP_PROJECT_ID',
  'GCP_PROJECT_NUMBER',
  'GCP_REGION',
  'GCP_WORKLOAD_ID_PROVIDER',
  'GCP_DEPLOYER_SA',
  'ARTIFACT_REPO',
  'DOMAINS_JSON'
];

const optionalSecrets = [
  'FIGMA_TOKEN',
  'FIGMA_FILE_KEY'
];

for (const secret of requiredSecrets) {
  inventory.secrets.checked.push(secret);
  if (process.env[secret]) {
    inventory.secrets.present.push(secret);
  } else {
    inventory.secrets.missing.push(secret);
  }
}

// Check optional secrets
for (const secret of optionalSecrets) {
  inventory.secrets.checked.push(secret);
  if (process.env[secret]) {
    inventory.secrets.present.push(secret);
  }
}

// Security headers summary
inventory.securityHeaders = {
  appsWithMiddleware: Object.keys(inventory.middleware).length,
  appsWithCSP: Object.values(inventory.middleware).filter(m => m.hasCSP).length,
  appsWithCOOP: Object.values(inventory.middleware).filter(m => m.hasCOOP).length,
  appsWithCOEP: Object.values(inventory.middleware).filter(m => m.hasCOEP).length,
  appsWithHSTS: Object.values(inventory.middleware).filter(m => m.hasHSTS).length,
  appsWithDPoP: Object.values(inventory.middleware).filter(m => m.hasDPoP).length
};

// Summary
inventory.summary = {
  totalApps: inventory.apps.length,
  totalPackages: inventory.packages.length,
  secretsPresent: inventory.secrets.present.length,
  secretsMissing: inventory.secrets.missing.length,
  appsReady: inventory.apps.filter(a => 
    a.hasPackageJson && a.hasNextConfig && a.hasMiddleware
  ).length
};

// Write evidence
const evidencePath = path.join(evidenceRoot, 's0-inventory.json');
fs.writeFileSync(evidencePath, JSON.stringify(inventory, null, 2));

console.log(`✅ S0 complete`);
console.log(`   Apps: ${inventory.summary.totalApps}`);
console.log(`   Packages: ${inventory.summary.totalPackages}`);
console.log(`   Secrets present: ${inventory.secrets.present.length}/${requiredSecrets.length}`);
console.log(`   Apps with security middleware: ${inventory.securityHeaders.appsWithMiddleware}`);
console.log(`📄 Evidence: ${evidencePath}`);

// Exit with error if critical secrets missing
if (inventory.secrets.missing.length > 0) {
  console.warn(`⚠️  Missing secrets (will use defaults in CI): ${inventory.secrets.missing.join(', ')}`);
}

process.exit(0);
