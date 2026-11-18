'use client';
import {useState} from 'react';
import {tr} from './complete/language';
import {nextCourseVersion} from '@/lib/academy-course-version-label';
export function ModuleReuse({course,work,data,busy,copy}:{course:any;work:any;data:any;busy:boolean;copy:(module:any)=>Promise<void>}){
 const [source,setSource]=useState(''),[selected,setSelected]=useState('');
 const modules=work.entries.filter((e:any)=>e.kind==='modulo'&&e.status==='publicado'&&e.body.courseId===source),chosen=modules.find((e:any)=>e.id===selected),included:any[]=[];
 function include(id:string){const item=modules.find((e:any)=>e.id===id);if(!item||included.some(e=>e.id===id))return;included.push(item);for(const ref of item.body.prerequisiteModules||[])include(ref);}
 if(chosen)include(chosen.id);
 return <fieldset disabled={busy} className="panel form"><legend>{tr('Reutilizar módulo publicado')}</legend><div className="form-grid"><label className="field">{tr('Curso de origem')}<select value={source} onChange={e=>{setSource(e.target.value);setSelected('');}}><option value="">{tr('Seleccione')}</option>{data.courses.filter((c:any)=>c.status==='publicado'&&c.id!==course.id).map((c:any)=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label className="field">{tr('Módulo')}<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{tr('Seleccione')}</option>{modules.map((m:any)=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label></div>{chosen&&<div><strong>{tr('Módulos incluídos')}</strong><ul>{included.map(m=><li key={m.id}>{m.title}</li>)}</ul></div>}<button type="button" disabled={!chosen} onClick={()=>void copy(chosen).then(()=>setSelected(''))}>{tr('Copiar módulos e aulas para este rascunho')}</button></fieldset>;
}
export function CourseVersions({course,work,data,busy,create}:{course:any;work:any;data:any;busy:boolean;create?:(bump:'major'|'minor')=>void}){
 const [bump,setBump]=useState<'major'|'minor'>('minor'),setup=work.entries.find((e:any)=>e.kind==='curso'&&e.id===course.id)?.body||{},current=setup.semanticVersion||course.version+'.0',root=setup.versionRoot||course.id;
 const family=data.courses.filter((c:any)=>c.id===root||work.entries.some((e:any)=>e.kind==='curso'&&e.id===c.id&&e.body.versionRoot===root));
 return <section className="panel form"><h3>{tr('Versões do curso')}</h3><ul>{family.map((c:any)=>{const meta=work.entries.find((e:any)=>e.kind==='curso'&&e.id===c.id)?.body;return <li key={c.id}>{meta?.semanticVersion||c.version+'.0'} · {tr(c.status.replaceAll('_',' '))}{c.id===course.id?' · '+tr('Versão actual'):''}</li>;})}</ul>{create&&<fieldset disabled={busy}><label className="field">{tr('Nova versão')}<select value={bump} onChange={e=>setBump(e.target.value as 'major'|'minor')}><option value="minor">{nextCourseVersion(current,'minor')}</option><option value="major">{nextCourseVersion(current,'major')}</option></select></label><button type="button" onClick={()=>create(bump)}>{tr('Criar versão em rascunho')}</button></fieldset>}</section>;
}
