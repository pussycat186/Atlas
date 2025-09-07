import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const files = [
  'services/witness-node/src/index.ts',
  'services/witness-node/src/server.ts',
  'services/witness-node/src/witness.ts',
];

function fixImportExtensions(src) {
  // Only touch bare relative imports without an extension
  return src.replace(/(from\s+['"])(\.\.?(?:\/[\w.-]+)*)(['"])/g, (m, a, p, z) => {
    // If already ends with .js/.ts/.mjs/.cjs skip
    if (/\.(?:js|ts|mjs|cjs)$/.test(p)) return m;
    return `${a}${p}.js${z}`;
  }).replace(/(from\s+['"][^'"]*?)\.(?:js\.)+js(['"])/g, '$1.js$2'); // normalize .js.js...
}

for (const rel of files) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  const after = fixImportExtensions(before);
  if (after !== before) {
    fs.writeFileSync(p, after);
    console.log('[PATCH]', rel);
  }
}
console.log('[APPLY] done');