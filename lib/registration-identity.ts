import {env} from 'cloudflare:workers';
import * as oidc from 'oauth4webapi';
import {db} from '@/db/store';
import {visitorToken,newVisitorToken} from '@/db/access';
import {registrationStatus} from './registration-service';
import {pagesOrigin,permittedOrigin} from './academy-cors';

import {externalToken,externalPrefix,digest} from './registration-session';
const settings=()=>env as unknown as Record<string,any>;
const providers={
 google:{label:'Google',issuer:'https://accounts.google.com',authorize:'https://accounts.google.com/o/oauth2/v2/auth',token:'https://oauth2.googleapis.com/token',keys:'https://www.googleapis.com/oauth2/v3/certs',scope:'openid profile email'},
 apple:{label:'Apple / iCloud',issuer:'https://appleid.apple.com',authorize:'https://appleid.apple.com/auth/authorize',token:'https://appleid.apple.com/auth/token',keys:'https://appleid.apple.com/auth/keys',scope:'name email'},
 microsoft:{label:'Microsoft',issuer:'https://login.microsoftonline.com/common/v2.0',authorize:'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',token:'https://login.microsoftonline.com/common/oauth2/v2.0/token',keys:'https://login.microsoftonline.com/common/discovery/v2.0/keys',scope:'openid profile email'}
} as const;
type Provider=keyof typeof providers;
function provider(p:unknown):p is Provider{return typeof p==='string'&&Object.hasOwn(providers,p);}
function config(p:Provider){
 const e=settings(),pre='INS_'+p.toUpperCase()+'_';const client_id=e[pre+'CLIENT_ID'],secret=e[pre+'CLIENT_SECRET'];
 if(typeof client_id!=='string'||!client_id||typeof secret!=='string'||!secret)return null;
 return {client:{client_id,id_token_signed_response_alg:'RS256'},secret};
}
export const enabledProviders=()=>Object.keys(providers).filter(p=>provider(p)&&config(p));
export const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
function failure(){return json({error:'Não foi possível concluir o acesso. Volte à ficha e tente novamente.'},400);}
function root(req:Request){const u=new URL(req.url);return u.origin;}
function callback(req:Request){return root(req)+'/api/registration/identity/callback';}
const tag='__Host-ins-ficha-login';
const cookie=(v:string,age:number)=>tag+'='+v+'; Path=/; HttpOnly; Secure; SameSite=None; Max-Age='+age;
type Flow={state:string;ticket:string;origin:string;owner:string;provider:Provider;verifier:string;nonce:string;browser:string;phase:string;account:string;name:string;email:string;trusted:number;expires:number};
function back(req:Request,origin:string,result:string){const dest=origin===pagesOrigin?pagesOrigin+'/academia-digital-ins/':root(req)+'/';return new Response(null,{status:303,headers:{Location:dest+'#ins-ficha-retorno='+result,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','Set-Cookie':cookie('',0)}});}
async function cleanExpired(){const t=Date.now(),s=db();await s.batch(['registration_identity_flows','registration_sessions','registration_mail_checks'].map(table=>s.prepare('DELETE FROM '+table+' WHERE expires<=?').bind(t)).concat(s.prepare('DELETE FROM registration_mail_limits WHERE until<=?').bind(t)));}
const hex=/^[a-f0-9]{64}$/;
const norm=(s:string)=>s.trim().toLowerCase();
const isMail=(s:unknown):s is string=>typeof s==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export async function limitedText(req:Request,max=16384){const reader=req.body?.getReader();if(!reader)return '';const dec=new TextDecoder();let size=0,text='';for(;;){const r=await reader.read();if(r.done)break;if((size+=r.value.byteLength)>max){await reader.cancel();throw Error('request size');}text+=dec.decode(r.value,{stream:true});}return text+dec.decode();}
async function limit(bucket:string,n:number,ms:number){
 const now=Date.now();return !!await db().prepare('INSERT INTO registration_mail_limits(bucket,until,count) VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN until<=? THEN 1 ELSE count+1 END,until=CASE WHEN until<=? THEN excluded.until ELSE until END WHERE until<=? OR count<? RETURNING count').bind(bucket,now+ms,now,now,now,n).first();
}
export async function identityAction(req:Request){
 try{
 if(!permittedOrigin(req)||!req.headers.get('Content-Type')?.startsWith('application/json'))return failure();
 const input=JSON.parse(await limitedText(req));const token=visitorToken(req);if(!token)return failure();
 const s=db(),key=await digest(token);
 if(input.action==='leave'){if(externalToken(token))await s.prepare('DELETE FROM registration_sessions WHERE token=?').bind(key).run();return json({ok:true});}
 if(!(await registrationStatus(s)).open)return json({error:'As inscrições ainda não estão abertas.'},403);
 if(input.action==='start'){
  const p=input.provider;if(!provider(p)||!config(p))return failure();
  if(!await limit('oauth:'+await digest(req.headers.get('CF-Connecting-IP')||key),30,600000))return json({error:'Aguarde antes de tentar novamente.'},429);
  await cleanExpired();const state=newVisitorToken(),ticket=newVisitorToken(),nonce=oidc.generateRandomNonce(),verifier=oidc.generateRandomCodeVerifier();
  await s.prepare("INSERT INTO registration_identity_flows(state,ticket,owner,origin,provider,nonce,verifier,phase,expires) VALUES(?,?,?,?,?,?,?,'new',?)").bind(state,await digest(ticket),key,req.headers.get('Origin'),p,nonce,verifier,Date.now()+600000).run();
  return json({url:root(req)+'/api/registration/identity/begin?state='+state,ticket});
 }
 if(input.action==='finish'){
  if(!hex.test(input.ticket)||!hex.test(input.result))return failure();
  const row=await s.prepare("DELETE FROM registration_identity_flows WHERE ticket=? AND owner=? AND browser=? AND phase='done' AND expires>? RETURNING account,name,email,trusted").bind(await digest(input.ticket),key,await digest(input.result),Date.now()).first<Flow>();
  if(!row)return failure();
  const session=externalPrefix+newVisitorToken().slice(externalPrefix.length);
  await s.prepare('INSERT INTO registration_sessions(token,account,name,email,trusted,expires) VALUES(?,?,?,?,?,?)').bind(await digest(session),row.account,row.name,row.email,row.trusted,Date.now()+8*3600000).run();
  return json({session,name:row.name,email:row.email,verified:!!row.trusted});
 }
 if(input.action==='profile'){
  const row=await s.prepare('SELECT name,email,trusted FROM registration_sessions WHERE token=? AND expires>?').bind(key,Date.now()).first<{name:string;email:string;trusted:number}>();
  return row?json({name:row.name,email:row.email,verified:!!row.trusted}):json({error:'A sessão terminou.'},401);
 }
 const acct=await s.prepare('SELECT account FROM registration_sessions WHERE token=? AND expires>?').bind(key,Date.now()).first<{account:string}>();
 if(!acct||!isMail(input.email))return failure();
 const email=norm(input.email);
 if(input.action==='send'){
  const e=settings();if(!e.INS_EMAIL?.send||!isMail(e.INS_EMAIL_FROM))return json({error:'A verificação de email ainda não está disponível.'},503);
  if(!await limit('account:'+acct.account,1,60000)||!await limit('mail:'+await digest(email),5,3600000))return json({error:'Aguarde antes de pedir outro código.'},429);
  const bytes=crypto.getRandomValues(new Uint32Array(1));const code=String(bytes[0]%100000000).padStart(8,'0');
  const hash=await digest(acct.account+'|'+email+'|'+code);
  await s.prepare('INSERT OR REPLACE INTO registration_mail_checks(account,email,digest,tries,expires,confirmed) VALUES(?,?,?,0,?,0)').bind(acct.account,email,hash,Date.now()+600000).run();
  try{await e.INS_EMAIL.send({from:e.INS_EMAIL_FROM,to:email,subject:'Academia do INS — verificação de email',text:'Código para confirmar o seu endereço de email na ficha de inscrição: '+code});}
  catch{await s.prepare('DELETE FROM registration_mail_checks WHERE account=? AND digest=?').bind(acct.account,hash).run();return json({error:'Não foi possível enviar o código.'},503);}
  return json({ok:true});
 }
 if(input.action==='verify'&&typeof input.code==='string'&&/^\d{8}$/.test(input.code)){
  const hash=await digest(acct.account+'|'+email+'|'+input.code);
  const r=await s.prepare('UPDATE registration_mail_checks SET tries=tries+1,confirmed=(digest=?),expires=CASE WHEN digest=? THEN ? ELSE expires END WHERE account=? AND email=? AND expires>? AND tries<5 AND confirmed=0 RETURNING confirmed').bind(hash,hash,Date.now()+8*3600000,acct.account,email,Date.now()).first<{confirmed:number}>();
  return r?.confirmed?json({ok:true}):json({error:'Código inválido ou expirado.'},422);
 }
 return failure();
 }catch{return failure();}
}
export async function begin(req:Request){
 try{
  const s=db();if(!(await registrationStatus(s)).open)return failure();
  const state=new URL(req.url).searchParams.get('state');if(!state||!hex.test(state))return failure();
  const binder=newVisitorToken();
  const f=await s.prepare("UPDATE registration_identity_flows SET phase='sent',browser=? WHERE state=? AND phase='new' AND expires>? RETURNING *").bind(await digest(binder),state,Date.now()).first<Flow>();
  if(!f||!provider(f.provider))return failure();const c=config(f.provider);if(!c)return failure();
  const p=providers[f.provider],u=new URL(p.authorize);u.search=new URLSearchParams({client_id:c.client.client_id,response_type:'code',scope:p.scope,redirect_uri:callback(req),state,nonce:f.nonce}).toString();
  if(f.provider==='apple')u.searchParams.set('response_mode','form_post');else{u.searchParams.set('code_challenge',await oidc.calculatePKCECodeChallenge(f.verifier));u.searchParams.set('code_challenge_method','S256');u.searchParams.set('prompt','select_account');}
  return new Response(null,{status:303,headers:{Location:u.href,'Set-Cookie':cookie(binder,600),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch{return failure();}
}
export async function complete(req:Request){
 let origin='';
 try{
 const s=db();if(!(await registrationStatus(s)).open)return failure();
 const q=req.method==='POST'?new URLSearchParams(await limitedText(req)):new URL(req.url).searchParams;
 const state=q.get('state'),b=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(tag+'='))?.slice(tag.length+1);
 if(!state||!hex.test(state)||!b||!hex.test(b))return failure();
 const f=await s.prepare("UPDATE registration_identity_flows SET phase='exchange' WHERE state=? AND browser=? AND phase='sent' AND expires>? RETURNING *").bind(state,await digest(b),Date.now()).first<Flow>();
 if(!f||!provider(f.provider))return failure();origin=f.origin;
 const p=providers[f.provider],c=config(f.provider);if(!c)throw Error();
 const as:{issuer:string;token_endpoint:string;jwks_uri:string}={issuer:p.issuer,token_endpoint:p.token,jwks_uri:p.keys};
 const args=oidc.validateAuthResponse(as,c.client,q,f.state);
 const resp=await oidc.authorizationCodeGrantRequest(as,c.client,oidc.ClientSecretPost(c.secret),args,callback(req),f.provider==='apple'?oidc.nopkce:f.verifier);
 if(f.provider==='microsoft'){
  // Only select tenant-specific Microsoft metadata here. The untrusted hint never authenticates the user.
  const t=await resp.clone().json() as {id_token?:string};const part=t.id_token?.split('.')[1]||'';
  const hint=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/'))).tid;
  if(typeof hint!=='string'||!/^\w{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(hint)||!/^[a-f0-9-]+$/i.test(hint))throw Error();
  as.issuer='https://login.microsoftonline.com/'+hint+'/v2.0';as.jwks_uri='https://login.microsoftonline.com/'+hint+'/discovery/v2.0/keys';
 }
 const tokens=await oidc.processAuthorizationCodeResponse(as,c.client,resp,{expectedNonce:f.nonce,requireIdToken:true});
 const sigOptions=f.provider==='microsoft'?{[oidc.customFetch]:async (...a:Parameters<typeof fetch>)=>{
  const response=await fetch(...a);if(!response.ok)return response;const set=await response.json() as {keys:Array<{issuer?:string}>};
  const template='https://login.microsoftonline.com/{tenantid}/v2.0';return Response.json({keys:set.keys.filter(k=>k.issuer===as.issuer||k.issuer===template)});
 }}:undefined;
 await oidc.validateApplicationLevelSignature(as,resp,sigOptions);
 const claims=oidc.getValidatedIdTokenClaims(tokens);if(!claims?.sub)throw Error();
 const email=isMail(claims.email)?claims.email:'';
 let name=typeof claims.name==='string'?claims.name:'';
 if(f.provider==='apple'&&q.get('user')){const n=JSON.parse(q.get('user')!).name;name=[n?.firstName,n?.lastName].filter(v=>typeof v==='string').join(' ');}
 const account='oidc:'+await digest(claims.iss+'|'+claims.sub),result=newVisitorToken();
 await s.prepare("UPDATE registration_identity_flows SET phase='done',browser=?,account=?,name=?,email=?,trusted=?,expires=? WHERE state=? AND phase='exchange'").bind(await digest(result),account,name,email,email&&(claims.email_verified===true||claims.email_verified==='true')?1:0,Date.now()+120000,state).run();
 return back(req,origin,result);
 }catch{return origin?back(req,origin,'cancelado'):failure();}
}
