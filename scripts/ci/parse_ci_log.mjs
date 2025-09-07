#!/usr/bin/env node
import fs from "fs";
const log = fs.existsSync("scripts/ci/last.log") ? fs.readFileSync("scripts/ci/last.log","utf8") : "";
const plan = { ts2835: [], pnpmMissing:false, lockfileDrift:false };

// TS2835: Relative import paths need explicit file extensions
const ts2835Re = /error TS2835:[^\n]+\n\s*([0-9A-Za-z_\-\/\.]+\.ts)/g;
let m; while ((m = ts2835Re.exec(log))) { plan.ts2835.push(m[1]); }

// pnpm not found / corepack
if (/Unable to locate executable file: pnpm/.test(log) || /This project is configured to use pnpm/.test(log)) plan.pnpmMissing = true;

// frozen lockfile drift
if (/ERR_PNPM_OUTDATED_LOCKFILE/.test(log)) plan.lockfileDrift = true;

fs.mkdirSync("scripts/ci", { recursive:true });
fs.writeFileSync("scripts/ci/plan.json", JSON.stringify(plan,null,2));
console.log("[PLAN]", plan);
