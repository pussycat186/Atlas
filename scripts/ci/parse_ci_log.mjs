import fs from 'fs';
const log = fs.readFileSync('scripts/ci/last.log','utf8');
const out=[]; const pick=(re,type)=>{let m;while((m=re.exec(log)))out.push({type,g:[...m].slice(1)});};

pick(/TS2307: Cannot find module '([^']+)'/g,'TS2307_missing_module');
pick(/Cannot find module '([^']+)'/g,'missing_module');
pick(/or its corresponding type declarations/gi,'import_decl_missing');
pick(/TS2339: Property '([^']+)' does not exist on type 'unknown'/g,'TS2339_unknown_body');
pick(/Property '([^']+)' does not exist on type 'unknown'[\s\S]*?(routes|server|index)\.ts/gi,'unknown_body_file');
pick(/TS2688: Cannot find type definition file for 'node'/g,'TS2688_missing_types_node');
pick(/TS2835: Relative import paths need explicit file extensions/g,'TS2835_missing_extensions');
pick(/ERR_REQUIRE_ESM|Must use import to load ES Module/gi,'ESM_CJS_mismatch');

fs.writeFileSync('scripts/ci/plan.json', JSON.stringify(out,null,2));
console.log('[PLAN]',out.length,'issues');