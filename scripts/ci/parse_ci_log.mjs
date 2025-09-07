import fs from 'fs';
const log = fs.readFileSync('scripts/ci/last.log','utf8');
const items = [];
const pats = [
  {type:'missing_module', re: /Cannot find module '([^']+)'/g},
  {type:'ts_import_decl', re: /Cannot find module ([^\n]+) or its corresponding type declarations/gi},
  {type:'unknown_req_body', re: /Property '([^']+)' does not exist on type 'unknown'[\s\S]*?(routes|server|index)\.ts/gi},
  {type:'ts_cannot_find_name', re: /Cannot find name '([^']+)'/g},
  {type:'esm_cjs', re: /(ERR_REQUIRE_ESM|Must use import to load ES Module)/gi}
];
for (const p of pats) { let m; while ((m=p.re.exec(log))!==null) items.push({type:p.type, groups:[...m].slice(1), raw:m[0]}); }
const seen=new Set(), uniq=[]; for (const e of items){const k=e.type+'|'+e.groups.join('|'); if(!seen.has(k)){seen.add(k); uniq.push(e);} }
fs.writeFileSync('scripts/ci/plan.json', JSON.stringify(uniq,null,2));
console.log('[PLAN]', uniq.length, 'issues');
