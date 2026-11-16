import {db} from '@/db/store';
import {isAdmin} from '@/db/access';
import {withPagesCors,pagesPreflight,permittedOrigin} from '@/lib/academy-cors';
import {privacyNotice} from '@/lib/registration-service';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export function GET(req:Request){return withPagesCors(req,async()=>{
 if(!isAdmin(req))return reply({error:'Acesso reservado.'},403);
 const row=await db().prepare('SELECT enabled,notice,privacy FROM academy_registration_settings WHERE id=1').first<{enabled:number;notice:string;privacy:string}>();
 return reply({enabled:row?.enabled===1,notice:row?.notice||'',privacy:row?.privacy?JSON.parse(row.privacy):{}});
});}
export function POST(req:Request){return withPagesCors(req,async()=>{
 if(!isAdmin(req)||!permittedOrigin(req))return reply({error:'Acesso reservado.'},403);
 if(!req.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Formato inválido.'},415);
 const text=await req.text();if(text.length>16000)return reply({error:'Conteúdo demasiado extenso.'},413);
 let body;try{body=JSON.parse(text);}catch{return reply({error:'Dados inválidos.'},400);}
 if(typeof body.enabled!=='boolean'||typeof body.notice!=='string'||!body.privacy||typeof body.privacy!=='object')return reply({error:'Dados inválidos.'},400);
 const privacy:Record<string,string>={};
 for(const key of ['purpose','controller','access','retention','corrections']){
  if(typeof body.privacy[key]!=='string'||body.privacy[key].length>2500)return reply({error:'Reveja a informação de protecção de dados.'},422);
  privacy[key]=body.privacy[key].trim();
 }
 const encoded=JSON.stringify(privacy);
 if(body.enabled&&!privacyNotice(encoded))return reply({error:'Complete a informação de protecção de dados antes de abrir as inscrições.'},422);
 await db().prepare('INSERT INTO academy_registration_settings(id,enabled,notice,privacy) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled,notice=excluded.notice,privacy=excluded.privacy').bind(body.enabled?1:0,body.notice.trim(),encoded).run();
 return reply({ok:true});
});}
export const OPTIONS=pagesPreflight;
