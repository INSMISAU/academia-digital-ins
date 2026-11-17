import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {scryptSync,createHash} from 'node:crypto';
const require=createRequire(import.meta.url),tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ins-admin-login-'));
const {Miniflare}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const {build}=await import(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
const modules={login:'administration-session',check:'team-access',admin:'administration/academy',work:'administration/workspace',access:'administration/access',public:'academy'};
const {outputFiles}=await build({stdin:{contents:Object.entries(modules).map(([n,p])=>`import * as ${n}Route from './app/api/${p}/route';`).join('\n')+`const routes={${Object.keys(modules).map(n=>n+':'+n+'Route').join(',')}};export default {fetch(r){return routes[new URL(r.url).pathname.slice(1)][r.method](r);}}`,resolveDir:process.cwd(),loader:'ts'},write:false,bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers','node:async_hooks','node:crypto'],tsconfig:'tsconfig.json'});
const password='Palavra-passe fictícia de ensaio 123',salt='1'.repeat(32),passwordHash='scrypt:16384:8:5:'+salt+':'+scryptSync(password,salt,32,{N:16384,r:8,p:5,maxmem:32*1024*1024}).toString('hex');
const mf=new Miniflare({modules:true,script:outputFiles[0].text,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{INS_ADMIN_CREDENTIALS:JSON.stringify([{id:'first',email:'first@example.invalid',name:'Primeiro ensaio',passwordHash},{id:'second',email:'second@example.invalid',name:'Segundo ensaio',passwordHash}])}});
let checks=0;
async function call(route,status,{body,token='',origin='https://insmisau.github.io',bearer='a'.repeat(64)}={}){
 const response=await mf.dispatchFetch('https://academy.test/'+route,{method:body?'POST':'GET',headers:{Origin:origin,Authorization:'Bearer '+bearer,'X-Academy-Team':token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json();assert.equal(response.status,status,JSON.stringify({route,result}));checks++;return result;
}
try{
 const db=await mf.getD1Database('DB');
 for(const f of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await fs.readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 await call('admin',401);await call('check',401);
 await call('login',401,{body:{email:'unknown@example.invalid',password}});
 await call('login',401,{body:{email:'first@example.invalid',password:'incorrecta'}});
 await call('login',403,{origin:'https://outside.invalid',body:{email:'first@example.invalid',password}});
 const first=await call('login',200,{body:{email:' FIRST@example.invalid ',password}}),second=await call('login',200,{body:{email:'second@example.invalid',password}});
 assert.match(first.session,/^a0ce5510ade0[a-f0-9]{52}$/);assert.notEqual(first.session,second.session);assert(first.expires>Date.now());
 for(const token of [first.session,second.session]){
  await call('check',200,{token});const data=await call('admin',200,{token});assert.equal(data.isAdmin,true);assert.equal(data.allowedViews,undefined);assert.equal(data.roleManagement,undefined);
  assert(Array.isArray((await call('work',200,{token})).entries));assert.equal((await call('access',200,{token})).global,true);
 }
 assert.equal((await db.prepare('SELECT count(*) n FROM academy_roles').first()).n,0);assert.equal((await db.prepare('SELECT count(*) n FROM academy_mfa').first()).n,0);
 const stored=await db.prepare('SELECT token FROM registration_sessions').all();assert(stored.results.every(row=>row.token!==first.session&&row.token!==second.session));
 assert.equal((await call('public',200,{bearer:first.session})).isAdmin,false);
 const created=await call('admin',200,{token:first.session,body:{action:'course',title:'Ensaio isolado',summary:'Fictício',category:'Ensaio',hours:1,pass:80}});assert(created.id);
 const forged='a0ce5510ade0'+'e'.repeat(52),hash=s=>createHash('sha256').update(s).digest('hex');
 await db.prepare('INSERT INTO registration_sessions(token,account,name,email,trusted,expires) VALUES(?,?,?,?,1,?)').bind(hash(forged),'account:participant','Participante','first@example.invalid',Date.now()+3600000).run();
 await call('admin',401,{token:forged});
 await call('login',200,{token:first.session,body:{action:'logout'}});await call('admin',401,{token:first.session});await call('admin',200,{token:second.session});
 await db.prepare('UPDATE registration_sessions SET expires=1 WHERE token=?').bind(hash(second.session)).run();await call('admin',401,{token:second.session});
 for(let i=0;i<10;i++)await call('login',401,{body:{email:'brute@example.invalid',password:'incorrecta'}});
 await call('login',429,{body:{email:'brute@example.invalid',password:'incorrecta'}});
 console.log(`Administration email/password: ${checks} responses passed; two independent accounts, full existing management without roles/MFA, hashing, denial, expiry, logout, origin checks and rate limits.`);
}finally{await mf.dispose();await fs.rm(tmp,{recursive:true,force:true});}
