#!/usr/bin/env node
import fs from 'node:fs';
const log = fs.existsSync('scripts/ci/last.log') ? fs.readFileSync('scripts/ci/last.log','utf8') : '';
const plan = [];

// TS2835: add .js to relative imports
if (/TS2835: Relative import paths need explicit file extensions/i.test(log) || /error TS2835:/i.test(log)) {
  plan.push({kind: 'ts2835', where: 'services/witness-node/src'});
}

// pnpm not found
if (/Unable to locate executable file: pnpm/i.test(log)) {
  plan.push({kind: 'ci_corepack'});
}

// lockfile mismatch
if (/ERR_PNPM_OUTDATED_LOCKFILE|not up to date with .*package\.json/i.test(log)) {
  plan.push({kind: 'lock_unsync'});
}

console.log(`[PLAN] ${plan.length} issue(s)`);
fs.writeFileSync('scripts/ci/plan.json', JSON.stringify(plan, null, 2));
