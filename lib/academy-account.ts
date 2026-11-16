import {db} from '@/db/store';
import {visitorToken,newVisitorToken} from '@/db/access';
import {inValidation} from '@/db/validation';
import {digest,externalPrefix,keyFor} from './registration-session';
import {registrationStatus} from './registration-service';
import {enabledProviders,limitedText} from './registration-identity';
import {validPassword,passwordHash,passwordMatches} from './academy-password';
import {mailAvailable,sendAcademyMail} from './academy-mail';
import {permittedOrigin} from './academy-cors';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const emailValid=(s:unknown):s is string=>typeof s==='string'&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
async function limit(bucket:string,maximum:number,period:number){const time=Date.now();return !!await db().prepare('INSERT INTO registration_mail_limits(bucket,until,count) VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN until<=? THEN 1 ELSE count+1 END,until=CASE WHEN until<=? THEN excluded.until ELSE until END WHERE until<=? OR count<? RETURNING count').bind(bucket,time+period,time,time,time,maximum).first();}
export async function accountProfile(req:Request){const token=visitorToken(req);if(!token)return null;return db().prepare('SELECT account,name,email,trusted FROM registration_sessions WHERE token=? AND expires>?').bind(await digest(token),Date.now()).first<{account:string;name:string;email:string;trusted:number}>();}
async function newSession(account:{id:string;name:string;email:string;verified:number}){
 const session=externalPrefix+newVisitorToken().slice(externalPrefix.length);
 await db().prepare('INSERT INTO registration_sessions(token,account,name,email,trusted,expires) VALUES(?,?,?,?,?,?)').bind(await digest(session),account.id,account.name,account.email,account.verified,Date.now()+8*3600000).run();
 return {session,profile:{name:account.name,email:account.email,verified:!!account.verified}};
}
export async function getAccount(req:Request){try{
 const profile=await accountProfile(req),state=await registrationStatus(db());
 const owner=profile?'':await keyFor(visitorToken(req)),hasManualLearning=!!owner&&!!await db().prepare('SELECT 1 FROM enrollments WHERE visitorKey=? UNION ALL SELECT 1 FROM academy_registration_forms WHERE owner=? LIMIT 1').bind(owner,owner).first();
 return reply({hasManualLearning,profile:profile?{name:profile.name,email:profile.email,verified:!!profile.trusted}:null,registrationOpen:state.open,notice:state.notice,providers:inValidation()?[]:enabledProviders(),recoveryAvailable:mailAvailable()&&!inValidation()});
}catch{return reply({error:'Não foi possível consultar a conta. Tente novamente.'},503);}}
export async function postAccount(req:Request){try{
 if(!permittedOrigin(req)||!req.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Pedido não autorizado.'},403);
 const input=JSON.parse(await limitedText(req,4096)),s=db();
 if(input.action==='logout'){
  const token=visitorToken(req);if(token)await s.prepare('DELETE FROM registration_sessions WHERE token=?').bind(await digest(token)).run();return reply({ok:true});
 }
 if(!emailValid(input.email))return reply({error:'Indique um endereço de email válido.'},422);
 const email=input.email.trim().toLowerCase(),ip=req.headers.get('CF-Connecting-IP')||'unknown';
 if(!await limit('account-ip:'+await digest(ip),60,900000)||!await limit('account-email:'+await digest(email),10,900000))return reply({error:'Aguarde alguns minutos antes de voltar a tentar.'},429);
 if(input.action==='register'){
  const state=await registrationStatus(s);if(!state.open)return reply({error:'A criação de contas está temporariamente indisponível.'},503);
  if(input.notice!==state.notice)return reply({error:'A informação de protecção de dados foi actualizada. Volte a abrir a página.'},409);
  if(typeof input.name!=='string'||!input.name.trim()||input.name.length>200||/[\u0000-\u001f]/.test(input.name))return reply({error:'Indique o seu nome.'},422);
  if(!validPassword(input.password))return reply({error:'Use uma palavra-passe entre 15 e 256 caracteres.'},422);
  if(inValidation()&&!email.endsWith('@example.invalid'))return reply({error:'Nos testes internos, use um endereço fictício terminado em @example.invalid.'},422);
  const id='account:'+crypto.randomUUID(),name=input.name.trim(),hash=await passwordHash(input.password);
  const result=await s.prepare('INSERT OR IGNORE INTO academy_accounts(id,email,name,password,verified,created) VALUES(?,?,?,?,0,?) RETURNING id').bind(id,email,name,hash,new Date().toISOString()).first();
  if(!result)return reply({error:'Não foi possível criar a conta. Se já tem conta, utilize Entrar.'},409);
  // Roles and resource scopes are never accepted from registration input.
  return reply(await newSession({id,name,email,verified:0}),201);
 }
 if(input.action==='login'){
  if(typeof input.password!=='string'||input.password.length>256)return reply({error:'Email ou palavra-passe incorrectos.'},401);
  const account=await s.prepare('SELECT id,name,email,password,verified FROM academy_accounts WHERE email=?').bind(email).first<{id:string;name:string;email:string;password:string;verified:number}>();
  // Run the same KDF for absent accounts; no session or privileges from unverified claims.
  const valid=await passwordMatches(input.password,account?.password||'scrypt:16384:8:5:'+'0'.repeat(32)+':'+'0'.repeat(64));
  if(!account||!valid)return reply({error:'Email ou palavra-passe incorrectos.'},401);
  return reply(await newSession(account));
 }
 if(input.action==='recover'){
  if(!mailAvailable()||inValidation())return reply({error:'A recuperação por email está temporariamente indisponível.'},503);
  const account=await s.prepare('SELECT id FROM academy_accounts WHERE email=?').bind(email).first<{id:string}>();
  if(account){
   const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%100000000).padStart(8,'0'),hash=await digest(account.id+'|'+code);
   await s.prepare('INSERT INTO academy_password_resets(account,digest,expires,tries) VALUES(?,?,?,0) ON CONFLICT(account) DO UPDATE SET digest=excluded.digest,expires=excluded.expires,tries=0').bind(account.id,hash,Date.now()+600000).run();
   try{await sendAcademyMail(email,'Academia do INS — recuperação de acesso','Código de recuperação: '+code+'\nVálido por 10 minutos. Se não pediu a recuperação, ignore esta mensagem.');}
   catch{await s.prepare('DELETE FROM academy_password_resets WHERE account=? AND digest=?').bind(account.id,hash).run();return reply({error:'Não foi possível enviar o email. Tente novamente.'},503);}
  }
  return reply({ok:true,message:'Se existir uma conta com este email, receberá um código de recuperação.'});
 }
 if(input.action==='reset'){
  if(!validPassword(input.password)||typeof input.code!=='string'||!/^\d{8}$/.test(input.code))return reply({error:'Reveja o código e a nova palavra-passe.'},422);
  const account=await s.prepare('SELECT id FROM academy_accounts WHERE email=?').bind(email).first<{id:string}>();
  if(!account)return reply({error:'Código inválido ou expirado.'},422);
  const hash=await digest(account.id+'|'+input.code);
  const check=await s.prepare('UPDATE academy_password_resets SET tries=tries+1 WHERE account=? AND expires>? AND tries<5 RETURNING digest,expires').bind(account.id,Date.now()).first<{digest:string;expires:number}>();
  if(!check||check.digest!==hash)return reply({error:'Código inválido ou expirado.'},422);
  const password=await passwordHash(input.password);
  // Atomic claim: concurrent resets cannot apply the same code twice.
  const changed=await s.batch([
   s.prepare('UPDATE academy_accounts SET password=?,verified=1 WHERE id=? AND EXISTS(SELECT 1 FROM academy_password_resets WHERE account=? AND digest=? AND expires>?) RETURNING id').bind(password,account.id,account.id,hash,Date.now()),
   s.prepare('DELETE FROM registration_sessions WHERE account=? AND EXISTS(SELECT 1 FROM academy_password_resets WHERE account=? AND digest=? AND expires>?)').bind(account.id,account.id,hash,Date.now()),
   s.prepare('DELETE FROM academy_password_resets WHERE account=? AND digest=?').bind(account.id,hash)
  ]);
  return changed[0].results?.length?reply({ok:true}):reply({error:'Código inválido ou expirado.'},422);
 }
 return reply({error:'Operação desconhecida.'},400);
}catch{return reply({error:'Não foi possível concluir. Tente novamente.'},503);}}
