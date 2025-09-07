import fs from 'fs'; import path from 'path';
const plan = JSON.parse(fs.readFileSync('scripts/ci/plan.json','utf8')||'[]');

const writeJSON=(p,mut)=>{const j=JSON.parse(fs.readFileSync(p,'utf8'));const o=mut(j)||j;fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');console.log('[WRITE]',p);};

function ensureWitnessDeps(){
  const p='services/witness-node/package.json'; if(!fs.existsSync(p)) return;
  writeJSON(p,(pkg)=>{
    pkg.type = pkg.type || 'module';
    pkg.dependencies ||= {};
    const need={
      "@atlas/fabric-protocol":"workspace:*",
      "@opentelemetry/api":"1.9.0",
      "@opentelemetry/sdk-node":"0.204.0",
      "@opentelemetry/auto-instrumentations-node":"0.62.2",
      "@opentelemetry/exporter-trace-otlp-http":"0.204.0",
      "@opentelemetry/resources":"2.1.0",
      "@opentelemetry/semantic-conventions":"1.37.0",
      "express":"5.1.0","@types/express":"5.0.3"
    };
    let ch=false; for(const[k,v] of Object.entries(need)){ if(!pkg.dependencies[k]||pkg.dependencies[k]!==v){pkg.dependencies[k]=v; ch=true;} }
    return ch?pkg:undefined;
  });
}
function ensureTsConfig(){
  const p='services/witness-node/tsconfig.json'; if(!fs.existsSync(p)) return;
  const j=JSON.parse(fs.readFileSync(p,'utf8'));
  j.compilerOptions ||= {};
  j.compilerOptions.target = j.compilerOptions.target || "ES2022";
  j.compilerOptions.module = "NodeNext";
  j.compilerOptions.moduleResolution = "NodeNext";
  j.compilerOptions.types = Array.from(new Set([...(j.compilerOptions.types||[]),"node"]));
  j.compilerOptions.skipLibCheck = true;
  j.compilerOptions.baseUrl = j.compilerOptions.baseUrl || "../../";
  j.compilerOptions.paths ||= {};
  j.compilerOptions.paths["@atlas/fabric-protocol"]=["packages/fabric-protocol/src/index.ts"];
  fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n'); console.log('[WRITE]',p);
}
function ensureAmbientShims(){
  const dir='services/witness-node/src'; if(!fs.existsSync(dir)) return;
  const f=path.join(dir,'shims.v11_5.d.ts');
  if(!fs.existsSync(f)){ fs.writeFileSync(f,'declare module "@atlas/fabric-protocol";\n'); console.log('[WRITE]',f); }
}
function ensureBodyTypes(){
  const dir='services/witness-node/src'; if(!fs.existsSync(dir)) return;
  const tf=path.join(dir,'types.v11_5.ts');
  if(!fs.existsSync(tf)){ fs.writeFileSync(tf,'export type RecordBody={app:string;record_id:string;payload:unknown;meta?:Record<string,unknown>;};\n'); console.log('[WRITE]',tf); }
  const rf=path.join(dir,'routes.ts');
  if(fs.existsSync(rf)){
    let s=fs.readFileSync(rf,'utf8');
    if(!/RecordBody/.test(s)) s=`import type { RecordBody } from "./types.v11_5";\n`+s;
    if(/app\.post\([^]*\/witness\/record[^]*=>\s*\{/.test(s) && !/Request<\{\}, any, RecordBody>/.test(s)){
      s=s.replace(/app\.post\(\s*([`'\"]\/witness\/record[`'\"]),\s*\(\s*req:\s*Request[^)]*\)/,
                  'app.post($1,(req: Request<{}, any, RecordBody>, res: Response)');
    }
    fs.writeFileSync(rf,s); console.log('[PATCH]',rf);
  }
}
function fixImportExtensions(){
  const dir='services/witness-node/src'; if(!fs.existsSync(dir)) return;
  const files=['index.ts','server.ts','witness.ts'];
  for(const f of files){
    const p=path.join(dir,f);
    if(fs.existsSync(p)){
      let s=fs.readFileSync(p,'utf8');
      // Only add .js if not already present and not already .js
      s=s.replace(/from '\.\/([^']+)(?!\.js)'/g,"from './$1.js'");
      s=s.replace(/from "\.\/([^"]+)(?!\.js)"/g,'from "./$1.js"');
      fs.writeFileSync(p,s); console.log('[PATCH]',p);
    }
  }
}
function applyByError(e){
  switch(e.type){
    case 'TS2307_missing_module':
    case 'missing_module':
    case 'import_decl_missing':
      ensureWitnessDeps(); ensureTsConfig(); ensureAmbientShims(); break;
    case 'TS2339_unknown_body':
    case 'unknown_body_file':
      ensureBodyTypes(); break;
    case 'TS2688_missing_types_node':
      ensureTsConfig(); break;
    case 'TS2835_missing_extensions':
      fixImportExtensions(); break;
    case 'ESM_CJS_mismatch':
      ensureTsConfig(); ensureWitnessDeps(); break;
  }
}

ensureWitnessDeps(); ensureTsConfig();
for(const e of plan) applyByError(e);
console.log('[APPLY] done');