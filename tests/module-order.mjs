import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[require.resolve('wrangler')]})).href);
const {outputFiles}=await build({stdin:{contents:`import {POST} from './app/api/workspace/route';import {runValidation} from './db/validation';export default {fetch(r){return new URL(r.url).pathname.startsWith('/validation')?runValidation(()=>POST(r),true):POST(r)}}`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',mainFields:['module','main'],external:['cloudflare:workers','node:async_hooks'],tsconfig:'tsconfig.json'});
const mf=new Miniflare({modules:[{type:'ESModule',path:path.resolve('.sites-runtime/module-order-worker.mjs'),contents:outputFiles[0].text}],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],cf:false});
const admin={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'perciliamuianga@gmail.com'};let checks=0;
async function post(courseId,modules,status=200,headers=admin,prefix=''){const r=await mf.dispatchFetch('http://academy.test'+prefix+'/api/workspace',{method:'POST',headers:{...headers,Origin:'http://academy.test','Content-Type':'application/json'},body:JSON.stringify({action:'module_order',courseId,modules})});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));checks++;return d;}
try{
 const db=await mf.getD1Database('DB');for(const name of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of(await fs.readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 const time='2026-11-18T00:00:00Z';
 async function seed(prefix=''){
 for(const [id,status]of[['a','rascunho'],['b','rascunho'],['published','publicado']])await db.prepare(`INSERT INTO ${prefix}courses(id,title,summary,category,status,hours,pass,version,updated) VALUES(?,?,'','',?,1,80,1,?)`).bind(id,id,status,time).run();
 for(const [id,course,title,position]of[['m1','a','Primeiro',0],['m2','a','Segundo',1],['foreign','b','Outro',0],['pm','published','Publicado',0]])await db.prepare(`INSERT INTO ${prefix}academy_entries(id,kind,title,status,payload,revision,created,updated) VALUES(?,'modulo',?,'publicado',?,1,?,?)`).bind(id,title,JSON.stringify({courseId:course,position,objectives:'Preservar',prerequisiteModules:[]}),time,time).run();
 for(const [id,module,position]of[['l1','Primeiro',0],['l2','Primeiro',1],['l3','Segundo',2],['loose','Sem módulo',3]])await db.prepare(`INSERT INTO ${prefix}lessons(id,courseId,module,title,body,position) VALUES(?,'a',?,?,?,?)`).bind(id,module,id,'Conteúdo preservado '+id,position).run();
 }
 await seed();
 await post('a',[{id:'m2',revision:1},{id:'m1',revision:1}],403,{});
 await post('published',[{id:'pm',revision:1}],400);
 await post('a',[{id:'m2',revision:1},{id:'m2',revision:1}],400);
 await post('a',[{id:'m1',revision:1},{id:'foreign',revision:1}],409);
 const before=await db.prepare('SELECT id,title,body FROM lessons ORDER BY id').all();
 await post('a',[{id:'m2',revision:1},{id:'m1',revision:1}]);
 assert.deepEqual((await db.prepare("SELECT id FROM lessons WHERE courseId='a' ORDER BY position").all()).results.map(x=>x.id),['l3','l1','l2','loose']);
 assert.deepEqual((await db.prepare('SELECT id,title,body FROM lessons ORDER BY id').all()).results,before.results);
 assert.equal((await db.prepare("SELECT revision FROM academy_entries WHERE id='foreign'").first()).revision,1);
 const snapshot=await db.prepare("SELECT * FROM academy_entry_history WHERE entryId='m1'").first();assert.equal(JSON.parse(snapshot.payload).body.position,0);assert.equal(JSON.parse(snapshot.payload).body.objectives,'Preservar');
 const audits=await db.prepare("SELECT * FROM audit WHERE action='Ordenar módulos'").all();assert.equal(audits.results.length,1);
 const state=await db.prepare('SELECT * FROM academy_entries ORDER BY id').all();
 await post('a',[{id:'m1',revision:1},{id:'m2',revision:1}],409);assert.deepEqual((await db.prepare('SELECT * FROM academy_entries ORDER BY id').all()).results,state.results);
 await post('a',[{id:'m1',revision:2}],409);
 await post('a',[{id:'m1',revision:2},{id:'m2',revision:2}]);
 await seed('validation_');await post('a',[{id:'m2',revision:1},{id:'m1',revision:1}],200,admin,'/validation');
 assert.equal(JSON.parse((await db.prepare("SELECT payload FROM academy_entries WHERE id='m1'").first()).payload).position,0);
 assert.equal(JSON.parse((await db.prepare("SELECT payload FROM validation_academy_entries WHERE id='m1'").first()).payload).position,1);
 console.log(`Module ordering: ${checks} API checks; atomic revisions, original content and lesson IDs, history, permissions, published courses and validation isolation passed.`);
}finally{await mf.dispose();}
