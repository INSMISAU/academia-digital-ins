import {auditActor} from '@/db/actor';
import {db,one,all,uid,now} from '@/db/store';
import {fail} from '@/lib/academy/core';
import {scopeStatements} from '@/lib/academy-roles';
export async function reuseModule(b:any){
 const source=await one('SELECT * FROM courses WHERE id=?',b.sourceCourseId),target=await one('SELECT * FROM courses WHERE id=?',b.courseId);
 if(!source||source.status!=='publicado'||!target||target.status!=='rascunho'||source.id===target.id)fail('Seleccione um módulo publicado e um curso de destino em rascunho.');
 const rows=await all("SELECT * FROM academy_entries WHERE kind='modulo' AND status='publicado' AND json_extract(payload,'$.courseId')=?",source.id),byId=new Map(rows.map(r=>[r.id,r])),chosen=byId.get(b.moduleId);
 if(!chosen||chosen.revision!==b.revision)fail('O módulo foi alterado. Actualize a selecção.',409);
 const selected:any[]=[],visiting=new Set<string>(),visited=new Set<string>();
 function visit(id:string){if(visited.has(id))return;if(visiting.has(id))fail('Os pré-requisitos dos módulos não podem formar um ciclo.');const r=byId.get(id);if(!r)fail('Um pré-requisito do módulo não está disponível.');visiting.add(id);for(const ref of JSON.parse(r.payload).prerequisiteModules||[])visit(ref);visiting.delete(id);visited.add(id);selected.push(r);}
 visit(chosen.id);if(selected.length>50)fail('Seleccione um conjunto de até 50 módulos.');
 const existing=await all("SELECT id,title,payload,revision FROM academy_entries WHERE kind='modulo' AND status<>'arquivado' AND json_extract(payload,'$.courseId')=?",target.id);
 if(selected.some(r=>existing.some(e=>e.title.trim().toLocaleLowerCase('pt')===r.title.trim().toLocaleLowerCase('pt'))))fail('Já existe no destino um módulo com este título.');
 const lessons=await all('SELECT * FROM lessons WHERE courseId=? ORDER BY position',source.id),last=await one('SELECT COALESCE(MAX(position),-1) n FROM lessons WHERE courseId=?',target.id),mapping=new Map(selected.map(r=>[r.id,uid()])),t=now();
 const guard=`EXISTS(SELECT 1 FROM courses WHERE id=? AND status='rascunho' AND updated=?) AND EXISTS(SELECT 1 FROM courses WHERE id=? AND status='publicado' AND updated=?) AND (SELECT COALESCE(MAX(position),-1) FROM lessons WHERE courseId=?)=? AND (SELECT COUNT(*) FROM academy_entries e JOIN json_each(?) r ON e.id=json_extract(r.value,'$.id') AND e.revision=json_extract(r.value,'$.revision'))=? AND (SELECT COUNT(*) FROM academy_entries WHERE kind='modulo' AND status<>'arquivado' AND json_extract(payload,'$.courseId')=?)=? AND (SELECT COUNT(*) FROM academy_entries e JOIN json_each(?) x ON e.id=json_extract(x.value,'$.id') AND e.revision=json_extract(x.value,'$.revision'))=?`;
 const args=[target.id,target.updated,source.id,source.updated,target.id,last.n,JSON.stringify(selected.map(r=>({id:r.id,revision:r.revision}))),selected.length,target.id,existing.length,JSON.stringify(existing),existing.length];
 const statements:any[]=[];
 const anchor=mapping.get(selected[0].id)!;const accepted=`EXISTS(SELECT 1 FROM academy_entries WHERE id=? AND created=?)`;
 let position=Math.max(-1,...existing.map(r=>Number(JSON.parse(r.payload).position)||0))+1,lessonPosition=last.n+1;
 for(const r of selected){const body={...JSON.parse(r.payload),courseId:target.id,position:position++};body.prerequisiteModules=(body.prerequisiteModules||[]).map((id:string)=>mapping.get(id));const id=mapping.get(r.id)!;
  statements.push(db().prepare(`INSERT INTO academy_entries(id,kind,title,status,payload,revision,created,updated) SELECT ?,'modulo',?,'publicado',?,1,?,? WHERE ${statements.length===0?guard:accepted}`).bind(id,r.title,JSON.stringify(body),t,t,...(statements.length===0?args:[anchor,t])));
  for(const l of lessons.filter(l=>l.module===r.title))statements.push(db().prepare(`INSERT INTO lessons(id,courseId,module,title,body,position) SELECT ?,?,?,?,?,? WHERE ${accepted}`).bind(uid(),target.id,l.module,l.title,l.body,lessonPosition++,anchor,t));
 }
 statements.push(db().prepare(`UPDATE courses SET updated=? WHERE id=? AND ${accepted}`).bind(t,target.id,anchor,t));
 statements.push(...selected.flatMap(r=>scopeStatements('entry',mapping.get(r.id)!,target.id,{table:'academy_entries',id:anchor})));
 const actor=auditActor();statements.push(db().prepare("INSERT INTO audit(id,action,entity,detail,created,actor,institution,result) SELECT ?,'Reutilizar módulos',?,?,?,?,?,'permitido' WHERE EXISTS(SELECT 1 FROM academy_entries WHERE id=?)").bind(uid(),target.id,'Origem: '+source.id+'; '+selected.length+' módulos',t,actor.id,actor.institution,anchor));
 const result=await db().batch(statements);if(!result[0].meta.changes)fail('O curso foi alterado noutra sessão. Actualize a lista.',409);
 return {modules:selected.length,lessons:lessonPosition-last.n-1};
}
