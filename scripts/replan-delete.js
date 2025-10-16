#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const REPO = process.cwd();
const DELETESET = path.join(REPO, 'docs/REPLAN/DELETESET.txt');

function run(cmd) {
  cp.execSync(cmd, { stdio: 'inherit', cwd: REPO, shell: '/bin/zsh' });
}

function main() {
  const lines = fs.readFileSync(DELETESET, 'utf8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  for (const p of lines) {
    // Use git rm with ignore-unmatch so missing files don't fail the script
    try {
      run(`git rm -r --ignore-unmatch ${p}`);
    } catch (e) {
      // continue
    }
  }
}

main();
