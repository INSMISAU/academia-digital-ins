// Only an isolated local database is used; no real accounts or emails are created.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url),tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ins-open-admin-'));
const {Miniflare}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const {build}=await import(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
const modules={login:'administration-session',account:'account',check:'team-access',admin:'administration/academy',work:'administration/workspace',access:'administration/access'};
const {outputFiles}=await build({stdin:{contents:Object.entries(modules).map(([n,p])=>`import * as ${n}Route from './app/api/${p}/route';`).join('\n')+`const routes={${Object.keys(modules).map(n=>n+':'+n+'Route').join(',')}};export default {fetch(r){return routes[new URL(r.url).pathname.slice(1)][r.method](r);}}`,resolveDir:process.cwd(),loader:'ts'},write:false,bundle:true,format:'esm',platform:'neutral',mainFields:['module','main'],external:['cloudflare:workers','node:async_hooks','node:crypto'],tsconfig:'tsconfig.json'});
const options={modules:true,script:outputFiles[0].text,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],d1Persist:tmp,bindings:{INS_OPEN_ADMIN_REGISTRATION:'1'}};
const mf=new Miniflare(options);let checks=0;
async function call(route,status,{body,token='',bearer='a'.repeat(64)}={}){
 const response=await mf.dispatchFetch('https://academy.test/'+route,{method:body?'POST':'GET',headers:{Origin:'https://insmisau.github.io',Authorization:'Bearer '+bearer,'X-Academy-Team':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();assert.equal(response.status,status,JSON.stringify({route,data}));checks++;return data;
}
try{
 let db=await mf.getD1Database('DB');
 for(const f of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await fs.readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 const info=await call('account',200);assert.equal(info.registrationOpen,false);assert.equal(info.administration,false);
 await call('login',401,{body:{email:'new@example.invalid',password:'Frase de ensaio suficientemente longa 123'}});
 await call('account',503,{body:{action:'register',name:'Ensaio',email:'new@example.invalid',password:'Frase de ensaio suficientemente longa 123',notice:info.notice}});
 for(const route of ['check','admin','work','access'])await call(route,401,{token:'a0ce5510ade0'+'e'.repeat(52)});
 assert.equal((await db.prepare('SELECT count(*) n FROM academy_accounts').first()).n,0);
 console.log('Retired development mode: account registration and administration denied with legacy flag enabled.');
}finally{await mf.dispose();await fs.rm(tmp,{recursive:true,force:true});}
