#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const planPath = 'scripts/ci/plan.json';
const plan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath,'utf8')) : [];

function patchFile(filename) {
  const src = fs.readFileSync(filename, 'utf8');
  // Only patch inside import/export specifiers; avoid running multiple times.
  const patched = src.replace(/(from\s*['"])(\.\.?\/[^'"\n]+?)(['"])/g, (m, a, p, z) => {
    // Already has an extension? leave it.
    if (/\.[a-zA-Z0-9]+$/.test(p)) return a + p.replace(/(\.js){2,}$/,'\.js') + z;
    // Otherwise append .js
    return a + (p + '.js') + z;
  });
  if (patched !== src) {
    fs.writeFileSync(filename, patched, 'utf8');
    console.log(`[PATCH] ${filename}`);
  }
}

function globTs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...globTs(p));
    else if (/\.(ts|tsx|mts|cts)$/.test(entry)) out.push(p);
  }
  return out;
}

function ensureTsConfig() {
  const file = 'services/witness-node/tsconfig.json';
  const base = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : {};
  base.compilerOptions = base.compilerOptions || {};
  base.compilerOptions.module = base.compilerOptions.module || 'NodeNext';
  base.compilerOptions.moduleResolution = base.compilerOptions.moduleResolution || 'NodeNext';
  base.compilerOptions.skipLibCheck = base.compilerOptions.skipLibCheck ?? true;
  fs.writeFileSync(file, JSON.stringify(base, null, 2));
  console.log(`[WRITE] ${file}`);
}

function runTs2835() {
  ensureTsConfig();
  const root = 'services/witness-node/src';
  if (!fs.existsSync(root)) return;
  for (const f of globTs(root)) patchFile(f);
}

for (const step of plan) {
  if (step.kind === 'ts2835') runTs2835();
  if (step.kind === 'ci_corepack') console.log('[HINT] Add `corepack enable` before pnpm in CI.');
  if (step.kind === 'lock_unsync') console.log('[HINT] Update pnpm-lock.yaml.');
}

if (plan.length === 0) console.log('[APPLY] nothing to do');