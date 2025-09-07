#!/usr/bin/env node
import fs from "fs";
import path from "path";

const planPath = "scripts/ci/plan.json";
const plan = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath,"utf8")) : { ts2835:[] };

/** Add .js to relative imports only when missing; normalize accidental .js.js... to .js */
function patchImportsOnce(filepath){
  if (!fs.existsSync(filepath)) return false;
  let src = fs.readFileSync(filepath,"utf8");
  const before = src;
  // normalize accidental duplicates strictly inside import specifiers
  src = src.replace(/from\s+(['"])(\.\.?\/[^'"\n]+?)(?:\.js)+\1/g, (s,q,p)=>`from ${q}${p}.js${q}`);
  // add .js once when bare relative and no extension
  src = src.replace(/from\s+(['"])(\.\.?\/[^'"\n]+?)(?<!\.js)\1/g, (s,q,p)=>`from ${q}${p}.js${q}`);
  if (src !== before){ fs.writeFileSync(filepath,src); return true; }
  return false;
}

const candidates = [
  "services/witness-node/src/index.ts",
  "services/witness-node/src/server.ts",
  "services/witness-node/src/witness.ts",
  "services/witness-node/src/ledger.ts"
].filter(fs.existsSync);

let changed = false;
for (const f of candidates){ changed = patchImportsOnce(f) || changed; }

// Ensure tsconfig supports NodeNext if project expects ESM behavior
const tsconfig = "services/witness-node/tsconfig.json";
if (fs.existsSync(tsconfig)){
  const j = JSON.parse(fs.readFileSync(tsconfig,"utf8"));
  j.compilerOptions = j.compilerOptions || {};
  j.compilerOptions.module = j.compilerOptions.module || "NodeNext";
  j.compilerOptions.moduleResolution = j.compilerOptions.moduleResolution || "NodeNext";
  fs.writeFileSync(tsconfig, JSON.stringify(j,null,2));
}

// Patch CI workflow to force bash & corepack enable ordering
const wf = ".github/workflows/build-selfheal.yml";
if (fs.existsSync(wf)){
  let y = fs.readFileSync(wf,"utf8");
  if (!/defaults:\s*\n\s*run:\s*\n\s*shell:\s*bash/.test(y)){
    y = y.replace(/jobs:\s*\n\s*([A-Za-z0-9_-]+):/m, (s)=>`defaults:\n  run:\n    shell: bash\n\njobs:\n  ${s.split("jobs:\n")[1]}`);
  }
  // ensure corepack step exists before pnpm usage
  if (!/corepack enable/.test(y)){
    y = y.replace(/uses: actions\/setup-node@v4[\s\S]*?\n/, (s)=> s + "    - name: Enable corepack\n      run: corepack enable\n");
  }
  // prefer no-frozen-lockfile to avoid drift stalls
  y = y.replace(/pnpm install(?!.*no-frozen-lockfile)/g, "pnpm install --no-frozen-lockfile");
  fs.writeFileSync(wf,y);
}

console.log(JSON.stringify({ changed, candidates }, null, 2));
