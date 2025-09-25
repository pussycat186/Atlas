#!/usr/bin/env node
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = process.cwd();
const ARCHIVE_ROOT = path.join(REPO, 'docs/evidence/archived-local');

function sh(cmd) {
  return cp.execSync(cmd, { cwd: REPO, encoding: 'utf8' }).trim();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  // Find all files containing localhost-like patterns, excluding node_modules and docs/evidence
  const cmd = `git grep -lE "(localhost|127\\.0\\.0\\.1|webServer)" -- ':(exclude)node_modules' ':(exclude)docs/evidence'`;
  const out = sh(cmd);
  const files = out.split('\n').filter(Boolean);
  if (!files.length) {
    console.log('No localhost files to archive.');
    return;
  }
  for (const rel of files) {
    // Skip the archive destination itself if present
    if (rel.startsWith('docs/evidence/')) continue;
    const dest = path.join(ARCHIVE_ROOT, rel);
    ensureDir(path.dirname(dest));
    // Use git mv to preserve history
    sh(`git mv "${rel}" "${dest}"`);
  }
  console.log(`Archived ${files.length} files to ${path.relative(REPO, ARCHIVE_ROOT)}`);
}

main();
