import {permittedOrigin,withPagesCors,pagesPreflight} from '@/lib/academy-cors';
import {visitorToken,visitorKey,newVisitorToken,visitorCookie} from '@/db/access';
import {db} from '@/db/store';
import {registrationStatus,submitRegistration} from '@/lib/registration-service';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function GET(req:Request){return withPagesCors(req,async()=>{
 try{return reply(await registrationStatus(db()));}catch{return reply({open:false,notice:''},503);}
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
  const prior=visitorToken(req), token=prior||newVisitorToken();
  const response=await submitRegistration(db(),await visitorKey(token),input);
  if(!prior&&response.ok)response.headers.set('Set-Cookie',visitorCookie(token));
  return response;
 }catch{return reply({error:'Não foi possível confirmar a inscrição. Tente novamente com os mesmos dados.'},503);}
});}
export function OPTIONS(req:Request){return pagesPreflight(req);}
