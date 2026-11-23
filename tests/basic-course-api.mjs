import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import {unzipSync,strFromU8} from 'fflate';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
const {Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[require.resolve('wrangler')]})).href);
const {outputFiles}=await build({stdin:{contents:`import {approved} from './lib/basic-course/model';import worker from './lib/basic-course/offline.json';import {handleBasic} from './lib/basic-course/service';globalThis.fetch=async(url)=>new Response(String(url).endsWith('/sw.js')?worker:'window.INS_CURSO = '+JSON.stringify(approved)+';');import {runAdministration} from './db/administration';export default {fetch(r){return r.headers.get('X-Test-Management')==='yes'?runAdministration(()=>handleBasic(r)):handleBasic(r);}}`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',mainFields:['module','main'],external:['cloudflare:workers','node:async_hooks'],tsconfig:'tsconfig.json'});
const mf=new Miniflare({modules:[{type:'ESModule',path:path.resolve('.sites-runtime/basic-course-worker.mjs'),contents:outputFiles[0].text}],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],cf:false});let checks=0;
async function call(data,status=200,auth=true){const r=await mf.dispatchFetch('https://unit.invalid/basic',{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(auth?{'X-Test-Management':'yes'}:{})},...(data?{body:JSON.stringify(data)}:{})});assert.equal(r.status,status,(await r.clone().text()).slice(0,250));checks++;return r;}
try{
 await call(null,403,false);let current=await(await call()).json(),original=structuredClone(current.course);
 await call({action:'export',revision:0},409);
 current=await(await call({action:'save',revision:0,course:original})).json();assert.deepEqual(current.course,original);checks++;
 await call({action:'save',revision:0,course:original},409);
 let bad=structuredClone(original);bad.modules[0].id=99;await call({action:'save',revision:1,course:bad},400);
 bad=structuredClone(original);bad.modules[0].questions[0].correct=['X'];await call({action:'save',revision:1,course:bad},400);
 bad=structuredClone(original);bad.modules[0].sections[0].html+='<script>alert(1)</script>';await call({action:'save',revision:1,course:bad},400);
 bad=structuredClone(original);bad.modules[0].sections[0].html=bad.modules[0].sections[0].html.replaceAll('image1.png','other.png');await call({action:'save',revision:1,course:bad},400);
 const changed=structuredClone(original);changed.modules[0].title+=' actualizado';current=await(await call({action:'save',revision:1,course:changed})).json();
 current=await(await call({action:'submit',revision:current.revision})).json();await call({action:'save',revision:current.revision,course:changed},400);
 current=await(await call({action:'return',revision:current.revision})).json();current=await(await call({action:'submit',revision:current.revision})).json();current=await(await call({action:'approve',revision:current.revision})).json();
 const zip=unzipSync(new Uint8Array(await(await call({action:'export',revision:current.revision})).arrayBuffer()));assert.deepEqual(Object.keys(zip).sort(),['formacao-dados.js','sw.js']);checks++;
 const source=strFromU8(zip['formacao-dados.js']),data=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1));assert.deepEqual(data,changed);checks++;
 const sw=strFromU8(zip['sw.js']),manifest=JSON.parse(sw.match(/OFFLINE_FILES_START \*\/ ([\s\S]*?) \/\* OFFLINE_FILES_END/)[1]),entry=manifest.find(x=>x.path==='formacao-dados.js');assert.equal(entry.bytes,zip['formacao-dados.js'].length);assert.equal(entry.sha256,require('node:crypto').createHash('sha256').update(zip['formacao-dados.js']).digest('hex'));checks+=2;
 const db=await mf.getD1Database('DB');assert.equal((await db.prepare('SELECT count(*) n FROM basic_course_history').first()).n,current.revision-1);checks++;
 await fs.writeFile('tests/basic-course-result.json',JSON.stringify({passed:checks,publication:'ZIP de dois ficheiros; nenhum conteúdo público alterado nos ensaios'},null,2));console.log(checks+' verificações do editor do Curso Básico passaram.');
}finally{await mf.dispose();}


