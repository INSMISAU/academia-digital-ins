import {cleanAnswers} from './registration';
type Store={prepare:(sql:string)=>D1PreparedStatement;batch:(statements:D1PreparedStatement[])=>Promise<unknown>};
type Settings={enabled:number;notice:string};
export async function registrationStatus(store:Store){
 const s=await store.prepare('SELECT enabled,notice FROM academy_registration_settings WHERE id=1').first<Settings>();
 return {open:s?.enabled===1&&!!s.notice.trim(),notice:s?.notice||''};
}
const result=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function submitRegistration(store:Store, owner:string, input:any){
 const state=await registrationStatus(store);
 if(!state.open)return result({error:'As inscrições ainda não estão abertas.'},403);
 if(!input||input.confirmName!==true||input.confirmData!==true||input.notice!==state.notice)return result({error:'Reveja os dados e confirme as duas declarações e o aviso apresentado.'},400);
 const id=typeof input.courseId==='string'?input.courseId:'';
 const course=await store.prepare("SELECT id,title,external FROM courses WHERE id=? AND status='publicado'").bind(id).first<{id:string;title:string;external:string|null}>();
 if(!course)return result({error:'O curso não está disponível para inscrição.'},404);
 const {answers,errors}=cleanAnswers(input.answers);
 if(Object.keys(errors).length)return result({errors,error:'Reveja os campos indicados.'},422);
 const payload=JSON.stringify(answers), reference='INS-'+crypto.randomUUID().toUpperCase(), created=new Date().toISOString();
 const email=String(answers.email).toLowerCase();
 const emailKey=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id+'\n'+email))),b=>b.toString(16).padStart(2,'0')).join('');
 const inserts=[store.prepare(`INSERT OR IGNORE INTO academy_registration_forms(reference,courseId,owner,emailKey,payload,certificateName,notice,created)
 SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM academy_registration_settings WHERE id=1 AND enabled=1 AND notice=?) AND EXISTS (SELECT 1 FROM courses WHERE id=? AND status='publicado')`).bind(reference,id,owner,emailKey,payload,answers.certificado,state.notice,created,state.notice,id)];
 // Existing dashboards see only a pseudonym. No personal answers are copied to their tables.
 if(!course.external)inserts.push(store.prepare(`INSERT INTO enrollments(id,courseId,participant,province,institution,visitorKey,created)
 SELECT ?,courseId,?,'Não indicada','Não indicada',owner,created FROM academy_registration_forms f
 WHERE f.reference=? AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.courseId=f.courseId AND e.visitorKey=f.owner)`).bind(crypto.randomUUID(),'Participante '+crypto.randomUUID().slice(0,12),reference));
 await store.batch(inserts);
 const row=await store.prepare('SELECT reference,payload,created FROM academy_registration_forms WHERE owner=? AND courseId=?').bind(owner,id).first<{reference:string;payload:string;created:string}>();
 // A retry can only confirm this session's identical persisted form; no third-party reference is returned.
 if(!row||row.payload!==payload)return result({error:'Não foi possível registar esta ficha. Verifique se já submeteu uma inscrição neste curso.'},409);
 return result({reference:row.reference,created:row.created,course:course.id==='surtos'?'Curso Básico em Investigação de Surtos':course.title},row.reference===reference?201:200);
}

// A certificate from the manual form uses its confirmed name only for its owner.
// Existing certificates and the separate validation area keep their former rules.
export async function registrationCertificateName(store:Store,enrollmentId:string,owner:string):Promise<string|null|undefined>{
 const present=await store.prepare("SELECT 1 AS ready FROM sqlite_master WHERE type='table' AND name='academy_registration_forms'").first();
 if(!present)return undefined;
 const row=await store.prepare('SELECT f.owner,f.certificateName FROM academy_registration_forms f JOIN enrollments e ON e.visitorKey=f.owner AND e.courseId=f.courseId WHERE e.id=?').bind(enrollmentId).first<{owner:string;certificateName:string}>();
 return row?(row.owner===owner?row.certificateName:null):undefined;
}
