import {AsyncLocalStorage} from 'node:async_hooks';
import {db,all,one,uid,now,log} from '@/db/store';
import {runActor} from '@/db/actor';
import {runAdministration} from '@/db/administration';
import {accountProfile} from './academy-profile';
import {mfaVerified} from './academy-mfa';
import {withPagesCors} from './academy-cors';
import {limitedText} from './registration-identity';
export const roles=['platform_admin','institutional_admin','manager','trainer','reviewer'] as const;
export type Role=typeof roles[number];
export type Grant={id:string;account:string;role:Role;institutionId:string;courseId:string;cohortId:string;canPublish:number};
type Scope={kind:string;resourceId:string;institutionId:string;ownerAccount:string;courseId:string};
export type RoleContext={account:string;grants:Grant[];scopes:Map<string,Scope>;courses:Map<string,any>;cohorts:Map<string,any>;enrollments:Map<string,any>;members:any[];entries:Map<string,any>;creationInstitution:string};
const context=new AsyncLocalStorage<RoleContext>();
export const roleContext=()=>context.getStore();
export class PermissionError extends Error{constructor(message='Sem permissão para este registo.',public status=403){super(message);}}
const deny=():never=>{throw new PermissionError();};
export async function roleGrants(account:string){return await all('SELECT * FROM academy_roles WHERE account=?',account) as Grant[];}
export async function loadRoleContext(account:string,grants:Grant[]):Promise<RoleContext>{
 const [scopes,courses,cohorts,enrollments,members,entries]=await Promise.all([all('SELECT * FROM academy_resource_scopes'),all('SELECT id FROM courses'),all('SELECT id,courseId FROM cohorts'),all('SELECT id,courseId FROM enrollments'),all('SELECT cohortId,enrollmentId FROM academy_cohort_members'),all('SELECT id,kind,status,payload FROM academy_entries')]);
 return {account,grants,scopes:new Map(scopes.map(s=>[s.kind+':'+s.resourceId,s])),courses:new Map(courses.map(c=>[c.id,c])),cohorts:new Map(cohorts.map(c=>[c.id,c])),enrollments:new Map(enrollments.map(c=>[c.id,c])),members,entries:new Map(entries.map(e=>[e.id,{...e,body:JSON.parse(e.payload)}])),creationInstitution:''};
}
export const globalRole=(c:RoleContext)=>c.grants.some(g=>g.role==='platform_admin');
export function resourceCourse(c:RoleContext,kind:string,id:string):string{
 if(kind==='course')return c.courses.has(id)?id:'';
 if(kind==='cohort')return c.cohorts.get(id)?.courseId||'';
 if(kind==='enrollment')return c.enrollments.get(id)?.courseId||'';
 if(kind==='entry'){const e=c.entries.get(id);if(e?.kind==='curso')return e.id;if(['modulo','avaliacao','tarefa','banco_questao'].includes(e?.kind))return e.body.courseId;}
 return c.scopes.get(kind+':'+id)?.courseId||'';
}
export function matches(c:RoleContext,g:Grant,kind:string,id:string,writeCourse=false){
 if(g.role==='platform_admin')return true;
 const courseId=resourceCourse(c,kind,id),scope=c.scopes.get(kind+':'+id),cs=courseId?c.scopes.get('course:'+courseId):undefined;
 if(g.courseId)return courseId===g.courseId;
 if(g.cohortId){if(kind==='enrollment')return c.members.some(m=>m.cohortId===g.cohortId&&m.enrollmentId===id);if(kind==='cohort')return id===g.cohortId;return !writeCourse&&!!courseId&&c.cohorts.get(g.cohortId)?.courseId===courseId;}
 if(!g.institutionId)return false;
 if(g.role==='trainer'||g.role==='reviewer')return !!cs&&cs.institutionId===g.institutionId&&cs.ownerAccount===c.account&&g.role==='trainer';
 // Institutional access to a participant requires an explicit participant scope,
 // never a match against the free-text institution entered in a registration form.
 const institution=kind==='enrollment'?scope?.institutionId:(scope?.institutionId||cs?.institutionId);
 return institution===g.institutionId;
}
export function permitted(c:RoleContext,allowed:readonly Role[],kind:string,id:string,writeCourse=false){return c.grants.some(g=>allowed.includes(g.role)&&matches(c,g,kind,id,writeCourse));}
const admins:Role[]=['platform_admin','institutional_admin'];
const editors:Role[]=[...admins,'trainer'];
const managers:Role[]=[...admins,'manager'];
const people:Role[]=[...managers,'trainer'];
export function canRead(c:RoleContext,kind:string,id:string){const e=kind==='entry'?c.entries.get(id):null;if(e?.status==='publicado'&&['formador','programa','categoria','configuracao'].includes(e.kind))return true;return permitted(c,kind==='enrollment'?people:roles,kind,id);}
function requirePermission(c:RoleContext,allowed:Role[],kind:string,id:string,writeCourse=false){if(!permitted(c,allowed,kind,id,writeCourse))deny();}
function creation(c:RoleContext,allowed:Role[],requested:unknown){
 const candidates=c.grants.filter(g=>allowed.includes(g.role)&&!g.courseId&&!g.cohortId);
 if(candidates.some(g=>g.role==='platform_admin')){c.creationInstitution=typeof requested==='string'?requested:'';return;}
 const institutions=[...new Set(candidates.map(g=>g.institutionId).filter(Boolean))];const selected=typeof requested==='string'&&requested?requested:institutions.length===1?institutions[0]:'';
 if(!selected||!institutions.includes(selected))throw new PermissionError('Seleccione uma instituição autorizada para criar este registo.');c.creationInstitution=selected;
}
export function scopeStatements(kind:string,id:string,courseId=''){
 const c=roleContext();if(!c)return [];
 const inherited=courseId?c.scopes.get('course:'+courseId):undefined;
 return [db().prepare('INSERT OR IGNORE INTO academy_resource_scopes(kind,resourceId,institutionId,ownerAccount,courseId) VALUES(?,?,?,?,?)').bind(kind,id,inherited?.institutionId||c.creationInstitution,c.account,courseId)];
}
export function viewsFor(c:RoleContext){
 if(globalRole(c))return null;
 const r=new Set(c.grants.map(g=>g.role)),views=['painel','gestao'];
 if(r.has('institutional_admin'))views.push('programas-gestao','formadores-gestao','categorias-gestao','revisao','turmas','inscricoes','avaliacoes','materiais','biblioteca-gestao','noticias-gestao','eventos-gestao','anuncios-gestao','certificados-gestao','relatorios','auditoria','acessos');
 if(r.has('manager'))views.push('programas-gestao','turmas','inscricoes','relatorios');
 if(r.has('trainer'))views.push('revisao','turmas','avaliacoes','materiais','relatorios');
 if(r.has('reviewer'))views.push('revisao');
 return [...new Set(views)];
}
export async function authorize(c:RoleContext,req:Request,path:string){
 const u=new URL(req.url),parts=path.split('/'),api=parts[0];
 if(api==='completion'){
  if(req.method==='GET'){
   const course=u.searchParams.get('course')||u.searchParams.get('manual')||u.searchParams.get('packages');if(course){requirePermission(c,people,'course',course);return;}
   const event=u.searchParams.get('event')||u.searchParams.get('calendar');if(event){requirePermission(c,admins,'entry',event);return;}
   const image=u.searchParams.get('image');if(image){requirePermission(c,editors,'media',image);return;}
   const file=u.searchParams.get('file');if(file){const s=await one('SELECT enrollmentId FROM academy_submissions WHERE fileId=?',file);if(!s)deny();requirePermission(c,people,'enrollment',s.enrollmentId);return;}
   if(globalRole(c))return;deny();
  }
  if(req.headers.get('Content-Type')?.startsWith('multipart/form-data')){
   const f=await req.clone().formData();if(!['image','package'].includes(u.searchParams.get('upload')||''))deny();const course=f.get('courseId');if(typeof course==='string'&&course)requirePermission(c,editors,'course',course,true);else creation(c,admins,f.get('institutionId'));return;
  }
  const b=JSON.parse(await limitedText(req.clone() as Request,350000));
  if(['run_jobs','course_trash_restore'].includes(b.action)){if(!globalRole(c))deny();return;}
  if(b.action==='course_trash'){requirePermission(c,editors,'course',b.id,true);return;}
  if(b.action?.startsWith('editorial_')){requirePermission(c,admins,'entry',b.id,true);return;}
  if(['event_decision','event_attendance'].includes(b.action)){requirePermission(c,admins,'entry',b.eventId);return;}
  if(b.action==='course_approve'){requirePermission(c,people,'enrollment',b.enrollmentId);return;}
  if(b.action==='assignment_grade'){const s=await one('SELECT enrollmentId FROM academy_submissions WHERE id=?',b.id);if(!s)deny();requirePermission(c,people,'enrollment',s.enrollmentId);return;}
  if(b.action==='assessment_grade'){const s=await one('SELECT enrollmentId FROM academy_assessment_runs WHERE id=?',b.id);if(!s)deny();requirePermission(c,people,'enrollment',s.enrollmentId);return;}
  if(b.action==='discussion_moderate'){const d=await one('SELECT courseId FROM academy_discussions WHERE id=?',b.id);if(!d)deny();requirePermission(c,editors,'course',d.courseId,true);return;}
  deny();
 }
 if(req.method==='GET'){
  if(api==='academy'){const id=u.searchParams.get('course');if(id&&!canRead(c,'course',id))deny();return;}
  if(api==='workspace'){
   const history=u.searchParams.get('history');if(history&&!canRead(c,'entry',history))deny();
   const runs=u.searchParams.get('runs');if(runs&&!canRead(c,'enrollment',runs))deny();
   const run=u.searchParams.get('run');if(run){const record=await one('SELECT enrollmentId FROM academy_assessment_runs WHERE id=?',run);if(!record||!canRead(c,'enrollment',record.enrollmentId))deny();}return;
  }
  if(api==='media'){if(!parts[1]||!canRead(c,'media',parts[1]))deny();return;}
  if(api==='resource'){if(!parts[1]||!canRead(c,'entry',parts[1]))deny();return;}
  if(api==='certificate'){const record=await one('SELECT enrollmentId FROM certificates WHERE id=?',parts[1]||'');if(!record||!canRead(c,'enrollment',record.enrollmentId))deny();return;}
  if(api==='registration'&&parts[1]==='settings'&&globalRole(c))return;
  deny();
 }
 if(req.method!=='POST')deny();
 if(api==='media'){
  const form=await req.clone().formData(),courseId=form.get('courseId');
  if(typeof courseId==='string'&&courseId){requirePermission(c,editors,'course',courseId,true);c.creationInstitution=c.scopes.get('course:'+courseId)?.institutionId||'';}
  else creation(c,admins,form.get('institutionId'));
  return;
 }
 const b=JSON.parse(await limitedText(req.clone() as Request,300000)),a=b.action;
 if(api==='registration'&&parts[1]==='settings'){if(!globalRole(c))deny();return;}
 if(api==='export'){if(!Array.isArray(b.ids)||b.ids.some((id:unknown)=>typeof id!=='string'||!canRead(c,'enrollment',id)))deny();return;}
 if(api==='academy'){
  if(a==='course'){if(b.id)requirePermission(c,editors,'course',b.id,true);else creation(c,editors,b.institutionId);return;}
  if(a==='duplicate'){requirePermission(c,editors,'course',b.id,true);c.creationInstitution=c.scopes.get('course:'+b.id)?.institutionId||'';return;}
  if(['lesson','question'].includes(a)){requirePermission(c,editors,'course',b.courseId,true);return;}
  if(a==='transition'){
   if(['rascunho','aprovado'].includes(b.status))requirePermission(c,[...admins,'reviewer'],'course',b.id,true);
   else if(b.status==='em_revisao')requirePermission(c,editors,'course',b.id,true);
   else if(b.status==='publicado'){if(!c.grants.some(g=>matches(c,g,'course',b.id,true)&&(admins.includes(g.role)||g.role==='trainer'&&g.canPublish===1)))deny();}
   else if(b.status==='arquivado')requirePermission(c,admins,'course',b.id,true);else deny();return;
  }
  if(a==='cohort'){requirePermission(c,[...managers,'trainer'],'course',b.courseId,true);return;}
  if(a==='enroll'){requirePermission(c,managers,'course',b.courseId);c.creationInstitution=c.scopes.get('course:'+b.courseId)?.institutionId||'';return;}
  if(a==='certificate'){requirePermission(c,admins,'enrollment',b.enrollmentId);return;}
  if(a==='revoke'){const cert=await one('SELECT enrollmentId FROM certificates WHERE id=?',b.id);if(!cert)deny();requirePermission(c,admins,'enrollment',cert.enrollmentId);return;}
  // A manager never studies or submits an assessment on another person's behalf.
  deny();
 }
 if(api==='workspace'){
  if(a==='entry'){
   if(b.id&&c.entries.has(b.id))requirePermission(c,b.kind==='programa'?managers:['curso','modulo','avaliacao','tarefa','banco_questao'].includes(b.kind)?editors:admins,'entry',b.id,true);
   if(['curso','modulo','avaliacao','tarefa','banco_questao'].includes(b.kind)){requirePermission(c,editors,'course',b.kind==='curso'?b.id:b.body?.courseId,true);}
   else if(b.kind==='configuracao'){if(!globalRole(c))deny();}
   else if(!b.id||!c.entries.has(b.id))creation(c,b.kind==='programa'?managers:admins,b.institutionId);
   for(const id of [b.body?.programId,...(Array.isArray(b.body?.teacherIds)?b.body.teacherIds:[])].filter(Boolean))if(!canRead(c,'entry',id))deny();
   if(b.body?.fileId&&!canRead(c,'media',b.body.fileId))deny();return;
  }
  if(a==='lesson_order'||a==='module_order'){requirePermission(c,editors,'course',b.courseId,true);return;}
  if(a==='enroll_bulk'){requirePermission(c,managers,'course',b.courseId);c.creationInstitution=c.scopes.get('course:'+b.courseId)?.institutionId||'';return;}
  if(['cohort_member','attendance'].includes(a)){requirePermission(c,a==='attendance'?people:managers,'cohort',b.cohortId);requirePermission(c,a==='attendance'?people:managers,'enrollment',b.enrollmentId);return;}
  if(a==='cohort_update'){requirePermission(c,[...managers,'trainer'],'cohort',b.id);return;}
  deny();
 }
 deny();
}
export function coursePermissions(c:RoleContext,id:string){
 const edit=permitted(c,editors,'course',id,true),review=permitted(c,[...admins,'reviewer'],'course',id,true);
 const publish=c.grants.some(g=>matches(c,g,'course',id,true)&&(admins.includes(g.role)||g.role==='trainer'&&g.canPublish===1));
 return {edit,duplicate:edit,transitions:[...(edit?['em_revisao']:[]),...(review?['rascunho','aprovado']:[]),...(publish?['publicado']:[]),...(permitted(c,admins,'course',id,true)?['arquivado']:[])],results:permitted(c,people,'course',id)};
}
export async function filterRoleResponse(c:RoleContext,res:Response,path:string){
 if(!res.ok||!res.headers.get('Content-Type')?.includes('application/json'))return res;
 const d:any=await res.json();
 if(path==='completion'){if(Array.isArray(d.submissions))d.submissions=d.submissions.filter((s:any)=>canRead(c,'enrollment',s.enrollmentId));if(Array.isArray(d.runs))d.runs=d.runs.filter((r:any)=>canRead(c,'enrollment',r.enrollmentId));}
 if(path==='academy'&&d.course)d.permissions=coursePermissions(c,d.course.id);
 if(path==='academy'&&Array.isArray(d.courses)){
  d.courses=d.courses.filter((x:any)=>canRead(c,'course',x.id)).map((x:any)=>({...x,permissions:coursePermissions(c,x.id),canCreateCohort:permitted(c,[...managers,'trainer'],'course',x.id,true)}));d.enrollments=d.enrollments.filter((x:any)=>canRead(c,'enrollment',x.id));
  d.cohorts=d.cohorts.filter((x:any)=>canRead(c,'cohort',x.id));d.certificates=d.certificates.filter((x:any)=>canRead(c,'enrollment',x.enrollmentId));
  d.media=d.media.filter((x:any)=>canRead(c,'media',x.id));d.audit=d.audit.filter((x:any)=>globalRole(c)||x.institution&&c.grants.some(g=>g.role==='institutional_admin'&&g.institutionId===x.institution));
  d.allowedViews=viewsFor(c);d.roleManagement=true;d.managementInstitutions=(await all('SELECT id,name FROM academy_institutions ORDER BY name')).filter(i=>globalRole(c)||c.grants.some(g=>g.institutionId===i.id));d.canManageMembers=c.grants.some(g=>managers.includes(g.role));d.canCreateCourse=c.grants.some(g=>editors.includes(g.role)&&!g.courseId&&!g.cohortId);
  d.canEditCourses=c.grants.some(g=>editors.includes(g.role));
 }
 if(path==='workspace'&&d.entries){
  d.entries=d.entries.filter((e:any)=>canRead(c,'entry',e.id));d.members=d.members.filter((x:any)=>canRead(c,'cohort',x.cohortId)&&canRead(c,'enrollment',x.enrollmentId));d.attendance=d.attendance.filter((x:any)=>canRead(c,'cohort',x.cohortId)&&canRead(c,'enrollment',x.enrollmentId));
 }
 return Response.json(d,{status:res.status,headers:res.headers});
}
export function withRoles(req:Request,path:string,handler:()=>Promise<Response>){return withPagesCors(req,async()=>{
 const profile=await accountProfile(req);if(!profile)return Response.json({error:'Entre na sua conta.'},{status:401,headers:{'Cache-Control':'no-store'}});
 return runActor(profile.account,'',async()=>{try{
  const grants=await roleGrants(profile.account);if(!grants.length)deny();
  if(!await mfaVerified(req,profile.account))throw new PermissionError('Confirme a autenticação adicional em Meu perfil.',403);
  const c=await loadRoleContext(profile.account,grants);
  return await context.run(c,async()=>{await authorize(c,req,path);const institutions=[...new Set(grants.map(g=>g.institutionId).filter(Boolean))];return runActor(c.account,institutions.length===1?institutions[0]:'',async()=>{
   const response=await runAdministration(handler);
   const filtered=await filterRoleResponse(c,response,path);
   await log(req.method==='GET'?'Consultar gestão':'Operação de gestão',path,response.ok?'permitido':'recusado',response.ok?'permitido':'negado').run();filtered.headers.set('Cache-Control','no-store');return filtered;
  });});
 }catch(error){const status=error instanceof PermissionError?error.status:503;await db().prepare('INSERT INTO audit(id,action,entity,detail,created,actor,result) VALUES(?,?,?,?,?,?,?)').bind(uid(),'Acesso à gestão',path,'Pedido recusado',now(),profile.account,'negado').run();return Response.json({error:status===503?'Não foi possível verificar as permissões. Tente novamente.':(error as Error).message},{status,headers:{'Cache-Control':'no-store'}});}});
});}
