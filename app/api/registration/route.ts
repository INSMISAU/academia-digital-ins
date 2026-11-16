import {permittedOrigin,withPagesCors,pagesPreflight} from '@/lib/academy-cors';
import {visitorToken,visitorKey,newVisitorToken,visitorCookie} from '@/db/access';
import {db} from '@/db/store';
import {registrationStatus,submitRegistration} from '@/lib/registration-service';
import {enabledProviders} from '@/lib/registration-identity';
import {externalToken,digest} from '@/lib/registration-session';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function GET(req:Request){return withPagesCors(req,async()=>{
 try{const state=await registrationStatus(db());return reply({...state,formVersion:2,providers:state.open?enabledProviders():[]});}catch{return reply({open:false,notice:''},503);}
});}
export function POST(req:Request){return withPagesCors(req,async()=>{
 if(!permittedOrigin(req))return reply({error:'Origem não autorizada.'},403);
 if(!req.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Formato inválido.'},415);
 if(Number(req.headers.get('Content-Length')||0)>24576)return reply({error:'Ficha demasiado extensa.'},413);
 try{
  const body=req.body?.getReader();if(!body)return reply({error:'Ficha vazia.'},400);
  const chunks:Uint8Array[]=[];let n=0;
  for(;;){const {value,done}=await body.read();if(done)break;if((n+=value.byteLength)>24576){await body.cancel();return reply({error:'Ficha demasiado extensa.'},413);}chunks.push(value);}
  let input;try{const merged=new Uint8Array(n);let offset=0;for(const part of chunks){merged.set(part,offset);offset+=part.length;}input=JSON.parse(new TextDecoder().decode(merged));}catch{return reply({error:'Ficha inválida.'},400);}
  if(!(await registrationStatus(db())).open)return reply({error:'As inscrições ainda não estão abertas.'},403);
  const prior=visitorToken(req), token=prior||newVisitorToken();
  let owner=await visitorKey(token);if(!owner)return reply({error:'A sessão terminou. Volte a entrar.'},401);
  // A different manual participant on the same equipment receives a separate course/progress owner.
  // The client keeps its candidate token for retries; it is never derived from the email.
  let replacement:string|null=null;
  let verifiedContact:string|null=null;
  const addr=typeof input?.answers?.email==='string'?input.answers.email.trim().toLowerCase():'';
  if(externalToken(token)){
   const sk=await digest(token);
   const identity=await db().prepare('SELECT email,trusted FROM registration_sessions WHERE token=? AND expires>?').bind(sk,Date.now()).first<{email:string;trusted:number}>();
   if(!identity)return reply({error:'A sessão terminou. Volte a entrar.'},401);
   if(addr&&identity.trusted&&addr===identity.email.toLowerCase())verifiedContact=addr;
   else if(addr&&await db().prepare('SELECT 1 FROM registration_mail_checks WHERE account=? AND email=? AND confirmed=1 AND expires>?').bind(owner,addr,Date.now()).first())verifiedContact=addr;
   else if(addr!==identity.email.toLowerCase())return reply({error:'Verifique o novo endereço de email antes de submeter.'},422);
  }else if(addr){
   const previous=await db().prepare("SELECT json_extract(payload,'$.email') AS email FROM academy_registration_forms WHERE owner=? ORDER BY created DESC LIMIT 1").bind(owner).first<{email:string}>();
   if(previous&&previous.email.toLowerCase()!==addr){
    replacement=typeof input?.nextParticipant==='string'&&/^[a-f0-9]{64}$/.test(input.nextParticipant)&&!externalToken(input.nextParticipant)?input.nextParticipant:newVisitorToken();
    owner=await visitorKey(replacement);
   }
  }
  const response=await submitRegistration(db(),owner,input,verifiedContact);
  if(response.ok&&replacement){const value=await response.json() as Record<string,unknown>;const rotated=reply({...value,participantSession:replacement},response.status);if(!req.headers.has('Authorization'))rotated.headers.set('Set-Cookie',visitorCookie(replacement));return rotated;}
  if(!prior&&response.ok)response.headers.set('Set-Cookie',visitorCookie(token));
  return response;
 }catch{return reply({error:'Não foi possível confirmar a inscrição. Tente novamente com os mesmos dados.'},503);}
});}
export function OPTIONS(req:Request){return pagesPreflight(req);}
