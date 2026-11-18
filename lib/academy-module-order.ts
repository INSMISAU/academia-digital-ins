import {db,all,now,uid} from '@/db/store';
import {auditActor} from '@/db/actor';
import {fail} from '@/lib/academy/core';
export async function reorderModules(courseId:string,raw:unknown){
 if(!Array.isArray(raw)||!raw.length||raw.length>100||raw.some(r=>!r||typeof r.id!=='string'||!r.id||r.id.length>100||!Number.isSafeInteger(r.revision)||r.revision<1)||new Set(raw.map(r=>r.id)).size!==raw.length)fail('Seleccione uma ordem de módulos válida.');
 const requested=raw.map(r=>({id:r.id,revision:r.revision})),json=JSON.stringify(requested),time=now();
 const scope="kind='modulo' AND status NOT IN ('arquivado','lixo') AND json_extract(payload,'$.courseId')=?";
 const prefix="WITH requested AS (SELECT json_extract(value,'$.id') id,json_extract(value,'$.revision') revision,CAST(key AS INTEGER) position FROM json_each(?)) ";
 const guard="EXISTS(SELECT 1 FROM courses WHERE id=? AND status='rascunho') AND (SELECT COUNT(*) FROM academy_entries WHERE "+scope+")=? AND NOT EXISTS(SELECT 1 FROM requested r LEFT JOIN academy_entries e ON e.id=r.id AND e.kind='modulo' AND e.status NOT IN ('arquivado','lixo') AND json_extract(e.payload,'$.courseId')=? WHERE e.id IS NULL OR e.revision<>r.revision)";
 const args=[courseId,courseId,requested.length,courseId],actor=auditActor();
 const history=db().prepare(prefix+"INSERT OR IGNORE INTO academy_entry_history(entryId,revision,payload,created) SELECT id,revision,json_object('id',id,'kind',kind,'title',title,'status',status,'body',json(payload),'revision',revision,'created',created,'updated',updated),? FROM academy_entries WHERE "+scope+' AND '+guard).bind(json,time,courseId,...args);
 const update=db().prepare(prefix+"UPDATE academy_entries AS target SET payload=json_set(payload,'$.position',(SELECT position FROM requested WHERE requested.id=target.id)),revision=revision+1,updated=? WHERE "+scope+' AND '+guard).bind(json,time,courseId,...args);
 const auditId=uid(),audit=db().prepare("INSERT INTO audit(id,action,entity,detail,created,actor,institution,result) SELECT ?,?,?,?,?,?,?,'permitido' WHERE changes()>0").bind(auditId,'Ordenar módulos',courseId,requested.length+' módulos',time,actor.id,actor.institution);
 const lessons=db().prepare(prefix+", ordered AS (SELECT l.id,ROW_NUMBER() OVER(ORDER BY COALESCE((SELECT r.position FROM requested r JOIN academy_entries m ON m.id=r.id WHERE m.title=l.module),?),l.position,l.id)-1 position FROM lessons l WHERE l.courseId=?) UPDATE lessons AS target SET position=(SELECT position FROM ordered WHERE ordered.id=target.id) WHERE courseId=? AND EXISTS(SELECT 1 FROM audit WHERE id=?)").bind(json,requested.length,courseId,courseId,auditId);
 const result=await db().batch([history,update,audit,lessons]);
 if(result[1].meta.changes!==requested.length||!requested.length)fail('Os módulos foram alterados noutra sessão. Actualize o curso antes de ordenar.',409);
 return {ok:true,modules:await all('SELECT id,revision FROM academy_entries WHERE '+scope,courseId)};
}
