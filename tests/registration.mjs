// Run from repository root: node tests/registration.mjs — isolated D1, no network requests to production.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const require=createRequire(import.meta.url), tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ins-reg-'));
const {Miniflare}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const {build}=await import(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
const outfile=path.join(tmp,'worker.mjs');
await build({stdin:{contents:"import {registrationCertificateName} from './lib/registration-service'; import {db} from './db/store'; import {visitorKey,visitorToken} from './db/access'; import {GET,POST,OPTIONS} from './app/api/registration/route'; export default {async fetch(r){const u=new URL(r.url);if(u.pathname==='/test-certificate-name')return Response.json(await registrationCertificateName(db(),u.searchParams.get('id'),await visitorKey(visitorToken(r)))??null);return ({GET,POST,OPTIONS})[r.method](r)}}",resolveDir:process.cwd(),loader:'ts'},outfile,bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers','node:async_hooks'],tsconfig:'tsconfig.json'});
const mf=new Miniflare({modules:true,script:await fs.readFile(outfile,'utf8'),compatibilityDate:'2026-05-01',compatibilityFlags:['nodejs_compat'],d1Databases:['DB']});
const base='http://ins.test/api/registration',pages='https://insmisau.github.io',token='a'.repeat(64);
const notice='Aviso isolado do ensaio com dados fictícios.';
const a={nome:'Nome fictício',email:'ensaio@example.invalid',certificado:'Inês de Ensaio',telefone:'+258 841234567',situacao:'Sem vínculo institucional',provincia:'Maputo Cidade',distrito:'KaMpfumu',categoria:'Outro',categoriaOutro:'Perfil do ensaio',nivel:'Licenciatura',experiencia:'Sem experiência',dispositivos:['Computador','Telemóvel / Smartphone'],internet:'Limitado / Dados móveis',cursoAnterior:'Não'};
const sample={courseId:'surtos',answers:a,notice,confirmName:true,confirmData:true};
let checks=0;
async function post(body,status,tk=token,origin=pages){const response=await mf.dispatchFetch(base,{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+tk,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await response.json();assert.equal(response.status,status,JSON.stringify(d));checks++;return d;}
try{
 const db=await mf.getD1Database('DB');
 for(const name of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await fs.readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 await db.batch(['surtos','interno','rascunho'].map((id,i)=>db.prepare("INSERT OR IGNORE INTO courses(id,title,summary,category,status,hours,pass,version,external,updated) VALUES(?,?,'','',''||?,1,80,1,?,?)").bind(id,id,i===2?'rascunho':'publicado',i===0?'https://example.invalid/curso':null,'2026-11-08')));
 await post(sample,403);
 await db.prepare("INSERT INTO academy_registration_settings(id,enabled,notice) VALUES (1,1,?)").bind(notice).run();
 await post(sample,403,token,'https://example.invalid');
 await post({...sample,notice:'versão anterior'},400);await post({...sample,confirmName:false},400);await post({...sample,confirmData:false},400);
 await post({...sample,courseId:'rascunho'},404);
 for(const bad of [{distrito:'Boane'},{certificado:''},{telefone:'letras'},{email:'inválido'},{categoriaOutro:''},{situacao:'Profissional em actividade'},{dispositivos:['Computador','Tablet','Telemóvel / Smartphone']},{dispositivos:['Sem acesso a dispositivo','Tablet']}])await post({...sample,answers:{...a,...bad}},422);
 assert.equal((await db.prepare('SELECT count(*) n FROM academy_registration_forms').first()).n,0);
 const receipt=await post({...sample,answers:{...a,instituicao:'Campo a dispensar'}},201);assert.match(receipt.reference,/^INS-[A-F0-9-]+$/);
 const retry=await post(sample,200);assert.equal(retry.reference,receipt.reference);
 const record=await db.prepare('SELECT * FROM academy_registration_forms WHERE reference=?').bind(receipt.reference).first();
 assert.equal(record.certificateName,a.certificado);assert.equal(JSON.parse(record.payload).nome,a.nome);assert(!('instituicao' in JSON.parse(record.payload)));assert.equal(record.notice,notice);
 const conflict=await post(sample,409,'b'.repeat(64));assert(!conflict.reference);await post({...sample,answers:{...a,telefone:'841234569'}},409);
 assert.equal((await db.prepare('SELECT count(*) n FROM enrollments WHERE courseId=?').bind('surtos').first()).n,0);
 const internal={...sample,courseId:'interno',answers:{...a,situacao:'Profissional em actividade',sector:'Público',tipo:'Hospital central'}};
 const pair=await Promise.all([mf.dispatchFetch(base,{method:'POST',headers:{Origin:pages,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(internal)}),mf.dispatchFetch(base,{method:'POST',headers:{Origin:pages,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(internal)})]);
 assert.deepEqual(pair.map(r=>r.status).sort(),[200,201]);const receipts=await Promise.all(pair.map(r=>r.json()));assert.equal(receipts[0].reference,receipts[1].reference);
 const es=await db.prepare('SELECT * FROM enrollments WHERE courseId=?').bind('interno').all();assert.equal(es.results.length,1);assert(!JSON.stringify(es.results).includes(a.nome));assert(!JSON.stringify(es.results).includes(a.email));
 const nameUrl='http://ins.test/test-certificate-name?id='+es.results[0].id;
 assert.equal(await (await mf.dispatchFetch(nameUrl,{headers:{Authorization:'Bearer '+token}})).json(),a.certificado);
 assert.equal(await (await mf.dispatchFetch(nameUrl,{headers:{Authorization:'Bearer '+'b'.repeat(64)}})).json(),null);
 const status=await mf.dispatchFetch(base,{headers:{Origin:pages,Authorization:'Bearer '+token}});assert.deepEqual(await status.json(),{open:true,notice});
 // A database error in the second insert must roll back the personal form and never issue a reference.
 await db.prepare("CREATE TRIGGER deny_enroll BEFORE INSERT ON enrollments BEGIN SELECT RAISE(ABORT,'isolated failure'); END").run();
 await post({...internal,answers:{...internal.answers,email:'falha@example.invalid'}},503,'c'.repeat(64));
 assert.equal((await db.prepare('SELECT count(*) n FROM academy_registration_forms').first()).n,2);
 console.log('OK: '+checks+' respostas HTTP verificadas; requisitos, transacção, confirmação, repetição e isolamento validados em D1 temporária.');
}finally{await mf.dispose();await fs.rm(tmp,{recursive:true,force:true});}
