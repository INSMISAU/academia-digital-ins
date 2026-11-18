import {db,one,all,now,uid,text,integer,url,dateTime,ids,list,slug,fail,actor,audit} from './core';
import {encodeLesson,lessonContent} from '@/lib/academy-content';
import {scopeStatements} from '@/lib/academy-roles';
function editorialBlocks(raw:unknown){try{return encodeLesson(lessonContent(raw));}catch(e){fail(e instanceof Error?e.message:'Conteúdo inválido.');}}
export const editorialKinds=['noticia','evento','anuncio'];
export async function cleanEditorial(kind:string,v:any,status:string){
 const b:any={description:text(v.description,20000),category:text(v.category,120),tags:text(v.tags,500),imageUrl:url(v.imageUrl),imageId:text(v.imageId,100),imageAlt:text(v.imageAlt,500),imageCredit:text(v.imageCredit,500),slug:slug(v.slug||v.title),author:text(v.author,200),seoTitle:text(v.seoTitle,70),seoDescription:text(v.seoDescription,170),visibility:v.visibility==='privado'?'privado':'publico',publishAt:dateTime(v.publishAt),expiresAt:dateTime(v.expiresAt),blocks:v.blocks?editorialBlocks(v.blocks):''};
 if(b.imageId&&!await one('SELECT mediaId FROM academy_media_details WHERE mediaId=?',b.imageId))fail('Imagem não encontrada.');
 if(['publicado','agendado','em_revisao'].includes(status)&&(!b.description&&!b.blocks))fail('Adicione o conteúdo da publicação.');
 if(b.expiresAt&&b.publishAt&&b.expiresAt<=b.publishAt)fail('O fim da publicação deve ser posterior ao início.');
 if(status==='agendado'&&(!b.publishAt||b.publishAt<=now()))fail('Seleccione uma data futura para publicar.');
 if(kind==='evento'){
  Object.assign(b,{eventType:text(v.eventType,100),format:['presencial','online','hibrido'].includes(v.format)?v.format:'presencial',start:dateTime(v.start),end:dateTime(v.end),allDay:v.allDay===true,date:text(v.date,10),ends:text(v.ends,10),location:text(v.location,500),url:url(v.url),joinUrl:url(v.joinUrl),joinCode:text(v.joinCode,200),organiser:text(v.organiser,200),contact:text(v.contact,300),speakers:text(v.speakers,5000),programme:text(v.programme,12000),eventState:['activo','adiado','cancelado','concluido'].includes(v.eventState)?v.eventState:'activo',registrationOpen:v.registrationOpen===true,approval:v.approval===true,capacity:integer(v.capacity,0,100000),registrationStarts:dateTime(v.registrationStarts),registrationEnds:dateTime(v.registrationEnds),sessions:list(v.sessions,100).map(s=>({id:text(s.id,100,true),title:text(s.title,200,true),start:dateTime(s.start,true),end:dateTime(s.end,true)}))});
  if(!b.start&&b.date)b.start=dateTime(b.date+'T00:00:00+02:00');if(!b.end&&b.ends)b.end=dateTime(b.ends+'T23:59:59+02:00');
  if(b.start)b.date=new Date(Date.parse(b.start)+7200000).toISOString().slice(0,10);if(b.end)b.ends=new Date(Date.parse(b.end)+7200000).toISOString().slice(0,10);
  if(b.end&&b.start>=b.end||b.registrationStarts&&b.registrationEnds&&b.registrationStarts>=b.registrationEnds)fail('Verifique as datas do evento e das inscrições.');
  if(b.sessions.some((s:any)=>s.start>=s.end||b.start&&s.start<b.start||b.end&&s.end>b.end)||new Set(b.sessions.map((s:any)=>s.id)).size!==b.sessions.length)fail('Verifique as sessões do evento.');
  if(['publicado','agendado'].includes(status)&&!b.start)fail('Indique o início do evento.');
 }
 return b;
}
export function publicEditorial(e:any){const {joinUrl,joinCode,contact,...b}=e.body;return {...e,body:b};}
export async function visibleEntries(entries:any[],admin:boolean){
 if(admin)return entries;
 const pubs=await all('SELECT entryId,payload FROM academy_editorial_publications');const map=new Map(pubs.map(r=>[r.entryId,JSON.parse(r.payload)]));
 return entries.map(e=>editorialKinds.includes(e.kind)?map.get(e.id)||e:e).filter(e=>e.status==='publicado'&&e.body.visibility!=='privado'&&(!e.body.expiresAt||e.body.expiresAt>now())).map(e=>editorialKinds.includes(e.kind)?publicEditorial(e):e);
}
export async function saveEditorial(v:any){
 const id=text(v.id,100)||uid(),kind=text(v.kind,30,true);if(!editorialKinds.includes(kind))fail('Tipo de publicação inválido.');
 const old=await one('SELECT * FROM academy_entries WHERE id=?',id),revision=integer(v.revision),status=['rascunho','em_revisao','publicado','agendado','arquivado','lixo'].includes(v.status)?v.status:'rascunho';
 if(old&&(old.kind!==kind||old.revision!==revision)||!old&&revision)fail('O registo mudou noutra sessão. Reabra-o antes de guardar.',409);
 const title=text(v.title,200,true),b=await cleanEditorial(kind,{...v.body,title},status),t=now(),entry={id,kind,title,status,body:b,revision:revision+1,created:old?.created||t,updated:t};
 const clash=await one("SELECT id FROM academy_entries WHERE id<>? AND kind IN ('noticia','evento','anuncio') AND json_extract(payload,'$.slug')=?",id,b.slug);
 if(clash||await one('SELECT entryId FROM academy_slug_redirects WHERE slug=? AND entryId<>?',b.slug,id))fail('Este endereço já está em uso.');
 const statements:any[]=[];
 if(old)statements.push(db().prepare('INSERT OR IGNORE INTO academy_entry_history(entryId,revision,payload,created) VALUES(?,?,?,?)').bind(id,revision,JSON.stringify({...old,body:JSON.parse(old.payload),payload:undefined}),t));
 // The unique slug in publications reserves addresses atomically on publication.
 if(old?.status==='publicado'&&!await one('SELECT entryId FROM academy_editorial_publications WHERE entryId=?',id)){
  const previous={...old,body:JSON.parse(old.payload),payload:undefined};statements.push(db().prepare('INSERT INTO academy_editorial_publications(entryId,slug,payload,revision,published) VALUES(?,?,?,?,?)').bind(id,previous.body.slug||id,JSON.stringify(previous),old.revision,t));
 }
 statements.push(db().prepare('INSERT INTO academy_entries(id,kind,title,status,payload,revision,created,updated) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,status=excluded.status,payload=excluded.payload,revision=excluded.revision,updated=excluded.updated WHERE academy_entries.revision=?').bind(id,kind,title,status,JSON.stringify(b),revision+1,entry.created,t,revision));
 const mutationIndex=statements.length-1;
 if(status==='publicado'){
  statements.push(db().prepare('INSERT OR IGNORE INTO academy_slug_redirects(slug,entryId,created) SELECT slug,entryId,? FROM academy_editorial_publications WHERE entryId=? AND slug<>? AND EXISTS(SELECT 1 FROM academy_entries WHERE id=? AND revision=? AND updated=?)').bind(t,id,b.slug,id,revision+1,t));
  statements.push(db().prepare('INSERT INTO academy_editorial_publications(entryId,slug,payload,revision,published) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM academy_entries WHERE id=? AND revision=? AND updated=?) ON CONFLICT(entryId) DO UPDATE SET slug=excluded.slug,payload=excluded.payload,revision=excluded.revision,published=excluded.published').bind(id,b.slug,JSON.stringify(entry),revision+1,t,id,revision+1,t));
 }else if(['arquivado','lixo'].includes(status))statements.push(db().prepare('DELETE FROM academy_editorial_publications WHERE entryId=? AND EXISTS(SELECT 1 FROM academy_entries WHERE id=? AND revision=? AND updated=?)').bind(id,id,revision+1,t));
 statements.push(...scopeStatements('entry',id,''));const result=await db().batch(statements);if(!result[mutationIndex].meta.changes)fail('O registo mudou noutra sessão.',409);
 await audit('Guardar '+kind,id,status+'; revisão '+entry.revision);return {entry};
}
export async function editorialAction(b:any){
 const r=await one('SELECT * FROM academy_entries WHERE id=?',text(b.id,100,true));if(!r||!editorialKinds.includes(r.kind))fail('Publicação não encontrada.',404);
 if(b.action==='editorial_restore'){const h=await one('SELECT payload FROM academy_entry_history WHERE entryId=? AND revision=?',r.id,integer(b.fromRevision));if(!h)fail('Revisão não encontrada.',404);const previous=JSON.parse(h.payload);return saveEditorial({...previous,id:r.id,revision:integer(b.revision),status:'rascunho'});}
 if(b.action==='editorial_duplicate'){const v=JSON.parse(r.payload);return saveEditorial({kind:r.kind,title:r.title,body:{...v,slug:v.slug+'-'+uid().slice(0,6),publishAt:'',registrationOpen:false},status:'rascunho'});}
 fail('Operação inválida.');
}
export async function publishScheduled(){
 const rows=await all("SELECT * FROM academy_entries WHERE status='agendado' AND json_extract(payload,'$.publishAt')<=?",now());let count=0;
 for(const r of rows){await saveEditorial({...r,body:JSON.parse(r.payload),status:'publicado'});count++;}return count;
}
