// Isolated D1: no requests or personal records in production.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const require=createRequire(import.meta.url),tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ins-team-'));
const {Miniflare}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const {build}=await import(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
const outfile=path.join(tmp,'worker.mjs');
const modules={team:'team-access',admin:'administration/academy',val:'validation/academy',reg:'validation/registration',settings:'administration/registration/settings',privateSettings:'validation/registration/settings',publicReg:'registration'};
await build({stdin:{contents:Object.entries(modules).map(([name,url])=>`import * as ${name} from './app/api/${url}/route';`).join('\n')+`const paths={${Object.keys(modules).join(',')}};export default {fetch(r){const m=paths[new URL(r.url).pathname.slice(1)];return m[r.method](r);}}`,resolveDir:process.cwd(),loader:'ts'},outfile,bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers','node:async_hooks'],tsconfig:'tsconfig.json'});
const key='1'.repeat(64),expired='2'.repeat(64),hash=s=>createHash('sha256').update(s).digest('hex');
const mf=new Miniflare({modules:true,script:await fs.readFile(outfile,'utf8'),compatibilityDate:'2026-05-01',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{INS_TEAM_ACCESS:JSON.stringify([{id:'local1',label:'Equipa local',hash:hash(key),expires:Date.now()+600000},{id:'expired',label:'Expirado',hash:hash(expired),expires:Date.now()-1}])}});
let checks=0;
async function call(route,status,{method='GET',body,team=key,participant=false,origin='https://insmisau.github.io',bearer='a'.repeat(64)}={}){
 const headers={Origin:origin,Authorization:'Bearer '+bearer,'Content-Type':'application/json'};if(team)headers['X-Academy-Team']=team;if(participant)headers['X-Academy-Mode']='participant';
 const res=await mf.dispatchFetch('http://ins.test/'+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),data=await res.json();assert.equal(res.status,status,JSON.stringify(data));checks++;return data;
}
try{
 const db=await mf.getD1Database('DB');
 for(const f of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await fs.readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 await db.prepare("INSERT INTO courses(id,title,summary,category,status,hours,pass,version,external,updated) VALUES('ficha-teste','Curso existente','','','publicado',1,80,1,NULL,'2026-11-16')").run();
 for(const route of ['team','admin','val','reg','privateSettings'])await call(route,401,{team:''});
 await call('team',401,{team:expired});await call('team',401,{team:'3'.repeat(64)});await call('team',403,{origin:'https://untrusted.invalid'});
 await call('team',200);await call('team',200,{method:'POST'});await call('team',200,{method:'POST'});
 assert.equal((await db.prepare('SELECT count(*) n FROM validation_courses WHERE id="ficha-teste"').first()).n,1);
 assert.equal((await call('admin',200)).isAdmin,true);
 assert.equal((await call('val',200)).isAdmin,true);
 assert.equal((await call('val',200,{participant:true})).isAdmin,false);
 await call('val',403,{method:'POST',participant:true,body:{action:'seed'}});
 await call('privateSettings',403,{participant:true});
 const status=await call('reg',200,{participant:true});assert(status.open);assert.deepEqual(status.providers,[]);
 const answers={nome:'Nome fictício',email:'ensaio@example.invalid',certificado:'Grafia de ensaio',telefone:'+258 841234567',situacao:'Sem vínculo institucional',provincia:'Maputo Cidade',distrito:'KaMpfumu',categoria:'Outro',categoriaOutro:'Perfil do ensaio',nivel:'Licenciatura',experiencia:'Sem experiência',dispositivos:['Computador'],internet:'Limitado / Dados móveis',cursoAnterior:'Não'};
 const payload={courseId:'ficha-teste',answers,notice:status.notice,confirmName:true,confirmData:true};
 await call('reg',201,{method:'POST',participant:true,body:payload});
 await call('reg',200,{method:'POST',participant:true,body:payload});
 assert.equal((await db.prepare('SELECT count(*) n FROM academy_registration_forms').first()).n,0);
 assert.equal((await db.prepare('SELECT count(*) n FROM enrollments').first()).n,0);
 assert.equal((await db.prepare('SELECT count(*) n FROM validation_enrollments').first()).n,1);
 assert.equal((await call('val',200,{participant:true})).enrollments.length,1);
 assert.equal((await call('val',200,{participant:true,bearer:'b'.repeat(64)})).enrollments.length,0);
 assert.equal((await call('publicReg',200,{team:''})).open,false);
 const privacy={purpose:'Fictício',controller:'Fictício',access:'Fictício',retention:'Fictício',corrections:'Fictício'};
 await call('settings',401,{team:'',method:'POST',body:{enabled:true,notice:'',privacy}});
 await call('settings',422,{method:'POST',body:{enabled:true,notice:'',privacy:{...privacy,retention:''}}});
 await call('settings',200,{method:'POST',body:{enabled:true,notice:'',privacy}});
 assert.equal((await call('publicReg',200,{team:''})).open,true);
 const preflight=await mf.dispatchFetch('http://ins.test/val',{method:'OPTIONS',headers:{Origin:'https://insmisau.github.io','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization,x-academy-team,x-academy-mode'}});assert.equal(preflight.status,204);
 console.log(`OK: ${checks} respostas verificadas; acessos privados, expiração, privilégios, ficha real e isolamento dos ensaios.`);
}finally{await mf.dispose();await fs.rm(tmp,{recursive:true,force:true});}
