import {db,now,uid} from '@/db/store';
import {auditActor} from '@/db/actor';
import {fail} from '@/lib/academy/core';
export async function editorialBulk(b:any){
 if(!['noticia','anuncio'].includes(b.kind)||!['em_revisao','arquivado'].includes(b.status)||!Array.isArray(b.items)||!b.items.length||b.items.length>50)fail('Seleccione entre 1 e 50 publicações e uma acção válida.');
 if(b.items.some((v:any)=>typeof v.id!=='string'||!v.id||!Number.isSafeInteger(v.revision)||v.revision<1)||new Set(b.items.map((v:any)=>v.id)).size!==b.items.length)fail('Selecção inválida.');
 const items=JSON.stringify(b.items),t=now();
 const valid=`WITH requested AS (SELECT json_extract(value,'$.id') id,json_extract(value,'$.revision') revision FROM json_each(?)), valid AS (SELECT COUNT(*) n FROM academy_entries e JOIN requested r ON r.id=e.id AND r.revision=e.revision WHERE e.kind=? AND e.status NOT IN ('lixo','arquivado')) `;
 const guard='(SELECT n FROM valid)=(SELECT COUNT(*) FROM requested)';
 const history=db().prepare(valid+`INSERT OR IGNORE INTO academy_entry_history(entryId,revision,payload,created) SELECT e.id,e.revision,json_object('id',e.id,'kind',e.kind,'title',e.title,'status',e.status,'body',json(e.payload),'revision',e.revision,'created',e.created,'updated',e.updated),? FROM academy_entries e WHERE e.id IN (SELECT id FROM requested) AND ${guard}`).bind(items,b.kind,t);
 const update=db().prepare(valid+`UPDATE academy_entries SET status=?,revision=revision+1,updated=? WHERE id IN (SELECT id FROM requested) AND ${guard}`).bind(items,b.kind,b.status,t);
 // Reviewing keeps the last public snapshot. Archiving withdraws it explicitly.
 const statements=[history];
 if(b.status==='em_revisao')statements.push(db().prepare(valid+`INSERT OR IGNORE INTO academy_editorial_publications(entryId,slug,payload,revision,published) SELECT e.id,COALESCE(json_extract(e.payload,'$.slug'),e.id),json_object('id',e.id,'kind',e.kind,'title',e.title,'status',e.status,'body',json(e.payload),'revision',e.revision,'created',e.created,'updated',e.updated),e.revision,? FROM academy_entries e WHERE e.id IN (SELECT id FROM requested) AND e.status='publicado' AND ${guard}`).bind(items,b.kind,t));
 const updateIndex=statements.length;statements.push(update);
 const actor=auditActor();statements.push(db().prepare("INSERT INTO audit(id,action,entity,detail,created,actor,institution,result) SELECT ?,'Acção editorial em lote',?,?,?,?,?,'permitido' WHERE changes()=?").bind(uid(),b.kind,b.status+'; '+b.items.map((v:any)=>v.id).join(', '),t,actor.id,actor.institution,b.items.length));
 if(b.status==='arquivado')statements.push(db().prepare(`DELETE FROM academy_editorial_publications WHERE entryId IN (SELECT e.id FROM academy_entries e JOIN json_each(?) r ON json_extract(r.value,'$.id')=e.id AND json_extract(r.value,'$.revision')+1=e.revision WHERE e.updated=? AND e.status='arquivado')`).bind(items,t));
 const result=await db().batch(statements);if(result[updateIndex].meta.changes!==b.items.length)fail('A selecção foi alterada noutra sessão. Actualize a lista e tente novamente.',409);
 return {changed:b.items.length};
}
