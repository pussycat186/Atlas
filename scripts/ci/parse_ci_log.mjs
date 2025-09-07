#!/usr/bin/env node
import fs from "fs";

const LOG = process.argv[2] || "scripts/ci/last.log";
const text = fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf8") : "";
const plan = { issues: [] };

// TS2835 – NodeNext requires explicit file extensions for relative imports
const ts2835Re = /TS2835:[\s\S]*?Relative import paths need explicit file extensions[\s\S]*?\n/g;
if (ts2835Re.test(text)) {
  plan.issues.push({ kind: "TS2835", note: "Missing .js extension in relative imports under NodeNext" });
}

// pnpm/lockfile drift
if (/ERR_PNPM_OUTDATED_LOCKFILE/.test(text)) {
  plan.issues.push({ kind: "LOCK_DRIFT", note: "pnpm-lock.yaml not in sync" });
}

// corepack/pnpm unavailable
if (/Unable to locate executable file: pnpm/.test(text)) {
  plan.issues.push({ kind: "PNPM_MISSING", note: "corepack enable needed before pnpm usage" });
}

console.log("[PLAN]", plan.issues.length, "issues");
fs.mkdirSync("scripts/ci", { recursive: true });
fs.writeFileSync("scripts/ci/plan.json", JSON.stringify(plan, null, 2));