import {db,all,one,uid,now,log} from '@/db/store';
import {isAdmin} from '@/db/access';
import {auditActor,runActor} from '@/db/actor';
import {accountProfile} from './academy-profile';
import {roleGrants,roles,type Grant} from './academy-roles';
import {mfaVerified} from './academy-mfa';
import {limitedText} from './registration-identity';
import {withPagesCors,permittedOrigin,pagesPreflight} from './academy-cors';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const text=(v:unknown,max=200)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Preencha os campos obrigatórios.');return v.trim();};
async function handle(req:Request){
 const profile=await accountProfile(req),grants=profile?await roleGrants(profile.account):[];
 const technical=isAdmin(req),verified=!!profile&&await mfaVerified(req,profile.account);
 const global=technical||verified&&grants.some(g=>g.role==='platform_admin');
 const institutions=verified?grants.filter(g=>g.role==='institutional_admin'&&!g.courseId&&!g.cohortId).map(g=>g.institutionId):[];
 if(!global&&!institutions.length)return reply({error:'Sem permissão para gerir acessos.'},403);
 const actor=technical?(auditActor().id||'site-owner'):profile!.account;
 return runActor(actor,institutions.length===1?institutions[0]:'',async()=>{try{
  if(req.method==='GET'){
   const permitted=(id:string)=>global||institutions.includes(id);
   const scopes=await all('SELECT * FROM academy_resource_scopes');
   const accounts=await all('SELECT id,name,email FROM academy_accounts ORDER BY name');
   const allowedAccounts=accounts.filter(a=>global||scopes.some(s=>s.kind==='account'&&s.resourceId===a.id&&permitted(s.institutionId)));
   const accountIds=new Set(allowedAccounts.map(a=>a.id));
   const result={global,institutions:(await all('SELECT * FROM academy_institutions ORDER BY name')).filter(i=>permitted(i.id)),accounts:allowedAccounts,roles:(await all('SELECT * FROM academy_roles ORDER BY created DESC')).filter(g=>global||permitted(g.institutionId)&&accountIds.has(g.account)),scopes:scopes.filter(s=>permitted(s.institutionId)),courses:global?await all('SELECT id,title FROM courses ORDER BY title'):[],cohorts:global?await all('SELECT id,title,courseId FROM cohorts ORDER BY title'):[],enrollments:global?await all('SELECT id,participant title,courseId FROM enrollments'):[],entries:global?await all('SELECT id,title FROM academy_entries'):[],media:global?await all('SELECT id,name title FROM media'):[]};
   if(!global){const ids=new Set(scopes.filter(s=>s.kind==='course'&&permitted(s.institutionId)).map(s=>s.resourceId));result.courses=(await all('SELECT id,title FROM courses ORDER BY title')).filter(c=>ids.has(c.id));result.cohorts=(await all('SELECT id,title,courseId FROM cohorts ORDER BY title')).filter(c=>ids.has(c.courseId));}
   await log('Consultar permissões','acessos','Listagem autorizada').run();return reply(result);
  }
  if(!permittedOrigin(req))return reply({error:'Origem não autorizada.'},403);
  const b=JSON.parse(await limitedText(req,5000));
  if(b.action==='institution'){
   if(!global)return reply({error:'Sem permissão.'},403);const id=uid();await db().batch([db().prepare('INSERT INTO academy_institutions(id,name,created) VALUES(?,?,?)').bind(id,text(b.name),now()),log('Registar instituição',id,'Instituição indicada pela administração')]);return reply({id},201);
  }
  if(b.action==='scope'){
   if(!global)return reply({error:'A associação institucional é reservada à administração da plataforma.'},403);
   const tables:Record<string,string>={course:'courses',enrollment:'enrollments',entry:'academy_entries',media:'media',account:'academy_accounts'};
   if(!tables[b.kind])return reply({error:'Tipo de registo inválido.'},422);
   const id=text(b.resourceId),institution=text(b.institutionId);
   if(!await one('SELECT id FROM academy_institutions WHERE id=?',institution)||!await one('SELECT id FROM '+tables[b.kind]+' WHERE id=?',id))return reply({error:'Registo indisponível.'},422);
   if(await one('SELECT resourceId FROM academy_resource_scopes WHERE kind=? AND resourceId=?',b.kind,id))return reply({error:'O registo já tem uma associação. Actualize a lista.'},409);
   if(b.ownerAccount&&!await one('SELECT id FROM academy_accounts WHERE id=?',b.ownerAccount))return reply({error:'Conta indisponível.'},422);
   const courseId=b.kind==='course'?id:b.courseId||'';
   if(courseId){const c=await one('SELECT id FROM courses WHERE id=?',courseId);if(!c)return reply({error:'Curso indisponível.'},422);const s=await one("SELECT institutionId FROM academy_resource_scopes WHERE kind='course' AND resourceId=?",courseId);if(b.kind!=='course'&&s?.institutionId!==institution)return reply({error:'O curso deve estar associado à mesma instituição.'},422);}
   await db().batch([db().prepare('INSERT INTO academy_resource_scopes(kind,resourceId,institutionId,ownerAccount,courseId) VALUES(?,?,?,?,?)').bind(b.kind,id,institution,b.ownerAccount||'',courseId),log('Associar âmbito',b.kind+':'+id,'Instituição: '+institution)]);return reply({ok:true});
  }
  if(b.action==='grant'){
   const account=text(b.account),role=text(b.role),institution=b.institutionId||'',courseId=b.courseId||'',cohortId=b.cohortId||'';
   if(!roles.includes(role as any)||!await one('SELECT id FROM academy_accounts WHERE id=?',account))return reply({error:'Conta ou perfil inválido.'},422);
   if(profile?.account===account&&!technical)return reply({error:'Não pode alterar as suas próprias permissões.'},403);
   if(courseId&&cohortId)return reply({error:'Seleccione um curso ou uma turma.'},422);
   if(role==='platform_admin'&&(!global||institution||courseId||cohortId)||role==='institutional_admin'&&(!global||!institution||courseId||cohortId))return reply({error:'Âmbito incompatível com este perfil.'},422);
   if(role!=='platform_admin'&&(!institution||!await one('SELECT id FROM academy_institutions WHERE id=?',institution)))return reply({error:'Seleccione a instituição.'},422);
   if(role==='reviewer'&&(!courseId||cohortId))return reply({error:'Seleccione o curso a rever.'},422);
   if(!global){if(!institutions.includes(institution)||!['manager','trainer','reviewer'].includes(role)||!await one("SELECT resourceId FROM academy_resource_scopes WHERE kind='account' AND resourceId=? AND institutionId=?",account,institution))return reply({error:'Conta ou âmbito fora da sua instituição.'},403);}
   const targetCourse=courseId|| (cohortId?(await one('SELECT courseId FROM cohorts WHERE id=?',cohortId))?.courseId:'');
   if((courseId||cohortId)&&(!targetCourse||!await one("SELECT resourceId FROM academy_resource_scopes WHERE kind='course' AND resourceId=? AND institutionId=?",targetCourse,institution)))return reply({error:'O curso ou turma não pertence à instituição seleccionada.'},422);
   if(b.canPublish===true&&role!=='trainer')return reply({error:'A autorização de publicação só se aplica ao formador.'},422);
   if(await one('SELECT id FROM academy_roles WHERE account=? AND role=? AND institutionId=? AND courseId=? AND cohortId=?',account,role,institution,courseId,cohortId))return reply({error:'Esta permissão já existe.'},409);
   const id=uid();await db().batch([db().prepare('INSERT INTO academy_roles(id,account,role,institutionId,courseId,cohortId,canPublish,created,actor) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,account,role,institution,courseId,cohortId,b.canPublish===true?1:0,now(),actor),log('Atribuir permissão',id,JSON.stringify({account,role,institution,courseId,cohortId,canPublish:b.canPublish===true}))]);return reply({id},201);
  }
  if(b.action==='revoke'){
   const grant=await one('SELECT * FROM academy_roles WHERE id=?',text(b.id)) as Grant|null;
   if(!grant)return reply({error:'Permissão indisponível.'},404);
   if(profile?.account===grant.account&&!technical)return reply({error:'Não pode alterar as suas próprias permissões.'},403);
   if(!global&&(!institutions.includes(grant.institutionId)||!['manager','trainer','reviewer'].includes(grant.role)))return reply({error:'Sem permissão.'},403);
   await db().batch([db().prepare('DELETE FROM academy_roles WHERE id=?').bind(grant.id),log('Revogar permissão',grant.id,'Conta: '+grant.account)]);return reply({ok:true});
  }
  if(b.action==='reset_mfa'){
   if(!global||profile?.account===b.account)return reply({error:'Sem permissão.'},403);const account=text(b.account),reason=text(b.reason,500);
   if(!await one('SELECT id FROM academy_accounts WHERE id=?',account))return reply({error:'Conta indisponível.'},404);
   await db().batch([db().prepare('DELETE FROM academy_mfa WHERE account=?').bind(account),db().prepare('DELETE FROM academy_mfa_sessions WHERE account=?').bind(account),db().prepare('DELETE FROM registration_sessions WHERE account=?').bind(account),log('Repor MFA',account,reason)]);return reply({ok:true});
  }
  return reply({error:'Operação desconhecida.'},400);
 }catch{return reply({error:'Não foi possível guardar. Reveja os dados e actualize a lista.'},422);}});
}
export const ACCESS=(req:Request)=>withPagesCors(req,async()=>{const response=await handle(req);if(response.status>=400)await log('Gestão de permissões','acessos','Pedido recusado','negado').run();return response;});
export const ACCESS_OPTIONS=pagesPreflight;
