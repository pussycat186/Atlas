#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const REPO = process.cwd();
const MOVESET = path.join(REPO, 'docs/REPLAN/MOVESET.csv');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function run(cmd) {
  cp.execSync(cmd, { stdio: 'inherit', cwd: REPO });
}

function main() {
  const csv = fs.readFileSync(MOVESET, 'utf8').split(/\r?\n/).filter(Boolean);
  // skip header
  for (let i = 1; i < csv.length; i++) {
    const line = csv[i];
    const [from, to] = line.split(',').slice(0, 2);
    if (!from || !to) continue;
    const absFrom = path.join(REPO, from);
    const absTo = path.join(REPO, to);
    const toDir = path.dirname(absTo);
    if (!fs.existsSync(absFrom)) {
      continue; // skip missing
    }
    ensureDir(toDir);
    // use git mv to keep history
    run(`git mv "${from}" "${to}"`);
  }
}

main();
