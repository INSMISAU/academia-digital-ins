// Local D1 and local provider/email doubles only. No external requests, mail or real accounts.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {webcrypto as crypto} from 'node:crypto';
const require=createRequire(import.meta.url), {build}=require('esbuild');
const {Miniflare,Response:MR}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ins-oidc-'));
const options={stdin:{contents:`import {env} from 'cloudflare:workers';import {POST as reg,GET as status} from './app/api/registration/route';import {POST as action} from './app/api/registration/identity/route';import {GET as begin} from './app/api/registration/identity/begin/route';import {GET as callback} from './app/api/registration/identity/callback/route';export default {async fetch(r){const p=new URL(r.url).pathname;return (p.endsWith('/begin')?begin:p.endsWith('/callback')?callback:p.endsWith('/identity')?action:r.method==='GET'?status:reg)(r)}}`,resolveDir:process.cwd(),loader:'ts'},write:false,bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers','node:async_hooks'],tsconfig:'tsconfig.json'};
const {outputFiles}=await build(options);
const origin='https://insmisau.github.io',base='https://unit.invalid/api/registration',owner='a'.repeat(64),tenant='12345678-a123-4000-8888-123456789abc';
const key=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',key.publicKey);const enc=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
const cases=new Map();let mail='';
const cfEmail={name:'mail-local',modules:true,compatibilityDate:'2026-05-01',script:`import {WorkerEntrypoint} from 'cloudflare:workers'; export default class Mail extends WorkerEntrypoint{async send(m){await this.env.CAPTURE.fetch('https://capture.invalid',{method:'POST',body:JSON.stringify(m)});return {messageId:'local'};}}`,serviceBindings:{CAPTURE:async r=>{mail=(await r.json()).text;return new MR('ok');}}};
const bindings={INS_EMAIL_FROM:'academia@example.invalid'};for(const p of ['GOOGLE','APPLE','MICROSOFT']){bindings['INS_'+p+'_CLIENT_ID']=p;bindings['INS_'+p+'_CLIENT_SECRET']='local';}
const mf=new Miniflare({workers:[{name:'ficha',compatibilityDate:'2026-05-01',compatibilityFlags:['nodejs_compat'],modules:true,script:outputFiles[0].text,d1Databases:['DB'],bindings,serviceBindings:{INS_EMAIL:'mail-local'},outboundService:async r=>{
 const u=new URL(r.url);
 if(r.method==='GET')return MR.json({keys:[{...jwk,kid:'test',alg:'RS256',issuer:'https://login.microsoftonline.com/{tenantid}/v2.0'}]});
 const f=new URLSearchParams(await r.text()),c=cases.get(f.get('code'));assert(c);assert.equal(f.get('redirect_uri'),base+'/identity/callback');
 if(c.provider!=='apple')assert.equal(Buffer.from(await crypto.subtle.digest('SHA-256',Buffer.from(f.get('code_verifier')))).toString('base64url'),c.challenge);
 const now=Math.floor(Date.now()/1000),claims={aud:c.provider.toUpperCase(),iss:c.iss,sub:c.provider+'-person',iat:now,exp:now+300,nonce:c.nonce,tid:tenant,email:'formando@example.invalid',email_verified:true,...(c.provider==='apple'?{}:{name:'Nome da conta'})};
 const signed=enc({alg:'RS256',kid:'test'})+'.'+enc(claims);
 const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key.privateKey,Buffer.from(signed));
 return MR.json({access_token:'unused',token_type:'Bearer',id_token:signed+'.'+Buffer.from(sig).toString('base64url')});
}},cfEmail]});
const api=(body,token=owner,endpoint='/identity')=>mf.dispatchFetch(base+endpoint,{method:'POST',redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
let n=0;async function read(response,status){const r=await response,d=await r.json();assert.equal(r.status,status,JSON.stringify(d));n++;return d;}
try{
 const db=await mf.getD1Database('DB');for(const name of (await fs.readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())for(const sql of (await fs.readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 await read(api({action:'start',provider:'google'}),200); // Login is independent of open course enrolment.
 await db.prepare("INSERT INTO courses(id,title,summary,category,status,hours,pass,version,updated) VALUES('curso','Curso','','','publicado',1,80,1,'hoje')").run();
 await db.prepare("INSERT INTO academy_registration_settings(id,enabled,notice) VALUES (1,1,'aviso local')").run();
 const privacy=JSON.stringify({purpose:'Ensaio local',controller:'Fictício',access:'Isolado',retention:'Temporário',corrections:'local@example.invalid'});
 assert.equal((await (await mf.dispatchFetch(base)).json()).open,false);
 await db.prepare('UPDATE academy_registration_settings SET privacy=? WHERE id=1').bind(privacy).run();
 const liveNotice=(await (await mf.dispatchFetch(base)).json()).notice;
 async function login(provider){
  const {url,ticket}=await read(api({action:'start',provider}),200);
  const init=await mf.dispatchFetch(url,{redirect:'manual'});assert.equal(init.status,303);
  const dest=new URL(init.headers.get('Location')),q=dest.searchParams, cookie=init.headers.get('set-cookie').split(';')[0],code=crypto.randomUUID();
  const iss=provider==='microsoft'?'https://login.microsoftonline.com/'+tenant+'/v2.0':provider==='google'?'https://accounts.google.com':'https://appleid.apple.com';
  cases.set(code,{provider,iss,nonce:q.get('nonce'),challenge:q.get('code_challenge')});
  const params=new URLSearchParams({state:q.get('state'),code});if(provider==='apple')params.set('user',JSON.stringify({name:{firstName:'Nome',lastName:'Apple'}}));
  const cb=base+'/identity/callback',posted=provider==='apple';
  const opts={method:posted?'POST':'GET',redirect:'manual',headers:{Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},...(posted?{body:params.toString()}:{})};
  const out=await mf.dispatchFetch(posted?cb:cb+'?'+params,opts);assert.equal(out.status,303);
  const result=new URL(out.headers.get('location')).hash.split('=')[1];assert.match(result,/^[a-f0-9]{64}$/);
  const acc=await read(api({action:'finish',ticket,result}),200);
  assert.equal(acc.email,'formando@example.invalid');assert.equal(acc.name,posted?'Nome Apple':'Nome da conta');assert(acc.verified);assert.match(acc.session,/^a0ce5510ade0[a-f0-9]{52}$/);
  await read(api({action:'finish',ticket,result}),400);return acc.session;
 }
 const tk=await login('google');await login('apple');await login('microsoft');
 const profile=await read(api({action:'profile'},tk),200);assert.equal(profile.email,'formando@example.invalid');
 const email='contacto@example.invalid',answers={nome:'Nome da conta',email,certificado:'Nome do certificado',telefone:'841234567',situacao:'Sem vínculo institucional',provincia:'Maputo Cidade',distrito:'KaMpfumu',categoria:'Estudante',nivel:'Licenciatura',experiencia:'Sem experiência',dispositivos:['Tablet'],internet:'Regular e estável',cursoAnterior:'Não'};
 const registration={courseId:'curso',notice:liveNotice,confirmName:true,confirmData:true,answers};
 await read(api(registration,tk,''),422);
 await read(api({action:'send',email},tk),200);const code=mail.match(/\d{8}/)?.[0];assert(code);
 await read(api({action:'verify',email,code},owner),400);await read(api({action:'verify',email,code:code==='00000000'?'00000001':'00000000'},tk),422);
 await read(api({action:'verify',email,code},tk),200);
 const receipt=await read(api(registration,tk,''),201);const saved=await db.prepare('SELECT verifiedContact,certificateName FROM academy_registration_forms WHERE reference=?').bind(receipt.reference).first();assert.equal(saved.verifiedContact,email);assert.equal(saved.certificateName,answers.certificado);
 await read(api({action:'leave'},tk),200);await read(api({action:'profile'},tk),401);
 console.log('OK: Google, Apple e Microsoft simulados; nome, email, confirmação do novo endereço e fim de sessão. '+n+' respostas verificadas.');
}finally{await mf.dispose();await fs.rm(tmp,{recursive:true,force:true});}
