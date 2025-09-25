#!/usr/bin/env node
/*
  Replan Scan: Generates
  - docs/REPLAN/INVENTORY.csv (path,size_bytes,sha256,first_line,tracked_imports_count)
  - docs/REPLAN/USAGE_MAP.json
  - docs/REPLAN/LOCALHOST_HITS.txt
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = process.cwd();
const OUT_DIR = path.join(REPO_ROOT, 'docs', 'REPLAN');

const TEXT_EXTS = new Set([
  '.js','.jsx','.ts','.tsx','.cjs','.mjs','.json','.md','.mdx','.yml','.yaml','.toml','.rego','.css','.scss','.sass','.less','.txt','.sh','.cjs','.mjs','.html','.htm','.svg','.conf','.xml','.yml','.yaml'
]);

const IGNORE_DIRS = new Set([
  'node_modules','.git','.next','dist','build','coverage','.turbo','.cache','.vercel'
]);

function isBinaryLikely(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTS.has(ext)) return false;
  // Heuristic: treat large non-text extensions as binary likely
  return ['.png','.jpg','.jpeg','.gif','.bmp','.webp','.svg','.ico','.zip','.tar','.gz','.tgz','.bz2','.7z','.mp4','.mov','.pdf','.spdx'].includes(ext);
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const buf = fs.readFileSync(filePath);
  hash.update(buf);
  return hash.digest('hex');
}

function firstLine(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4096);
    const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    if (!bytes) return '';
    const str = buffer.slice(0, bytes).toString('utf8');
    const nl = str.indexOf('\n');
    return (nl === -1 ? str : str.slice(0, nl)).trim();
  } catch {
    return '';
  }
}

const importRegexps = [
  /import\s+[^'"`]*['"`]([^'"`]+)['"`]/g,             // import x from 'y'
  /import\s*\(['"`]([^'"`]+)['"`]\)/g,                // dynamic import('y')
  /require\(\s*['"`]([^'"`]+)['"`]\s*\)/g,           // require('y')
  /export\s+\*\s+from\s*['"`]([^'"`]+)['"`]/g         // export * from 'y'
];

const localhostRe = /(localhost|127\.0\.0\.1|webServer)/i;

function walk(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name.startsWith('.DS_Store')) continue;
    const p = path.join(dir, ent.name);
    const rel = path.relative(REPO_ROOT, p);
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      acc.push({ type: 'dir', path: rel });
      walk(p, acc);
    } else if (ent.isFile()) {
      acc.push({ type: 'file', path: rel });
    }
  }
  return acc;
}

function fileImports(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return [];
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const imports = new Set();
    for (const re of importRegexps) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(txt))) {
        imports.add(m[1]);
      }
    }
    return Array.from(imports);
  } catch {
    return [];
  }
}

function scanLocalhost(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return [];
  const hits = [];
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (localhostRe.test(line)) {
        hits.push(`${filePath}:${i + 1}:${line.trim()}`);
      }
    }
  } catch {}
  return hits;
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function main() {
  ensureOutDir();
  const entries = walk(REPO_ROOT);
  const files = entries.filter(e => e.type === 'file');

  const invPath = path.join(OUT_DIR, 'INVENTORY.csv');
  const usagePath = path.join(OUT_DIR, 'USAGE_MAP.json');
  const localhostPath = path.join(OUT_DIR, 'LOCALHOST_HITS.txt');

  const invRows = ['path,size_bytes,sha256,first_line,tracked_imports_count'];
  const usage = { schema_version: 1, generated_at_utc: new Date().toISOString(), files: {} };
  const localhostHits = [];

  for (const f of files) {
    const abs = path.join(REPO_ROOT, f.path);
    let size = 0;
    try { size = fs.statSync(abs).size; } catch {}
    let hash = '';
    try { hash = sha256File(abs); } catch {}
    const fl = firstLine(abs).replace(/,/g, ' ');
    const imports = fileImports(abs);

    invRows.push(`${f.path},${size},${hash},${fl},${imports.length}`);

    usage.files[f.path] = usage.files[f.path] || { imports: [], imported_by: [] };
    usage.files[f.path].imports = imports;

    const hits = scanLocalhost(abs);
    if (hits.length) localhostHits.push(...hits);
  }

  // build reverse imported_by map
  for (const [file, data] of Object.entries(usage.files)) {
    for (const imp of data.imports) {
      // Only record relative (local) imports to map to files where possible
      if (imp.startsWith('.')) {
        const fromDir = path.dirname(file);
        const resolved = resolveImportToFile(fromDir, imp, usage.files);
        if (resolved) {
          usage.files[resolved] = usage.files[resolved] || { imports: [], imported_by: [] };
          if (!usage.files[resolved].imported_by.includes(file)) {
            usage.files[resolved].imported_by.push(file);
          }
        }
      }
    }
  }

  fs.writeFileSync(invPath, invRows.join('\n'));
  fs.writeFileSync(usagePath, JSON.stringify(usage, null, 2));
  fs.writeFileSync(localhostPath, localhostHits.join('\n'));
}

function resolveImportToFile(fromDir, spec, fileMap) {
  // Try common TS/JS resolutions
  const candidates = [];
  const base = path.normalize(path.join(fromDir, spec));
  const exts = ['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json'];
  // Direct file
  for (const ext of exts) candidates.push(base + ext);
  candidates.push(base);
  // Index file in directory
  for (const ext of exts) candidates.push(path.join(base, 'index' + ext));

  for (const rel of candidates) {
    const norm = rel.split(path.sep).join(path.posix.sep);
    if (fileMap[norm]) return norm;
  }
  return null;
}

main();
