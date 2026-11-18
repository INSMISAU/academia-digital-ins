import {auditActor} from '@/db/actor';
import {db,one,all,uid,now} from '@/db/store';
import {scopeStatements} from '@/lib/academy-roles';
import {nextCourseVersion} from '@/lib/academy-course-version-label';
export async function courseVersionLabel(c:any){const e=await one("SELECT payload FROM academy_entries WHERE id=? AND kind='curso'",c.id);const body=e?JSON.parse(e.payload):{};return {...c,...(body.semanticVersion?{versionLabel:body.semanticVersion}:{} )};}
export async function duplicateCourseVersion(b:any){
 const c=await one('SELECT * FROM courses WHERE id=?',b.id);if(!c||c.status==='lixo'||c.external)throw Error('Curso indisponível para criar uma versão.');
 if(b.expectedUpdated&&c.updated!==b.expectedUpdated)throw Error('O curso foi alterado. Actualize a página.');
 const entries=await all("SELECT * FROM academy_entries WHERE (kind='curso' AND id=?) OR (kind IN ('modulo','avaliacao','tarefa','banco_questao') AND json_extract(payload,'$.courseId')=?)",c.id,c.id),setup=entries.find(r=>r.kind==='curso'),body=setup?JSON.parse(setup.payload):{},root=body.versionRoot||c.id,label=nextCourseVersion(body.semanticVersion||c.version,b.bump||'major'),id=uid(),t=now();
 const lessons=await all('SELECT * FROM lessons WHERE courseId=? ORDER BY position',c.id),questions=await all('SELECT * FROM questions WHERE courseId=?',c.id),mapping=new Map<string,string>([[c.id,id],...entries.filter(r=>r.kind!=='curso').map(r=>[r.id,uid()] as [string,string]),...lessons.map(r=>[r.id,uid()] as [string,string]),...questions.map(r=>[r.id,uid()] as [string,string])]);
 // Check complete source snapshots inside the same transaction as the inserts.
 const guardArgs:any[]=[],guards:string[]=[];
 function unchanged(table:string,rows:any[],fields:string[],where:string,args:any[]){guards.push(`(SELECT COUNT(*) FROM ${table} x JOIN json_each(?) e ON ${fields.map(f=>`x.${f} IS json_extract(e.value,'$.${f}')`).join(' AND ')} WHERE ${where})=? AND (SELECT COUNT(*) FROM ${table} x WHERE ${where})=?`);guardArgs.push(JSON.stringify(rows),...args,rows.length,...args,rows.length);}
 unchanged('lessons',lessons,['id','module','title','body','position'],'x.courseId=?',[c.id]);unchanged('questions',questions,['id','prompt','options','answer','explanation'],'x.courseId=?',[c.id]);unchanged('academy_entries',entries,['id','revision','payload','status','title'],"((x.kind='curso' AND x.id=?) OR (x.kind IN ('modulo','avaliacao','tarefa','banco_questao') AND json_extract(x.payload,'$.courseId')=?))",[c.id,c.id]);
 const first=db().prepare(`INSERT INTO courses(id,title,summary,category,status,hours,pass,version,updated) SELECT ?,?,?,?,'rascunho',?,?,?,? WHERE EXISTS(SELECT 1 FROM courses WHERE id=? AND updated=? AND status=?) AND NOT EXISTS(SELECT 1 FROM academy_entries WHERE kind='curso' AND json_extract(payload,'$.versionRoot')=? AND json_extract(payload,'$.semanticVersion')=?) AND ${guards.join(' AND ')}`).bind(id,c.title+' — nova versão',c.summary,c.category,c.hours,c.pass,c.version+1,t,c.id,c.updated,c.status,root,label,...guardArgs);
 const accepted='EXISTS(SELECT 1 FROM courses WHERE id=?)',statements:any[]=[first];
 for(const l of lessons)statements.push(db().prepare(`INSERT INTO lessons(id,courseId,module,title,body,position) SELECT ?,?,?,?,?,? WHERE ${accepted}`).bind(mapping.get(l.id)!,id,l.module,l.title,l.body,l.position,id));
 for(const q of questions)statements.push(db().prepare(`INSERT INTO questions(id,courseId,prompt,options,answer,explanation) SELECT ?,?,?,?,?,? WHERE ${accepted}`).bind(mapping.get(q.id)!,id,q.prompt,q.options,q.answer,q.explanation,id));
 const newSetup={...body,semanticVersion:label,versionRoot:root,parentCourseId:c.id,parentVersion:body.semanticVersion||c.version+'.0'};
 const records=[...(setup?[]:[{id:c.id,kind:'curso',title:c.title,status:'publicado',payload:'{}'}]),...entries];
 for(const r of records){const v=r.kind==='curso'?newSetup:{...JSON.parse(r.payload),courseId:id};if(r.kind==='modulo')v.prerequisiteModules=(v.prerequisiteModules||[]).map((ref:string)=>mapping.get(ref)||ref);if(r.kind==='tarefa'&&v.lessonId)v.lessonId=mapping.get(v.lessonId)||v.lessonId;const recordId=r.kind==='curso'?id:mapping.get(r.id)!;
  statements.push(db().prepare(`INSERT INTO academy_entries(id,kind,title,status,payload,revision,created,updated) SELECT ?,?,?,?,?,1,?,? WHERE ${accepted}`).bind(recordId,r.kind,r.title,r.kind==='curso'?'publicado':r.status,JSON.stringify(v),t,t,id));
 }
 statements.push(...scopeStatements('course',id,c.id,{table:'courses',id}),...records.flatMap(r=>scopeStatements('entry',r.kind==='curso'?id:mapping.get(r.id)!,id,{table:'courses',id})));
 const actor=auditActor();statements.push(db().prepare("INSERT INTO audit(id,action,entity,detail,created,actor,institution,result) SELECT ?,'Criar versão de curso',?,?,?,?,?,'permitido' WHERE EXISTS(SELECT 1 FROM courses WHERE id=?)").bind(uid(),id,'Origem: '+c.id+'; versão '+label,t,actor.id,actor.institution,id));
 const result=await db().batch(statements);if(!result[0].meta.changes)throw Error('Esta versão já existe ou o curso foi alterado. Actualize a página.');
 return {id,versionLabel:label};
}
