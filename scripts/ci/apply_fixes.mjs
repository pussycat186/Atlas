import fs from 'fs';
import path from 'path';
const plan = JSON.parse(fs.readFileSync('scripts/ci/plan.json','utf8')||'[]');

function writeJSON(p, mutate){
  const j = JSON.parse(fs.readFileSync(p,'utf8'));
  const out = mutate(j) || j;
  fs.writeFileSync(p, JSON.stringify(out, null, 2)+'\n');
  console.log('[WRITE]', p);
}

function ensureWitnessDeps(){
  const p='services/witness-node/package.json';
  if(!fs.existsSync(p)) return;
  writeJSON(p, (pkg)=>{
    pkg.dependencies ||= {};
    const need={
      "@atlas/fabric-protocol":"workspace:*",
      "@opentelemetry/api":"1.9.0",
      "@opentelemetry/sdk-node":"0.204.0",
      "@opentelemetry/auto-instrumentations-node":"0.62.2",
      "@opentelemetry/exporter-trace-otlp-http":"0.204.0",
      "@opentelemetry/resources":"2.1.0",
      "@opentelemetry/semantic-conventions":"1.37.0"
    };
    let changed=false; for(const[k,v] of Object.entries(need)){ if(!pkg.dependencies[k]||pkg.dependencies[k]!==v){pkg.dependencies[k]=v; changed=true;} }
    if(changed) return pkg;
  });
}

function ensureTsConfig(){
  const p='services/witness-node/tsconfig.json';
  if(!fs.existsSync(p)) return;
  const j = JSON.parse(fs.readFileSync(p,'utf8'));
  j.compilerOptions ||= {};
  j.compilerOptions.baseUrl = j.compilerOptions.baseUrl || '../../';
  j.compilerOptions.moduleResolution = 'NodeNext';
  j.compilerOptions.types = Array.from(new Set([...(j.compilerOptions.types||[]),'node']));
  j.compilerOptions.skipLibCheck = true; // only to silence 3rd‑party d.ts
  j.compilerOptions.paths ||= {};
  j.compilerOptions.paths['@atlas/fabric-protocol'] = ['packages/fabric-protocol/src/index.ts'];
  fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
  console.log('[WRITE]', p);
}

function ensureBodyTypes(){
  const dir='services/witness-node/src'; if(!fs.existsSync(dir)) return;
  const tf=path.join(dir,'types.v11_5.ts');
  if(!fs.existsSync(tf)){
    fs.writeFileSync(tf, `// v11.5 fix: Strong-typed body for witness record\nexport type RecordBody={app:string;record_id:string;payload:unknown;meta?:Record<string,unknown>;};\n`);
    console.log('[WRITE]', tf);
  }
  const rf=path.join(dir,'routes.ts');
  if(fs.existsSync(rf)){
    let s=fs.readFileSync(rf,'utf8');
    if(!/RecordBody/.test(s)) s=`import type { RecordBody } from "./types.v11_5";\n`+s;
    if(/app\.post\([^]*\/witness\/record[^]*=>\s*\{/.test(s) && !/Request<\{\}, any, RecordBody>/.test(s)){
      s=s.replace(/app\.post\(\s*([`'"]\/witness\/record[`'"])\s*,\s*\(\s*req:\s*Request[^)]*\)/,
                   'app.post($1, (req: Request<{}, any, RecordBody>, res: Response)');
    }
    fs.writeFileSync(rf,s); console.log('[PATCH]', rf);
  }
}

function applyPlan(){
  for(const e of plan){
    if(e.type==='missing_module' || e.type==='ts_import_decl'){
      if(/@opentelemetry|@atlas\/fabric-protocol/.test(e.groups[0]||'')){
        ensureWitnessDeps(); ensureTsConfig();
      }
    }
    if(e.type==='unknown_req_body') ensureBodyTypes();
  }
}

// Apply preventive fixes even if no issues found
ensureWitnessDeps();
ensureTsConfig();
applyPlan();
console.log('[APPLY] done');
