import {withPagesCors,pagesPreflight,permittedOrigin} from '@/lib/academy-cors';
import {isAdmin,ownsEnrollment} from '@/db/access';
import {db,all,one,now,uid,log} from '@/db/store';
import {entryKinds,gradeQuestions,provinces,type Entry,type EntryKind,type Question} from '@/lib/academy-workspace';
import {safeResourceUrl} from '@/lib/academy-content';
export const dynamic='force-dynamic';
const json=(o:any,status=200)=>Response.json(o,{status,headers:{'Cache-Control':'no-store'}});
class RequestError extends Error{constructor(message:string,public status=400){super(message);}}
const fail=(s:string,status=400):never=>{throw new RequestError(s,status);};
const str=(v:unknown,max=20000,optional=false)=>{if(optional&&(v===undefined||v===null||v===''))return '';if(typeof v!=='string'||(!optional&&!v.trim())||v.length>max)fail('Preencha os campos obrigatórios dentro dos limites indicados.');return (v as string).trim();};
const num=(v:unknown,min=0,max=10000)=>{const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)fail('Valor numérico inválido.');return n;};
const day=(s:unknown,optional=true)=>{const v=str(s,10,optional);if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))fail('Data inválida.');return v;};
const link=(s:unknown)=>{const v=str(s,2000,true);if(v&&!safeResourceUrl(v))fail('Utilize uma ligação pública HTTPS válida.');return v;};
const ids=(v:any)=>{if(v===undefined)return [];if(!Array.isArray(v)||v.length>100)fail('Selecção inválida.');return [...new Set<string>(v.map((x:any)=>str(x,100)))];};
const unpack=(r:any):Entry=>({id:r.id,kind:r.kind,title:r.title,status:r.status,revision:r.revision,created:r.created,updated:r.updated,body:JSON.parse(r.payload)});
async function entry(id:string){const r=await one('SELECT * FROM academy_entries WHERE id=?',id);if(!r)fail('Registo não encontrado.',404);return unpack(r);}
async function course(id:string){const c=await one('SELECT * FROM courses WHERE id=?',id);if(!c)fail('Curso não encontrado.',404);return c;}
async function draft(id:string){const c=await course(id);if(c.status!=='rascunho')fail('Prepare uma cópia em rascunho antes de alterar o conteúdo publicado.');return c;}
async function kindRef(id:string,kind:EntryKind){if(!id)return;const e=await entry(id);if(e.kind!==kind||e.status==='arquivado')fail('A referência seleccionada não está disponível.');}
function validateQuestion(v:any):Question{
 const id=str(v.id,100),prompt=str(v.prompt,2000),explanation=str(v.explanation,3000,true);
 if(!['unica','multipla','verdadeiro','curta'].includes(v.type))fail('Tipo de questão inválido.');
 if(v.type==='curta')return {id,type:v.type,prompt,options:[],answer:str(v.answer,500),explanation};
 const options=v.type==='verdadeiro'?['Verdadeiro','Falso']:(Array.isArray(v.options)?v.options.map((s:any)=>str(s,800)):[]);
 if(options.length<2||options.length>12)fail('Introduza entre 2 e 12 opções.');
 const answer=v.type==='multipla'?(Array.isArray(v.answer)?[...new Set<number>(v.answer.map((x:any)=>num(x,0,options.length-1)))]:[]):num(v.answer,0,options.length-1);
 if(Array.isArray(answer)&&!answer.length)fail('Seleccione pelo menos uma resposta correcta.');
 return {id,type:v.type,prompt,options,answer,explanation};
}
async function cleanEntry(kind:EntryKind,body:any,status:string,id:string){
 if(!body||typeof body!=='object'||Array.isArray(body))fail('Conteúdo inválido.');
 const base={description:str(body.description,20000,true)};
 if(['programa','formador','categoria','noticia','evento','anuncio'].includes(kind)){
  const b:any={...base,category:str(body.category,120,true),tags:str(body.tags,500,true),imageUrl:link(body.imageUrl)};
  if(kind==='formador'){b.institution=str(body.institution,200,true);b.specialty=str(body.specialty,200,true);}
  if(kind==='evento'){b.date=day(body.date,false);b.ends=day(body.ends);if(b.ends&&b.ends<b.date)fail('A data de fim deve ser posterior à data de início.');b.location=str(body.location,300,true);b.url=link(body.url);}
  return b;
 }
 if(kind==='configuracao'){
  if(id!=='institucional')fail('Configuração inválida.');
  const color=str(body.color,7);if(!/^#[0-9a-f]{6}$/i.test(color))fail('Seleccione uma cor válida.');
  return {name:str(body.name,120),description:str(body.description,2000,true),about:str(body.about,12000,true),logoUrl:link(body.logoUrl),faviconUrl:link(body.faviconUrl),color};
 }
 if(kind==='recurso'){
  const fileId=str(body.fileId,100,true),url=link(body.url);if(!fileId&&!url)fail('Escolha um ficheiro ou uma ligação.');
  if(fileId&&!await one('SELECT id FROM media WHERE id=?',fileId))fail('Ficheiro não encontrado.');
  return {...base,fileId,url,category:str(body.category,120,true),tags:str(body.tags,500,true),type:str(body.type,60),source:str(body.source,1000,true)};
 }
 if(kind==='curso'){
  await course(id);const programId=str(body.programId,100,true);await kindRef(programId,'programa');const teacherIds=ids(body.teacherIds);for(const id of teacherIds)await kindRef(id,'formador');
  const format=['gratuito','pago','sazonal'].includes(body.format)?body.format:'gratuito';
  const starts=day(body.starts),ends=day(body.ends),registrationStarts=day(body.registrationStarts),registrationEnds=day(body.registrationEnds);
  if(starts&&ends&&starts>ends||registrationStarts&&registrationEnds&&registrationStarts>registrationEnds)fail('Verifique os períodos de inscrição e de formação.');
  const price=Number(body.price||0);if(!Number.isFinite(price)||price<0||price>1e9)fail('Preço inválido.');
  return {programId,teacherIds,format,price,currency:['MZN','USD','ZAR','EUR'].includes(body.currency)?body.currency:'MZN',starts,ends,registrationStarts,registrationEnds,accessDays:num(body.accessDays||0,0,3650),notes:str(body.notes,12000,true)};
 }
 if(kind==='modulo'){
  const courseId=str(body.courseId,100);await draft(courseId);
  return {courseId,position:num(body.position||0),objectives:str(body.objectives,5000,true),notes:str(body.notes,10000,true)};
 }
 if(kind==='avaliacao'){
  const courseId=str(body.courseId,100);await draft(courseId);if(!['pre','pos'].includes(body.stage))fail('Seleccione Pré-teste ou Pós-teste.');
  const questions=Array.isArray(body.questions)?body.questions.map(validateQuestion):[];if(questions.length>100||status==='publicado'&&!questions.length)fail('Para disponibilizar a avaliação, adicione entre 1 e 100 questões.');
  if(new Set(questions.map((q:Question)=>q.id)).size!==questions.length)fail('As questões devem ter identificações distintas.');
  return {courseId,stage:body.stage,pass:num(body.pass||80,1,100),minutes:num(body.minutes||0,0,240),attempts:num(body.attempts||0,0,100),random:body.random===true,questionCount:num(body.questionCount||0,0,questions.length),questions};
 }
 fail('Tipo de registo inválido.');
}
async function read(req:Request){
 const admin=isAdmin(req),u=new URL(req.url);
 if(u.searchParams.has('history')){
  if(!admin)fail('Operação reservada à administração.',403);return json({history:await all('SELECT revision,payload,created FROM academy_entry_history WHERE entryId=? ORDER BY revision DESC',str(u.searchParams.get('history'),100))});
 }
 if(u.searchParams.has('runs')){
  const id=str(u.searchParams.get('runs'),100);if(!await ownsEnrollment(req,id))fail('Percurso indisponível nesta sessão.',403);
  return json({runs:await all('SELECT id,assessmentId,stage,state,started,deadline,score,submitted FROM academy_assessment_runs WHERE enrollmentId=? ORDER BY started DESC',id)});
 }
 if(u.searchParams.has('run')){
  const r=await one('SELECT * FROM academy_assessment_runs WHERE id=?',str(u.searchParams.get('run'),100));if(!r)fail('Tentativa não encontrada.',404);if(!await ownsEnrollment(req,r.enrollmentId))fail('Percurso indisponível nesta sessão.',403);return json(runView(r));
 }
 const raw=await all('SELECT * FROM academy_entries ORDER BY updated DESC');let entries=raw.map(unpack);
 if(!admin){
  const published=new Set((await all("SELECT id FROM courses WHERE status='publicado'")).map(c=>c.id));
  entries=entries.filter(e=>e.status==='publicado'&&(!['curso','modulo','avaliacao'].includes(e.kind)||published.has(e.kind==='curso'?e.id:e.body.courseId))).map(e=>e.kind==='avaliacao'?{...e,body:{...e.body,questionTotal:e.body.questions.length,questions:undefined}}:e);
 }
 return json({entries,members:admin?await all('SELECT * FROM academy_cohort_members'):[],attendance:admin?await all('SELECT * FROM academy_attendance'):[]});
}
function runView(r:any){const snap=JSON.parse(r.snapshot);return {id:r.id,enrollmentId:r.enrollmentId,assessmentId:r.assessmentId,stage:r.stage,state:r.state,started:r.started,deadline:r.deadline,title:snap.title,pass:snap.pass,answers:r.answers?JSON.parse(r.answers):{},score:r.score,submitted:r.submitted,questions:r.state==='active'?snap.questions.map(({answer,explanation,...q}:Question)=>q):[],review:r.state==='submitted'?JSON.parse(r.review):null};}
async function write(req:Request){
 if(!permittedOrigin(req))fail('Origem não autorizada.',403);const text=await req.text();if(text.length>300000)fail('Pedido demasiado grande.',413);let b:any;try{b=JSON.parse(text);}catch{fail('Pedido inválido.');}
 const admin=isAdmin(req),a=b.action;
 if(['assessment_start','assessment_answers','assessment_submit'].includes(a)){
  let r:any;
  if(a==='assessment_start'){
   const enrollmentId=str(b.enrollmentId,100);if(!await ownsEnrollment(req,enrollmentId))fail('Percurso indisponível nesta sessão.',403);
   const enrollment=await one('SELECT * FROM enrollments WHERE id=?',enrollmentId);if(!enrollment)fail('Inscrição não encontrada.',404);
   const assessment=await entry(str(b.assessmentId,100));if(assessment.kind!=='avaliacao'||assessment.status!=='publicado'||assessment.body.courseId!==enrollment.courseId)fail('Avaliação indisponível.',404);
   const c=await course(enrollment.courseId);if(c.status!=='publicado'||c.external)fail('Avaliação indisponível para este curso.');
   const existing=await one("SELECT * FROM academy_assessment_runs WHERE enrollmentId=? AND assessmentId=? AND state='active' ORDER BY started DESC LIMIT 1",enrollmentId,assessment.id);if(existing)return json(runView(existing));
   const count=(await one("SELECT COUNT(*) n FROM academy_assessment_runs WHERE enrollmentId=? AND assessmentId=? AND state='submitted'",enrollmentId,assessment.id)).n;if(assessment.body.attempts&&count>=assessment.body.attempts)fail('Atingiu o número de tentativas definido para esta avaliação.');
   let qs:Question[]=assessment.body.questions.map((q:Question)=>({...q}));if(assessment.body.random)for(let i=qs.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[qs[i],qs[j]]=[qs[j],qs[i]];}if(assessment.body.questionCount)qs=qs.slice(0,assessment.body.questionCount);
   const id=str(b.requestId,100),started=now(),deadline=assessment.body.minutes?new Date(Date.now()+assessment.body.minutes*60000).toISOString():null;
   const snap={title:assessment.title,pass:assessment.body.pass,revision:assessment.revision,questions:qs};
   try{await db().prepare("INSERT INTO academy_assessment_runs (id,enrollmentId,assessmentId,stage,state,started,deadline,snapshot,answers) VALUES (?,?,?,?,'active',?,?,?,'{}')").bind(id,enrollmentId,assessment.id,assessment.body.stage,started,deadline,JSON.stringify(snap)).run();}catch{const same=await one('SELECT * FROM academy_assessment_runs WHERE id=?',id);if(!same||same.enrollmentId!==enrollmentId||same.assessmentId!==assessment.id)fail('Não foi possível iniciar a tentativa. Tente novamente.',409);return json(runView(same));}
   r=await one('SELECT * FROM academy_assessment_runs WHERE id=?',id);return json(runView(r));
  }
  r=await one('SELECT * FROM academy_assessment_runs WHERE id=?',str(b.id,100));if(!r)fail('Tentativa não encontrada.',404);if(!await ownsEnrollment(req,r.enrollmentId))fail('Percurso indisponível nesta sessão.',403);if(r.state==='submitted')return json(runView(r));
  const snap=JSON.parse(r.snapshot),expired=!!r.deadline&&Date.now()>Date.parse(r.deadline);
  if(!b.answers||typeof b.answers!=='object'||Array.isArray(b.answers))fail('Respostas inválidas.');
  const answers=Object.fromEntries(snap.questions.filter((q:Question)=>Object.hasOwn(b.answers,q.id)).map((q:Question)=>{const v=b.answers[q.id];if(q.type==='curta')return[q.id,str(v,1000,true)];if(q.type==='multipla'){if(!Array.isArray(v))fail('Resposta inválida.');return[q.id,[...new Set(v.map((x:any)=>num(x,0,q.options.length-1)))]];}return[q.id,num(v,0,q.options.length-1)];}));
  if(a==='assessment_answers'){
   if(expired)return json({saved:false,expired:true});await db().prepare("UPDATE academy_assessment_runs SET answers=? WHERE id=? AND state='active'").bind(JSON.stringify(answers),r.id).run();return json({saved:true});
  }
  const finalAnswers=expired?JSON.parse(r.answers||'{}'):answers;
  if(!expired&&snap.questions.some((q:Question)=>!Object.hasOwn(finalAnswers,q.id)||(q.type==='curta'&&!String(finalAnswers[q.id]).trim())||(q.type==='multipla'&&!finalAnswers[q.id].length)))fail('Responda a todas as questões antes de submeter.');
  const result=gradeQuestions(snap.questions,finalAnswers),submitted=now();const statements=[db().prepare("UPDATE academy_assessment_runs SET state='submitted',answers=?,review=?,score=?,submitted=? WHERE id=? AND state='active'").bind(JSON.stringify(finalAnswers),JSON.stringify({questions:result.review,expired}),result.score,submitted,r.id)];
  if(r.stage==='pos')statements.push(db().prepare('INSERT OR IGNORE INTO attempts (id,enrollmentId,score,answers,created) VALUES (?,?,?,?,?)').bind(r.id,r.enrollmentId,result.score,JSON.stringify(finalAnswers),submitted));
  statements.push(db().prepare('INSERT INTO audit (id,action,entity,detail,created) SELECT ?,?,?,?,? WHERE changes()>0').bind(uid(),r.stage==='pre'?'Submeter pré-teste':'Submeter pós-teste',r.enrollmentId,result.score+'%',submitted));await db().batch(statements);return json(runView(await one('SELECT * FROM academy_assessment_runs WHERE id=?',r.id)));
 }
 if(!admin)fail('Operação reservada à administração.',403);
 if(a==='entry'){
  if(!entryKinds.includes(b.kind))fail('Tipo de registo inválido.');const kind=b.kind as EntryKind;const id=b.id?str(b.id,100):uid();const title=str(b.title,200);const status=['rascunho','publicado','arquivado'].includes(b.status)?b.status:'rascunho';const revision=num(b.revision||0);const old=await one('SELECT * FROM academy_entries WHERE id=?',id);
  if(old&&(old.kind!==kind||old.revision!==revision)||!old&&revision!==0)fail('Este registo foi actualizado noutra sessão. Reabra-o antes de guardar.',409);
  const body=await cleanEntry(kind,b.body,status,id),t=now();
  if(kind==='modulo'){
   str(title,160);
   if(old&&JSON.parse(old.payload).courseId!==body.courseId)fail('O módulo deve permanecer no curso em que foi criado.');
   const siblings=await all("SELECT id,title,payload FROM academy_entries WHERE kind='modulo' AND id<>? AND status<>'arquivado'",id);
   if(siblings.some(m=>JSON.parse(m.payload).courseId===body.courseId&&m.title.trim().toLocaleLowerCase('pt')===title.toLocaleLowerCase('pt')))fail('Já existe um módulo com este título no curso.');
  }
  const payload=JSON.stringify(body);if(payload.length>250000)fail('Reduza o conteúdo deste registo.');
  const statements=[];
  statements.push(db().prepare('INSERT OR IGNORE INTO academy_entry_history (entryId,revision,payload,created) SELECT id,revision,?,? FROM academy_entries WHERE id=? AND revision=?').bind(old?JSON.stringify(unpack(old)):'',t,id,revision));
  statements.push(db().prepare('INSERT INTO academy_entries (id,kind,title,status,payload,revision,created,updated) VALUES (?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,status=excluded.status,payload=excluded.payload,revision=academy_entries.revision+1,updated=excluded.updated WHERE academy_entries.revision=? AND academy_entries.kind=excluded.kind').bind(id,kind,title,status,payload,t,t,revision));
  const result=await db().batch(statements);if(!result[1].meta.changes)fail('O registo foi alterado noutra sessão. Reabra-o antes de guardar.',409);
  if(kind==='modulo'&&old&&old.title!==title)await db().prepare('UPDATE lessons SET module=? WHERE courseId=? AND module=?').bind(title,body.courseId,old.title).run();
  await db().batch([log('Guardar '+kind,id,title)]);return json({entry:await entry(id)});
 }
 if(a==='lesson_order'){
  const courseId=str(b.courseId,100);await draft(courseId);const order=ids(b.ids);const existing=await all('SELECT id FROM lessons WHERE courseId=?',courseId);if(order.length!==existing.length||existing.some(x=>!order.includes(x.id)))fail('A lista de aulas mudou. Reabra o curso antes de ordenar.');
  await db().batch([...order.map((id,i)=>db().prepare('UPDATE lessons SET position=? WHERE id=? AND courseId=?').bind(i,id,courseId)),log('Ordenar aulas',courseId,order.length+' aulas')]);return json({ok:true});
 }
 if(a==='enroll_bulk'){
  const c=await course(str(b.courseId,100));if(c.status!=='publicado'||c.external)fail('Seleccione um curso interno publicado.');
  if(!Array.isArray(b.rows)||!b.rows.length||b.rows.length>500)fail('Importe entre 1 e 500 participantes.');
  const rows=b.rows.map((r:any)=>({participant:str(r.nome,100),province:str(r.provincia,100),institution:str(r.instituicao,200,true)}));if(rows.some((r:any)=>!provinces.includes(r.province)))fail('Indique uma província válida em todas as linhas.');
  const statements=rows.map((r:any)=>db().prepare('INSERT OR IGNORE INTO enrollments (id,courseId,participant,province,institution,created) VALUES (?,?,?,?,?,?)').bind(uid(),c.id,r.participant,r.province,r.institution,now()));const result=await db().batch(statements);const added=result.reduce((n,r)=>n+r.meta.changes,0);await db().batch([log('Importar inscrições',c.id,added+' inscrições novas; duplicados preservados sem repetição')]);return json({added,skipped:rows.length-added});
 }
 if(a==='cohort_member'){
  const cohortId=str(b.cohortId,100),enrollmentId=str(b.enrollmentId,100);const c=await one('SELECT * FROM cohorts WHERE id=?',cohortId),e=await one('SELECT * FROM enrollments WHERE id=?',enrollmentId);if(!c||!e||c.courseId!==e.courseId)fail('A inscrição deve pertencer ao curso desta turma.');
  if(await one('SELECT * FROM academy_cohort_members WHERE cohortId=? AND enrollmentId=?',cohortId,enrollmentId))return json({ok:true});
  const r=await db().prepare('INSERT INTO academy_cohort_members (cohortId,enrollmentId,created) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM academy_cohort_members WHERE cohortId=?) < ?').bind(cohortId,enrollmentId,now(),cohortId,c.capacity).run();if(!r.meta.changes)fail('A turma já atingiu o número de vagas.');await db().batch([log('Adicionar participante à turma',cohortId,e.participant)]);return json({ok:true});
 }
 if(a==='cohort_update'){
  const id=str(b.id,100),c=await one('SELECT * FROM cohorts WHERE id=?',id);if(!c)fail('Turma não encontrada.',404);const starts=day(b.starts,false),ends=day(b.ends,false),capacity=num(b.capacity,1,10000);if(starts>ends)fail('Verifique o período da turma.');if(capacity<(await one('SELECT COUNT(*) n FROM academy_cohort_members WHERE cohortId=?',id)).n)fail('As vagas não podem ser inferiores aos participantes já associados.');
  await db().batch([db().prepare('UPDATE cohorts SET title=?,trainer=?,starts=?,ends=?,capacity=? WHERE id=?').bind(str(b.title,160),str(b.trainer,100),starts,ends,capacity,id),log('Actualizar turma',id,str(b.title,160))]);return json({ok:true});
 }
 if(a==='attendance'){
  const cohortId=str(b.cohortId,100),enrollmentId=str(b.enrollmentId,100),sessionDate=day(b.sessionDate,false);if(!['presente','ausente','justificada'].includes(b.state))fail('Seleccione o estado da presença.');
  const c=await one('SELECT * FROM cohorts WHERE id=?',cohortId);if(!c||sessionDate<c.starts||sessionDate>c.ends)fail('A sessão deve estar dentro do período da turma.');if(!await one('SELECT * FROM academy_cohort_members WHERE cohortId=? AND enrollmentId=?',cohortId,enrollmentId))fail('Associe o participante à turma antes de registar a presença.');
  await db().batch([db().prepare('INSERT INTO academy_attendance (cohortId,enrollmentId,sessionDate,state,updated) VALUES (?,?,?,?,?) ON CONFLICT(cohortId,enrollmentId,sessionDate) DO UPDATE SET state=excluded.state,updated=excluded.updated').bind(cohortId,enrollmentId,sessionDate,b.state,now()),log('Registar presença',cohortId,sessionDate+': '+b.state)]);return json({ok:true});
 }
 return fail('Operação não reconhecida.');
}
async function handle(req:Request,fn:()=>Promise<Response>){try{return await fn();}catch(e:any){if(!(e instanceof RequestError))console.error(e);return json({error:e instanceof RequestError?e.message:'Não foi possível concluir a operação. Tente novamente.'},e instanceof RequestError?e.status:503);}}
export const GET=(req:Request)=>withPagesCors(req,()=>handle(req,()=>read(req)));
export const POST=(req:Request)=>withPagesCors(req,()=>handle(req,()=>write(req)));
export const OPTIONS=pagesPreflight;
