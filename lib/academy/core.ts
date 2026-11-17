import {db,one,all,now,uid,log} from '@/db/store';
import {isAdmin,visitorKey,visitorToken} from '@/db/access';
import {accountProfile} from '@/lib/academy-profile';
import {auditActor} from '@/db/actor';
import {safeResourceUrl} from '@/lib/academy-content';
export {db,one,all,now,uid,log,isAdmin};
export class AcademyError extends Error {constructor(message:string,public status=400){super(message);}}
export function fail(message:string,status=400):never{throw new AcademyError(message,status);}
export const text=(v:unknown,max=1000,required=false)=>{if(v==null&&!required)return '';if(typeof v!=='string'||v.length>max||required&&!v.trim()||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))fail('Reveja os campos e os limites indicados.');return (v as string).trim();};
export const integer=(v:unknown,min=0,max=100000)=>{const n=Number(v??0);if(!Number.isSafeInteger(n)||n<min||n>max)fail('Valor numérico inválido.');return n;};
export const decimal=(v:unknown,min=0,max=1e7)=>{const n=Number(v??0);if(!Number.isFinite(n)||n<min||n>max)fail('Valor numérico inválido.');return n;};
export const url=(v:unknown)=>{const s=text(v,2000);if(s&&!safeResourceUrl(s))fail('Utilize uma ligação HTTPS válida.');return s;};
export const dateTime=(v:unknown,required=false)=>{const s=text(v,40,required);if(!s)return '';const n=Date.parse(s);if(!Number.isFinite(n)||!/(Z|[+-]\d\d:\d\d)$/.test(s))fail('Seleccione uma data e hora com fuso horário.');return new Date(n).toISOString();};
export const list=(v:unknown,max=100)=>{if(v===undefined)return [];if(!Array.isArray(v)||v.length>max)fail('Lista inválida.');return v as any[];};
export const ids=(v:unknown,max=100)=>[...new Set(list(v,max).map(x=>text(x,100,true)))];
export const response=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function body(req:Request,limit=350000){const s=await req.text();if(s.length>limit)fail('Pedido demasiado grande.',413);try{const v=JSON.parse(s);if(!v||typeof v!=='object'||Array.isArray(v))fail('Pedido inválido.');return v;}catch(e){if(e instanceof AcademyError)throw e;fail('Pedido inválido.');}}
export function admin(req:Request){if(!isAdmin(req))fail('Operação reservada à gestão.',403);}
export async function principal(req:Request){const p=await accountProfile(req);if(p)return {id:p.account,name:p.name,email:p.email};const key=await visitorKey(visitorToken(req));if(!key)fail('Entre na sua conta para continuar.',401);return {id:'visitor:'+key,name:'',email:''};}
export async function enrolled(req:Request,courseId:string){const key=await visitorKey(visitorToken(req));const e=key?await one('SELECT * FROM enrollments WHERE visitorKey=? AND courseId=?',key,courseId):null;if(!e)fail('Não existe uma inscrição sua neste curso.',403);return e;}
export const actor=()=>auditActor().id;
export async function courseEntry(id:string){const e=await one("SELECT payload FROM academy_entries WHERE id=? AND kind='curso'",id);return e?JSON.parse(e.payload):{};}
export async function record(id:string){const r=await one('SELECT * FROM academy_entries WHERE id=?',id);if(!r)fail('Registo não encontrado.',404);return {...r,body:JSON.parse(r.payload)};}
export function slug(value:unknown){const s=text(value,180).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!s)fail('Preencha o endereço da publicação.');return s;}
export async function notification(account:string,title:string,message:string,href:string,key:string,kind='academia',email=''){
 const id=uid();const result=await db().prepare('INSERT OR IGNORE INTO academy_notifications(id,account,kind,title,body,href,created,dedupe) VALUES(?,?,?,?,?,?,?,?)').bind(id,account,kind,title,message,href,now(),key).run();
 if(result.meta.changes&&email)await db().prepare("INSERT OR IGNORE INTO academy_mail_queue(id,recipient,subject,body,state,attempts,available,lastError) VALUES(?,?,?,?,'pending',0,?,'')").bind(id,email,title,message,now()).run();
}
export async function audit(action:string,entity:string,detail:string){await log(action,entity,detail).run();}
