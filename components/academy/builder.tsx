'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { UiText } from './complete/language';
import { PackagePanel } from './complete/packages';
import { AdvancedCourse, LearningExtras } from './complete/learning';
import { completion } from './complete/common';
import { useState,useRef } from 'react';
import { Plus, ArrowUp, ArrowDown, Copy, Layers, Save,GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CourseOverview, CourseProgramme } from './content';
import { AssessmentsPanel } from './assessments';
import { CourseSetup, F, type WorkspaceRequest } from './workspace';
import { courseModules, type Workspace, type Entry } from '@/lib/academy-workspace';
import { academyRequestId } from '@/lib/academy-client';
export function CourseBuilder({ detail, work, data, request, reload, refreshDetail, editCourse, editLesson, addLesson, transition, duplicate, busy }: {
    detail: any;
    work: Workspace;
    data: any;
    request: WorkspaceRequest;
    reload: () => Promise<any>;
    refreshDetail: () => Promise<any>;
    editCourse: () => void;
    editLesson: (lesson: any) => void;
    addLesson: (module: string) => void;
    transition: (state: string) => void;
    duplicate: () => void;
    busy: boolean;
}) {
    const [tab, setTab] = useState('dados'), [module, setModule] = useState<any>(null), [error, setError] = useState(''), [saving, setSaving] = useState(false);
    const course = detail.course, editable = course.status === 'rascunho' && detail.permissions?.edit !== false;
    const modules = courseModules(work, course.id);
    const [draggedModule,setDraggedModule]=useState<string|null>(null),orderLock=useRef(false);
    async function moveModule(id:string,targetId:string){
        if(!editable||busy||saving||orderLock.current||id===targetId)return;
        const next=modules.slice(),from=next.findIndex(m=>m.id===id),to=next.findIndex(m=>m.id===targetId);if(from<0||to<0)return;
        const [moved]=next.splice(from,1);next.splice(to,0,moved);orderLock.current=true;setSaving(true);setError('');
        try{await request({action:'module_order',courseId:course.id,modules:next.map(m=>({id:m.id,revision:m.revision}))});await reload();await refreshDetail();}
        catch(error:any){setError(error.message);await reload().catch(()=>{});}
        finally{orderLock.current=false;setSaving(false);setDraggedModule(null);}
    }
    async function saveModule(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(''); try {
        await request({ action: 'entry', id: module.id, kind: 'modulo', title: module.title, status: 'publicado', revision: module.revision || 0, body: { ...module.body, courseId: course.id } });
        await reload();
        await refreshDetail();
        setModule(null);
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setSaving(false);
    } }
    async function reorder(index: number, direction: number) { const ls = detail.lessons.slice(), target = index + direction; if (target < 0 || target >= ls.length)
        return; [ls[index], ls[target]] = [ls[target], ls[index]]; setSaving(true); setError(''); try {
        await request({ action: 'lesson_order', courseId: course.id, ids: ls.map((l: any) => l.id) });
        await refreshDetail();
        await reload();
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setSaving(false);
    } }
    const decisions: any = { rascunho: [['em_revisao', 'Submeter a revisão']], em_revisao: [['rascunho', 'Devolver para correcção'], ['aprovado', 'Aprovar conteúdo']], aprovado: [['publicado', 'Publicar na Academia']], publicado: [['arquivado', 'Arquivar']], arquivado: [] };
    return <div className="course-builder"><nav className="builder-tabs" aria-label={tr("Gest\u00E3o do curso")}>{tr([['dados', 'Dados gerais'], ['modulos', 'Módulos e aulas'], ['organizacao', 'Programa e notas'], ['avaliacoes', 'Avaliações'], ['actividades', 'Actividades e fórum'], ['regras', 'Disponibilidade e certificado'], ['revisao', 'Revisão e publicação'], ['resultados', 'Resultados']].filter(([id]) => (id !== 'resultados' || detail.permissions?.results !== false) && (id !== 'organizacao' || detail.permissions?.edit !== false)).map(([id, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setModule(null); setError(''); }}><UiText>{tr(label)}</UiText></button>))}</nav><p className="editor-error" role="alert">{tr(error)}</p>
 {tr(tab === 'dados' && <><div className="row between wrap"><span className={'badge ' + course.status}>{tr(course.status.replaceAll('_', ' '))}</span>{tr(editable && <Button variant="outline" onClick={editCourse}>{tr("Editar ficha e objectivos")}</Button>)}</div><CourseOverview summary={course.summary}/><div className="detail-facts"><span>{tr(course.hours ? course.hours + ' horas' : 'Carga horária por definir')}</span><span>{tr("Nota m\u00EDnima: ")}{tr(course.pass)}{tr("%")}</span><span>{tr("Vers\u00E3o ")}{tr(course.version)}</span></div>{tr(course.external && <p><a className="button-link" href={course.external} target="_blank" rel="noreferrer">{tr("Abrir o curso")}</a></p>)}</>)}
 {tr(tab === 'modulos' && <><div className="row between wrap"><h3>{tr("Estrutura do curso")}</h3>{tr(editable && <div className="row wrap"><Button variant="outline" onClick={() => setModule({ id: academyRequestId(), revision: 0, title: '', body: { position: modules.length } })}><Plus size={16}/>{tr("Adicionar m\u00F3dulo")}</Button><Button onClick={() => addLesson(modules[0]?.title || detail.lessons[0]?.module || '')}><Plus size={16}/>{tr("Adicionar aula")}</Button></div>)}</div>{tr(module && <form className="panel form" onSubmit={saveModule}><F label={tr("Nome do m\u00F3dulo")}><Input required value={module.title} onChange={e => setModule({ ...module, title: e.target.value })}/></F><F label={tr("Ordem do m\u00F3dulo")}><Input type="number" min={0} value={module.body.position || 0} onChange={e => setModule({ ...module, body: { ...module.body, position: Number(e.target.value) } })}/></F><F label={tr("Objectivos do m\u00F3dulo")}><Textarea value={module.body.objectives || ''} onChange={e => setModule({ ...module, body: { ...module.body, objectives: e.target.value } })}/></F><F label={tr("Dispon\u00EDvel a partir de (UTC)")}><Input type="datetime-local" value={module.body.availableAt?.slice(0, 16) || ''} onChange={e => setModule({ ...module, body: { ...module.body, availableAt: e.target.value ? e.target.value + ':00Z' : '' } })}/></F><F label={tr("M\u00F3dulos pr\u00E9vios obrigat\u00F3rios")}><select multiple value={module.body.prerequisiteModules || []} onChange={e => setModule({ ...module, body: { ...module.body, prerequisiteModules: Array.from(e.target.selectedOptions, o => o.value) } })}>{tr(modules.filter(m => m.id !== module.id).map(m => <option key={m.id} value={m.id}>{tr(m.title)}</option>))}</select></F><F label={tr("Notas do m\u00F3dulo")}><Textarea value={module.body.notes || ''} onChange={e => setModule({ ...module, body: { ...module.body, notes: e.target.value } })}/></F><div className="row"><Button type="submit" disabled={saving}>{tr("Guardar m\u00F3dulo")}</Button><Button variant="ghost" type="button" onClick={() => setModule(null)}>{tr("Fechar")}</Button></div></form>)}
 {tr(modules.map((m,index) => <section className="builder-module" key={m.id} aria-busy={saving} onDragOver={event=>{if(editable&&draggedModule){event.preventDefault();event.dataTransfer.dropEffect="move";}}} onDrop={event=>{event.preventDefault();if(draggedModule)void moveModule(draggedModule,m.id);}}><header>{editable&&<button type="button" className="module-drag-handle" draggable={!busy&&!saving} disabled={busy||saving} aria-label={tr("Mover módulo")+": "+m.title} onDragStart={event=>{event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",m.id);setDraggedModule(m.id);}} onDragEnd={()=>setDraggedModule(null)}><GripVertical size={18}/></button>}<div><span className="eyebrow">{tr("M\u00D3DULO")}</span><h3>{tr(m.title)}</h3></div>{tr(editable && <div className="row wrap"><Button variant="ghost" size="icon" disabled={busy||saving||index===0} aria-label={tr("Subir módulo")+": "+m.title} onClick={()=>void moveModule(m.id,modules[index-1].id)}><ArrowUp size={16}/></Button><Button variant="ghost" size="icon" disabled={busy||saving||index===modules.length-1} aria-label={tr("Descer módulo")+": "+m.title} onClick={()=>void moveModule(m.id,modules[index+1].id)}><ArrowDown size={16}/></Button><Button variant="outline" onClick={() => setModule(m)}>{tr("Editar m\u00F3dulo")}</Button><Button variant="outline" onClick={() => addLesson(m.title)}>{tr("Adicionar aula")}</Button></div>)}</header>{tr(m.body.objectives && <div><strong>{tr("Objectivos")}</strong><p className="workspace-prose">{tr(m.body.objectives)}</p></div>)}{tr(m.body.notes && <div><strong>{tr("Notas")}</strong><p className="workspace-prose">{tr(m.body.notes)}</p></div>)}<p>{tr(detail.lessons.filter((l: any) => l.module === m.title).length)}{tr(" aulas")}</p></section>))}
 <CourseProgramme lessons={detail.lessons} editable={editable} onEdit={editLesson} onAdd={addLesson}/>{tr(editable && detail.lessons.length > 1 && <section className="lesson-order"><h3>{tr("Ordem de leitura das aulas")}</h3>{tr(detail.lessons.map((l: any, i: number) => <div key={l.id}><span>{tr(i + 1)}{tr(". ")}{tr(l.module)}{tr(" \u00B7 ")}{tr(l.title)}</span><Button variant="ghost" size="icon" disabled={saving || i === 0} aria-label={tr('Subir aula ' + l.title)} onClick={() => reorder(i, -1)}><ArrowUp size={16}/></Button><Button variant="ghost" size="icon" disabled={saving || i === detail.lessons.length - 1} aria-label={tr('Descer aula ' + l.title)} onClick={() => reorder(i, 1)}><ArrowDown size={16}/></Button></div>))}</section>)}</>)}
 {tr(tab === 'organizacao' && detail.permissions?.edit !== false && <CourseSetup key={course.id} course={course} work={work} request={request} reload={reload}/>)}
 {tr(tab === 'avaliacoes' && <AssessmentsPanel readOnly={detail.permissions?.edit === false} work={work} data={data} request={request} reload={reload} courseId={course.id}/>)}
 {tr(tab === 'actividades' && <PackagePanel courseId={course.id} management lessons={detail.lessons}/>)}
 {tr(tab === 'actividades' && <LearningExtras management courseId={course.id} work={work} request={request} reload={reload}/>)}
 {tr(tab === 'regras' && <AdvancedCourse course={course} work={work} request={request} reload={reload} data={data}/>)}
 {tr(tab === 'revisao' && <><h3>{tr("Revis\u00E3o e publica\u00E7\u00E3o")}</h3><p>{tr("Estado actual: ")}<strong>{tr(course.status.replaceAll('_', ' '))}</strong>{tr(". As altera\u00E7\u00F5es a conte\u00FAdos publicados s\u00E3o preparadas numa nova c\u00F3pia em rascunho.")}</p><div className="row wrap">{tr(decisions[course.status]?.filter(([state]: string[]) => !detail.permissions || detail.permissions.transitions.includes(state)).map(([state, label]: string[]) => <Button key={state} disabled={busy} onClick={() => transition(state)}>{tr(label)}</Button>))}{tr(detail.permissions?.duplicate !== false && <Button variant="outline" disabled={busy} onClick={duplicate}><Copy size={16}/>{tr("Criar c\u00F3pia em rascunho")}</Button>)}</div><h3>{tr("Decis\u00F5es registadas")}</h3>{tr(editable && <button onClick={async () => { if (!confirm(tr('Retirar este rascunho para a lixeira?')))
        return; try {
        await completion({ action: 'course_trash', id: course.id });
        await reload();
        await refreshDetail();
    }
    catch (e: any) {
        setError(e.message);
    } }}>{tr("Retirar rascunho")}</button>)}{tr(detail.reviews.length ? detail.reviews.map((r: any) => <article className="feedback" key={r.id}><strong>{tr(r.decision.replaceAll('_', ' '))}</strong><p>{tr(r.comment)}</p><small>{tr(new Date(r.created).toLocaleString(getLocale()))}</small></article>) : <p>{tr("Ainda n\u00E3o existem decis\u00F5es registadas.")}</p>)}</>)}
 {tr(tab === 'resultados' && <><h3>{tr("Resultados do curso")}</h3><div className="workspace-table"><table><thead><tr><th>{tr("Participante")}</th><th>{tr("Aulas")}</th><th>{tr("Melhor nota")}</th><th>{tr("Conclus\u00E3o")}</th></tr></thead><tbody>{tr(data.enrollments.filter((e: any) => e.courseId === course.id).map((e: any) => <tr key={e.id}><td>{tr(e.participant)}</td><td>{tr(e.done)}{tr(" / ")}{tr(e.total)}</td><td>{tr(e.best === null ? 'Sem avaliação' : e.best + '%')}</td><td>{tr(e.eligible ? 'Concluído' : 'Em curso')}<button onClick={async () => { try {
        await completion({ action: 'course_approve', enrollmentId: e.id, approved: true, note: '' });
        await reload();
    }
    catch (err: any) {
        setError(err.message);
    } }}>{tr("Aprovar conclus\u00E3o")}</button></td></tr>))}</tbody></table></div>{tr(!data.enrollments.some((e: any) => e.courseId === course.id) && <p>{tr("Ainda n\u00E3o existem inscri\u00E7\u00F5es neste curso.")}</p>)}</>)}
 </div>;
}
