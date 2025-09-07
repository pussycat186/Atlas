#!/usr/bin/env node
import fs from "fs";
import path from "path";

const planPath = "scripts/ci/plan.json";
const plan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, "utf8")) : { issues: [] };

function listFiles(dir, acc=[]) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(p, acc); else acc.push(p);
  }
  return acc;
}

function patchTS2835(root="services/witness-node/src") {
  if (!fs.existsSync(root)) return;
  const files = listFiles(root).filter(f => /\.(ts|tsx|mts|cts)$/.test(f));
  const importLike = /(import\s+[^'"\n]+from\s*|export\s*\{[^}]*\}\s*from\s*|export\s+\*\s+from\s*)(["'])(\.\.?:?\/[^"']+?)(\2)/g;
  for (const f of files) {
    let s = fs.readFileSync(f, "utf8");
    const orig = s;
    s = s.replace(importLike, (m, head, quote, rel, q2) => {
      // Skip if already has an extension
      if (/\.(js|cjs|mjs|ts|tsx)$/.test(rel)) return m;
      // Only relative paths
      if (!rel.startsWith("./") && !rel.startsWith("../")) return m;
      const fixed = rel + ".js"; // NodeNext expects runtime .js
      return `${head}${quote}${fixed}${quote}`;
    });
    // Normalize accidental repeated .js (bounded to import/export strings)
    s = s.replace(/(from\s*["'][^"']*?)((?:\.js){2,})(["'])/g, (_, a, many, z) => a + ".js" + z);
    if (s !== orig) {
      fs.writeFileSync(f, s);
      console.log("[PATCH]", f);
    }
  }
}

function ensureCorepackNote() {
  const wf = ".github/workflows/atlas-insights-observability.yml";
  if (!fs.existsSync(wf)) return;
  let y = fs.readFileSync(wf, "utf8");
  if (!/corepack enable/.test(y)) {
    y = y.replace(/(uses: actions\/setup-node@v4[\s\S]*?\n)/, `$1    - name: Enable corepack\n      run: corepack enable\n`);
    fs.writeFileSync(wf, y);
    console.log("[PATCH] workflow corepack enable");
  }
}

for (const i of plan.issues) {
  if (i.kind === "TS2835") patchTS2835();
  if (i.kind === "PNPM_MISSING") ensureCorepackNote();
}

console.log("[APPLY] done");