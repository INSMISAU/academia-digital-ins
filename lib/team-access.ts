import {log} from '@/db/store';
import {runActor} from '@/db/actor';
import {env} from 'cloudflare:workers';
import {withPagesCors} from './academy-cors';
import {runAdministration} from '@/db/administration';
import {runValidation} from '@/db/validation';
import {isAdmin} from '@/db/access';
import {administrationAccess} from './administration-session';

// Independent, revocable capabilities for the internal technical team.
// Only hashes live in runtime configuration; no key is embedded in source.
type Access={id:string;label:string;hash:string;expires:number;validationOnly?:boolean};
export async function teamAccess(req:Request):Promise<Access|null>{
 const token=req.headers.get('X-Academy-Team')||'';
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 try{
  const settings=env as unknown as Record<string,string>;
  const ordinary=JSON.parse(settings.INS_TEAM_ACCESS||'[]'),validation=JSON.parse(settings.INS_VALIDATION_ACCESS||'[]');
  const configured=[...(Array.isArray(ordinary)?ordinary:[]),...(Array.isArray(validation)?validation.map(a=>({...a,validationOnly:true})):[])];
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
  return configured.find((a:Access)=>a&&typeof a.id==='string'&&typeof a.label==='string'&&a.hash===hash&&Number.isFinite(a.expires)&&a.expires>Date.now())||null;
 }catch{return null;}
}
export function withTeam(req:Request,handle:()=>Promise<Response>,validation=false){
 return withPagesCors(req,async()=>{
  const administrator=await administrationAccess(req),access=administrator||await teamAccess(req);
  if(!access&&!isAdmin(req))return Response.json({error:'Entre na Administração para continuar.'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(access&&'validationOnly' in access&&access.validationOnly&&!validation)return Response.json({error:'Este acesso permite apenas a área de ensaio.'},{status:403,headers:{'Cache-Control':'no-store'}});
  const traced=async()=>{const response=await handle();if(req.method==='GET'&&req.headers.get('X-Academy-Mode')!=='participant')await log('Consultar administração',new URL(req.url).pathname,response.ok?'Consulta autorizada':'Consulta recusada',response.ok?'permitido':'negado').run();return response;};
  return runActor(administrator?administrator.id:access?'technical:'+access.id:'site-owner','',()=>validation?runValidation(traced,req.headers.get('X-Academy-Mode')!=='participant'):runAdministration(traced));
 });
}

// Copy course content only: no participants, submissions or production settings.
// Repeated entries preserve every record previously changed by the testers.
export async function prepareValidation(){
 const database=env.DB;
 if(!database)throw Error('Base de dados indisponível.');
 const names=['courses','lessons','questions','academy_entries'];
 const privacy=JSON.stringify({purpose:'Validação técnica com dados fictícios.',controller:'Equipa técnica interna da Ologa.',access:'Acessos técnicos privados da Ologa.',retention:'Apenas durante a validação interna.',corrections:'Equipa técnica interna da Ologa.'});
 await database.batch([
  ...names.map(name=>database.prepare(`INSERT OR IGNORE INTO validation_${name} SELECT * FROM ${name}`)),
  database.prepare("INSERT OR IGNORE INTO validation_academy_registration_settings(id,enabled,notice,privacy) VALUES(1,1,?,?)").bind('Utilize exclusivamente dados fictícios nesta área de testes interna.',privacy),
 ]);
}
