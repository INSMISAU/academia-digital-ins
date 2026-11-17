import {env} from 'cloudflare:workers';
import {newVisitorToken} from '@/db/access';
import {digest,externalPrefix} from './registration-session';
import {passwordMatches} from './academy-password';
import {limitedText} from './registration-identity';
import {permittedOrigin} from './academy-cors';

type Administrator={id:string;email:string;name:string;passwordHash:string};
function administrators():Administrator[]{
 try{const entries=JSON.parse((env as unknown as Record<string,string>).INS_ADMIN_CREDENTIALS||'[]');return Array.isArray(entries)?entries.filter(a=>a&&typeof a.id==='string'&&typeof a.email==='string'&&typeof a.name==='string'&&typeof a.passwordHash==='string'):[];}catch{return [];}
}
const sessionAccount=async(a:Administrator)=>'administrator:'+a.id+':'+await digest(a.passwordHash);
function database(){if(!env.DB)throw Error('Base de dados indisponível.');return env.DB;}
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function limit(bucket:string,maximum:number){const time=Date.now(),period=900000;return !!await database().prepare('INSERT INTO registration_mail_limits(bucket,until,count) VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN until<=? THEN 1 ELSE count+1 END,until=CASE WHEN until<=? THEN excluded.until ELSE until END WHERE until<=? OR count<? RETURNING count').bind(bucket,time+period,time,time,time,maximum).first();}

export async function administrationAccess(req:Request){
 const token=req.headers.get('X-Academy-Team')||'';
 if(!/^[a-f0-9]{64}$/.test(token)||!token.startsWith(externalPrefix))return null;
 const session=await database().prepare('SELECT account,email,expires FROM registration_sessions WHERE token=? AND expires>?').bind(await digest(token),Date.now()).first<{account:string;email:string;expires:number}>();
 if(!session)return null;
 const configured=administrators().find(a=>a.email.toLowerCase()===session.email);
 if(!configured||session.account!==await sessionAccount(configured))return null;
 return {id:'administrator:'+configured.id,label:configured.name,email:configured.email,expires:session.expires};
}

export async function postAdministrationSession(req:Request){try{
 if(!permittedOrigin(req)||!req.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Pedido não autorizado.'},403);
 const input=JSON.parse(await limitedText(req,4096));
 if(input.action==='logout'){
  const access=await administrationAccess(req),token=req.headers.get('X-Academy-Team');
  if(access&&token)await database().prepare('DELETE FROM registration_sessions WHERE token=?').bind(await digest(token)).run();
  return reply({ok:true});
 }
 const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
 if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof input.password!=='string'||input.password.length>256)return reply({error:'Email ou palavra-passe incorrectos.'},401);
 const ip=req.headers.get('CF-Connecting-IP')||'unknown';
 if(!await limit('admin-ip:'+await digest(ip),60)||!await limit('admin-email:'+await digest(email),10))return reply({error:'Aguarde alguns minutos antes de voltar a tentar.'},429);
 const administrator=administrators().find(a=>a.email.toLowerCase()===email);
 const valid=await passwordMatches(input.password,administrator?.passwordHash||'scrypt:16384:8:5:'+'0'.repeat(32)+':'+'0'.repeat(64));
 if(!administrator||!valid)return reply({error:'Email ou palavra-passe incorrectos.'},401);
 const session=externalPrefix+newVisitorToken().slice(externalPrefix.length),expires=Date.now()+8*3600000;
 await database().prepare('INSERT INTO registration_sessions(token,account,name,email,trusted,expires) VALUES(?,?,?,?,1,?)').bind(await digest(session),await sessionAccount(administrator),administrator.name,email,expires).run();
 return reply({session,expires});
 }catch{return reply({error:'Não foi possível entrar. Tente novamente.'},503);}
}
