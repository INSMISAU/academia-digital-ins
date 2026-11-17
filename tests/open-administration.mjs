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
 const info=await call('account',200);assert.equal(info.registrationOpen,true);assert.equal(info.notice,'');
 const people=[{email:'person.one@example.org',password:'A minha primeira frase de ensaio 123'},{email:'person.two@another.example',password:'Uma outra frase pessoal de ensaio 456'}];
 await call('login',401,{body:{email:'invalid',password:people[0].password}});
 await call('login',422,{body:{email:'short@example.org',password:'curta'}});
 const sessions=[];
 for(const person of people){
  const result=await call('login',200,{body:person});assert.equal(result.administration,true);sessions.push(result.session);
  const saved=await db.prepare('SELECT * FROM academy_accounts WHERE email=?').bind(person.email).first();assert(saved);assert.notEqual(saved.password,person.password);assert.equal(saved.name,person.email);
  await call('login',401,{body:{email:person.email,password:'A palavra-passe de outra pessoa 999'}});
  assert.equal((await db.prepare('SELECT password FROM academy_accounts WHERE email=?').bind(person.email).first()).password,saved.password);
  const returning=await call('login',200,{body:person});assert.notEqual(returning.session,result.session);
  for(const token of [result.session,returning.session]){
   const admin=await call('admin',200,{token});assert.equal(admin.isAdmin,true);assert.equal(admin.allowedViews,undefined);assert.equal(admin.roleManagement,undefined);
   assert(Array.isArray((await call('work',200,{token})).entries));assert.equal((await call('access',200,{token})).global,true);
  }
  const normal=await call('account',200,{body:{action:'login',...person}});assert.equal(normal.administration,true);
 }
 assert.notEqual(sessions[0],sessions[1]);
 const registered=await call('account',201,{body:{action:'register',name:'Pessoa de ensaio',email:'new.person@example.net',password:'A terceira frase própria de ensaio 789',notice:info.notice}});
 assert.equal(registered.administration,true);assert.equal(registered.profile.name,'Pessoa de ensaio');
 await call('admin',200,{token:registered.session});
 const created=await call('admin',200,{token:sessions[0],body:{action:'course',title:'Curso de ensaio',summary:'Fictício',category:'Ensaio',hours:1,pass:80}});assert(created.id);
 await call('admin',200,{token:sessions[1],body:{action:'lesson',courseId:created.id,module:'Módulo de ensaio',title:'Aula de ensaio',body:'Conteúdo fictício'}});
 for(const table of ['academy_roles','academy_mfa','academy_registration_settings'])assert.equal((await db.prepare('SELECT count(*) n FROM '+table).first()).n,0);
 await call('account',200,{body:{action:'logout'},bearer:registered.session});await call('admin',401,{token:registered.session});await call('admin',200,{token:sessions[1]});
 // The later institutional configuration can remove automatic access without deleting accounts.
 await mf.setOptions({...options,bindings:{INS_OPEN_ADMIN_REGISTRATION:'0'}});
 assert.equal((await call('account',200)).registrationOpen,false);await call('admin',401,{token:sessions[0]});
 const ordinary=await call('account',200,{body:{action:'login',...people[0]}});assert.equal(ordinary.administration,false);
 await call('login',401,{body:{email:'later@example.org',password:people[0].password}});
 await mf.setOptions(options);await call('admin',200,{token:sessions[0]});
 db=await mf.getD1Database('DB');assert.equal((await db.prepare('SELECT count(*) n FROM academy_accounts').first()).n,3);
 console.log(`Open administration: ${checks} responses passed; arbitrary email domains, separate passwords, first-entry registration, normal account creation, full management, return, logout and reversible phase setting.`);
}finally{await mf.dispose();await fs.rm(tmp,{recursive:true,force:true});}
