import {env} from 'cloudflare:workers';
import {db,one,log,now,uid} from '@/db/store';
import {runActor} from '@/db/actor';
import {visitorToken} from '@/db/access';
import {accountProfile} from './academy-profile';
import {digest} from './registration-session';
import {permittedOrigin,withPagesCors,pagesPreflight} from './academy-cors';
import {limitedText} from './registration-identity';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes:Uint8Array){let bits=0,value=0,out='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out;}
export function unbase32(secret:string){let bits=0,value=0;const bytes:number[]=[];for(const c of secret){const n=alphabet.indexOf(c);if(n<0)throw Error('Segredo inválido.');value=(value<<5)|n;bits+=5;if(bits>=8){bytes.push((value>>>(bits-8))&255);bits-=8;}}return new Uint8Array(bytes);}
// RFC 6238, 30-second steps; replay is checked separately in the database.
export async function totp(secret:string,step:number,digits=6){const counter=new Uint8Array(8);new DataView(counter.buffer).setBigUint64(0,BigInt(step));const key=await crypto.subtle.importKey('raw',unbase32(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,counter));const offset=mac[mac.length-1]&15;const value=((mac[offset]&127)<<24)|(mac[offset+1]<<16)|(mac[offset+2]<<8)|mac[offset+3];return String(value%10**digits).padStart(digits,'0');}
const hex=(b:Uint8Array)=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const bytes=(s:string)=>new Uint8Array(s.match(/../g)!.map(v=>parseInt(v,16)));
function configuredKey(){return (env as unknown as Record<string,string>).INS_MFA_ENCRYPTION_KEY||'';}
export const mfaAvailable=()=>/^[a-f0-9]{64}$/.test(configuredKey());
async function cipherKey(){if(!mfaAvailable())throw Error('A autenticação adicional está temporariamente indisponível.');return crypto.subtle.importKey('raw',bytes(configuredKey()),'AES-GCM',false,['encrypt','decrypt']);}
async function encrypt(secret:string,account:string){const iv=crypto.getRandomValues(new Uint8Array(12));return hex(iv)+':'+hex(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(account)},await cipherKey(),new TextEncoder().encode(secret))));}
async function decrypt(value:string,account:string){const [iv,data]=value.split(':');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:new TextEncoder().encode(account)},await cipherKey(),bytes(data)));}
export async function mfaVerified(req:Request,account:string){const token=visitorToken(req);return !!token&&!!await one('SELECT 1 FROM academy_mfa_sessions m JOIN registration_sessions s ON s.token=m.token AND s.account=m.account JOIN academy_mfa f ON f.account=m.account WHERE m.token=? AND m.account=? AND m.expires>? AND s.expires>? AND f.enabled=1',await digest(token),account,Date.now(),Date.now());}
export async function mfaInfo(req:Request,account:string){return {available:mfaAvailable(),enabled:!!(await one('SELECT enabled FROM academy_mfa WHERE account=?',account))?.enabled,verified:await mfaVerified(req,account)};}
async function handle(req:Request){const profile=await accountProfile(req);if(!profile)return Response.json({error:'Entre na sua conta.'},{status:401});return runActor(profile.account,'',async()=>{try{
 if(req.method==='GET')return Response.json(await mfaInfo(req,profile.account));
 if(!permittedOrigin(req))return Response.json({error:'Origem não autorizada.'},{status:403});
 if(!mfaAvailable())return Response.json({error:'A autenticação adicional está temporariamente indisponível.'},{status:503});
 const b=JSON.parse(await limitedText(req,2048)),time=Date.now(),account=profile.account;
 const allowed=await db().prepare('INSERT INTO registration_mail_limits(bucket,until,count) VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN until<=? THEN 1 ELSE count+1 END,until=CASE WHEN until<=? THEN excluded.until ELSE until END WHERE until<=? OR count<10 RETURNING count').bind('mfa:'+account,time+300000,time,time,time).first();
 if(!allowed)return Response.json({error:'Aguarde alguns minutos antes de voltar a tentar.'},{status:429});
 if(b.action==='setup'){
  if(!await one('SELECT id FROM academy_roles WHERE account=? LIMIT 1',account))return Response.json({error:'A configuração destina-se às contas com permissões de gestão.'},{status:403});
  const secret=base32(crypto.getRandomValues(new Uint8Array(20))),cipher=await encrypt(secret,account);
  // An enabled factor cannot be replaced by possession of the first factor alone.
  const changed=await db().prepare('INSERT INTO academy_mfa(account,cipher,enabled,lastStep,expires) VALUES(?,?,0,-1,?) ON CONFLICT(account) DO UPDATE SET cipher=excluded.cipher,lastStep=-1,expires=excluded.expires WHERE enabled=0 RETURNING account').bind(account,cipher,time+600000).first();
  if(!changed)return Response.json({error:'A autenticação adicional já está configurada.'},{status:409});
  await log('Preparar MFA',account,'Configuração iniciada').run();
  return Response.json({secret,uri:'otpauth://totp/'+encodeURIComponent('Academia INS:'+profile.email)+'?secret='+secret+'&issuer=Academia%20INS&algorithm=SHA1&digits=6&period=30'});
 }
 if(b.action!=='verify'||typeof b.code!=='string'||!/^\d{6}$/.test(b.code))return Response.json({error:'Introduza o código de seis dígitos.'},{status:422});
 const factor=await one('SELECT * FROM academy_mfa WHERE account=?',account);let matched=-1;
 if(factor&&(factor.enabled||factor.expires>time)){const secret=await decrypt(factor.cipher,account),step=Math.floor(time/30000);for(const n of [step-1,step,step+1])if(n>factor.lastStep&&await totp(secret,n)===b.code)matched=n;}
 if(matched<0){await db().prepare('INSERT INTO audit(id,action,entity,detail,created,actor,result) VALUES(?,?,?,?,?,?,?)').bind(uid(),'MFA',account,'Código recusado',now(),account,'negado').run();return Response.json({error:'Código inválido, expirado ou já utilizado.'},{status:422});}
 const claimed=await db().prepare('UPDATE academy_mfa SET enabled=1,lastStep=? WHERE account=? AND cipher=? AND lastStep<? RETURNING account').bind(matched,account,factor.cipher,matched).first();
 if(!claimed)return Response.json({error:'Código já utilizado. Aguarde o próximo código.'},{status:409});
 const token=await digest(visitorToken(req)!);
 await db().batch([db().prepare('INSERT INTO academy_mfa_sessions(token,account,expires) SELECT token,account,expires FROM registration_sessions WHERE token=? AND account=? AND expires>? ON CONFLICT(token) DO UPDATE SET expires=excluded.expires').bind(token,account,Date.now()),log('Confirmar MFA',account,'Autenticação adicional confirmada nesta sessão')]);
 return Response.json({ok:true});
 }catch{return Response.json({error:'Não foi possível concluir a autenticação adicional.'},{status:503});}});}
export function MFA(req:Request){return withPagesCors(req,async()=>{const response=await handle(req);response.headers.set('Cache-Control','no-store');return response;});}
export const MFA_OPTIONS=pagesPreflight;
