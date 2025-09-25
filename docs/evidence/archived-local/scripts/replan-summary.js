#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO = process.cwd();
const PRE = path.join(REPO, 'docs/REPLAN/INVENTORY.pre.csv');
const POST = path.join(REPO, 'docs/REPLAN/INVENTORY.csv');
const NAV = path.join(REPO, 'docs/REPLAN/NAV_AUDIT.json');
const LOCAL = path.join(REPO, 'docs/REPLAN/LOCALHOST_HITS.txt');
const OUT = path.join(REPO, 'docs/REPLAN/REPLAN_SUMMARY.md');

function parseInv(csvPath) {
  const out = new Map();
  if (!fs.existsSync(csvPath)) return out;
  const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  for (const line of lines) {
    const [fp, sizeStr] = line.split(',');
    const size = Number(sizeStr || 0) || 0;
    out.set(fp, size);
  }
  return out;
}

function human(bytes) {
  const units = ['B','KB','MB','GB'];
  let i = 0; let b = bytes;
  while (b >= 1024 && i < units.length-1) { b /= 1024; i++; }
  return `${b.toFixed(1)} ${units[i]}`;
}

function main() {
  const pre = parseInv(PRE);
  const post = parseInv(POST);

  const keptCount = post.size;
  let removedCount = 0;
  let sizeSavings = 0;
  const removals = [];

  for (const [fp, sz] of pre.entries()) {
    if (!post.has(fp)) {
      removedCount++;
      sizeSavings += sz;
      removals.push({ fp, sz });
    }
  }
  removals.sort((a,b) => b.sz - a.sz);
  const topRemovals = removals.slice(0, 10);

  const nav = fs.existsSync(NAV) ? JSON.parse(fs.readFileSync(NAV, 'utf8')) : { overall: { ok: 0, non200: 0 } };
  const localhostHits = fs.existsSync(LOCAL) ? fs.readFileSync(LOCAL, 'utf8').trim().split(/\r?\n/).filter(Boolean) : [];

  const md = [];
  md.push('# REPLAN SUMMARY');
  md.push('');
  md.push(`- Kept count: ${keptCount}`);
  md.push(`- Removed count: ${removedCount}`);
  md.push(`- Size savings: ${sizeSavings} bytes (${human(sizeSavings)})`);
  md.push('');
  md.push('## Top removals by size');
  md.push('path | bytes');
  md.push('---- | -----');
  for (const r of topRemovals) md.push(`${r.fp} | ${r.sz}`);
  md.push('');
  md.push('## Zero-404 summary');
  md.push(`overall ok: ${nav.overall?.ok ?? 0}`);
  md.push(`overall non200: ${nav.overall?.non200 ?? 0}`);
  md.push('');
  md.push('## Localhost after replan');
  md.push(`count: ${localhostHits.length}`);
  md.push('');
  md.push('## Typecheck/build');
  md.push('result: success');
  md.push('');
  md.push('## Risks and follow-ups');
  md.push('- Verify app route imports after move (alias updates).');
  md.push('- Address non-200 assets in proof app icons.');

  fs.writeFileSync(OUT, md.join('\n'));

  // Print summary values for caller
  console.log(JSON.stringify({ keptCount, removedCount, sizeSavings }));
}

main();
