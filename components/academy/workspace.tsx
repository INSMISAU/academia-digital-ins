'use client';
import {ContentManagement} from './content-management';
import {emptyContentFilters,filterContent} from '@/lib/academy-content-management';
import {AcademyImage} from './image';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { UiText } from './complete/language';
import { EditorialEditor } from './complete/editorial';
import { EventPanel } from './complete/events';
import { ImageField, ImageUrl } from './complete/common';
import { LessonContent } from './content';
import { academyFetch } from '@/lib/academy-client';
import { useState } from 'react';
import { academyEbook, EbookResource } from '@/components/academy/portal';
import { Plus, ArrowRight, BookOpen, Calendar, Users, FileText, BarChart3, Settings2, Search, Download, Save, History, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { entriesOf, courseSetup, kindNames, normalise, parseCSV, provinces, type Workspace, type Entry, type EntryKind } from '@/lib/academy-workspace';
import { academyUrl, academyOrigin, academyRequestId } from '@/lib/academy-client';
import { downloadRows } from '@/lib/academy-export';
export type WorkspaceRequest = (body?: any, path?: string) => Promise<any>;
type Props = {
    work: Workspace;
    data: any;
    request: WorkspaceRequest;
    reload: () => Promise<any>;
    navigate: (id: string) => void;
};
const labels: Record<string, string> = { programa: 'Programas', formador: 'Formadores', categoria: 'Categorias', recurso: 'Biblioteca digital', noticia: 'Notícias', evento: 'Eventos', anuncio: 'Anúncios' };
const date = (v: string) => v ? new Date(v).toLocaleDateString(getLocale()) : '';
export function F({ label, children }: {
    label: string;
    children: React.ReactNode;
}) { return <label className="field"><span><UiText>{tr(label)}</UiText></span>{tr(children)}</label>; }
export function NoRecords({ children }: {
    children: React.ReactNode;
}) { return <div className="workspace-empty"><FileText size={28}/><p>{tr(children)}</p></div>; }
export function Heading({ title, text, children }: {
    title: string;
    text?: string;
    children?: React.ReactNode;
}) { return <div className="page-heading"><div><span className="eyebrow">{tr("ACADEMIA DIGITAL DO INS")}</span><h1><UiText>{tr(title)}</UiText></h1>{tr(text && <p>{tr(text)}</p>)}</div>{tr(children)}</div>; }
function Notice({ error, success }: {
    error?: string;
    success?: string;
}) { return <div aria-live="polite">{tr(error && <p className="editor-error" role="alert">{tr(error)}</p>)}{tr(success && <p className="workspace-success">{tr(success)}</p>)}</div>; }
const published = (e: Entry) => e.status === 'publicado';
export function resourceUrl(e: Entry) { return e.body.fileId ? academyOrigin + '/api/resource/' + encodeURIComponent(e.id) : e.body.url; }
export function EntryEditor({ value, data, onSave }: {
    value: Entry;
    data: any;
    onSave: (body: any) => Promise<void>;
}) {
    const [form, setForm] = useState({ ...value, body: { ...value.body } }), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const update = (key: string, v: any) => setForm({ ...form, body: { ...form.body, [key]: v } });
    return <form className="form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
        await onSave({ ...form, action: 'entry' });
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }}>
  <F label={tr(form.kind === 'formador' ? 'Nome do formador' : 'Título')}><Input required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></F>
  <F label={tr(form.kind === 'formador' ? 'Apresentação profissional' : 'Descrição / conteúdo')}><Textarea rows={6} value={form.body.description || ''} onChange={e => update('description', e.target.value)}/></F>
  {tr(form.kind === 'formador' && <div className="form-grid"><F label={tr("Institui\u00E7\u00E3o")}><Input value={form.body.institution || ''} onChange={e => update('institution', e.target.value)}/></F><F label={tr("Especialidade / \u00E1rea")}><Input value={form.body.specialty || ''} onChange={e => update('specialty', e.target.value)}/></F></div>)}
  {tr(form.kind === 'evento' && <><div className="form-grid"><F label={tr("Data de in\u00EDcio")}><Input required type="date" value={form.body.date || ''} onChange={e => update('date', e.target.value)}/></F><F label={tr("Data de fim")}><Input type="date" value={form.body.ends || ''} onChange={e => update('ends', e.target.value)}/></F></div><F label={tr("Local / modalidade")}><Input value={form.body.location || ''} onChange={e => update('location', e.target.value)}/></F><F label={tr("Liga\u00E7\u00E3o de participa\u00E7\u00E3o")}><Input type="url" value={form.body.url || ''} onChange={e => update('url', e.target.value)}/></F></>)}
  {tr(form.kind === 'recurso' ? <><F label={tr("Ficheiro da biblioteca de materiais")}><select value={form.body.fileId || ''} onChange={e => update('fileId', e.target.value)}><option value="">{tr("Usar uma liga\u00E7\u00E3o externa")}</option>{tr(data.media.map((m: any) => <option key={m.id} value={m.id}>{tr(m.name)}</option>))}</select></F>{tr(!form.body.fileId && <F label={tr("Liga\u00E7\u00E3o p\u00FAblica HTTPS")}><Input required type="url" value={form.body.url || ''} onChange={e => update('url', e.target.value)}/></F>)}<div className="form-grid"><F label={tr("Tipo de material")}><select required value={form.body.type || 'manual'} onChange={e => update('type', e.target.value)}>{tr(['manual', 'artigo', 'publicação', 'vídeo', 'apresentação', 'norma', 'guia', 'material educativo'].map(t => <option key={t} value={t}>{tr(t)}</option>))}</select></F><F label={tr("Fonte / autoria")}><Input value={form.body.source || ''} onChange={e => update('source', e.target.value)}/></F></div></> : <F label={tr("Imagem / fotografia (liga\u00E7\u00E3o HTTPS)")}><Input type="url" value={form.body.imageUrl || ''} onChange={e => update('imageUrl', e.target.value)}/></F>)}
  {tr(form.kind === 'formador' && <ImageField purpose="formador" value={form.body} onChange={v => setForm({ ...form, body: v })}/>)}
  {tr(form.kind === 'recurso' && <><F label={tr("Disponibilidade")}><select value={form.body.visibility || 'publico'} onChange={e => update('visibility', e.target.value)}><option value="publico">{tr("P\u00FAblico")}</option><option value="inscritos">{tr("Inscritos num curso")}</option></select></F>{tr(form.body.visibility === 'inscritos' && <F label={tr("Curso")}><select value={form.body.courseId || ''} onChange={e => update('courseId', e.target.value)}><option value="">{tr("Seleccione")}</option>{tr(data.courses.map((c: any) => <option key={c.id} value={c.id}>{tr(c.title)}</option>))}</select></F>)}<label><input type="checkbox" checked={form.body.allowDownload !== false} onChange={e => update('allowDownload', e.target.checked)}/>{tr("Disponibilizar descarga")}</label></>)}
  <div className="form-grid"><F label={tr("Categoria / \u00E1rea")}><Input value={form.body.category || ''} onChange={e => update('category', e.target.value)}/></F><F label={tr("Etiquetas (separadas por v\u00EDrgula)")}><Input value={form.body.tags || ''} onChange={e => update('tags', e.target.value)}/></F></div>
  <F label={tr("Estado")}><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Entry['status'] })}><option value="rascunho">{tr("Rascunho")}</option><option value="publicado">{tr("Publicado")}</option><option value="arquivado">{tr("Arquivado")}</option></select></F>
  <Notice error={error}/><Button disabled={busy} type="submit"><Save size={17}/>{tr(busy ? 'A guardar…' : 'Guardar')}</Button>
 </form>;
}
function HistoricalEntry({ payload }: {
    payload: string;
}) {
    const value = JSON.parse(payload) as Entry;
    const fields: Record<string, string> = { description: 'Descrição / conteúdo', institution: 'Instituição', specialty: 'Especialidade / área', date: 'Data de início', ends: 'Data de fim', location: 'Local / modalidade', url: 'Ligação', imageUrl: 'Imagem / fotografia', category: 'Categoria / área', tags: 'Etiquetas', type: 'Tipo de material', source: 'Fonte / autoria' };
    return <div className="workspace-prose"><h4>{tr(value.title)}</h4><p>{tr("Estado: ")}{tr(value.status === 'publicado' ? 'Publicado' : value.status === 'arquivado' ? 'Arquivado' : value.status.replaceAll('_', ' '))}</p><dl>{tr(Object.entries(fields).filter(([key]) => value.body[key]).map(([key, label]) => <div key={key}><dt><strong>{tr(label)}</strong></dt><dd style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{tr(String(value.body[key]))}</dd></div>))}</dl></div>;
}
export function RecordsPanel({ kind, work, data, request, reload }: Props & {
    kind: EntryKind;
}) {
    const [search, setSearch] = useState(''), [state, setState] = useState('activos'), [editing, setEditing] = useState<Entry | null>(null), [history, setHistory] = useState<any[] | null>(null), [error, setError] = useState('');
    const [filters,setFilters]=useState(emptyContentFilters),[selected,setSelected]=useState<string[]>([]),[bulkBusy,setBulkBusy]=useState(false),[success,setSuccess]=useState('');
    const managed=['noticia','anuncio'].includes(kind);
    const resetFilters=(next:typeof filters)=>{setFilters(next);setSelected([]);};
    async function applyBulk(status:string){if(bulkBusy||!selected.length)return;if(!confirm(tr(status==='arquivado'?'Arquivar as publicações seleccionadas?':'Enviar as publicações seleccionadas para revisão?')))return;setBulkBusy(true);setError('');setSuccess('');try{await request({action:'editorial_bulk',kind,status,items:work.entries.filter(e=>selected.includes(e.id)).map(e=>({id:e.id,revision:e.revision}))});setSelected([]);await reload();setSuccess('Operação concluída.');}catch(e:any){setError(e.message);setSelected([]);await reload().catch(()=>{});}finally{setBulkBusy(false);}}
    if (editing && ['noticia', 'evento', 'anuncio'].includes(kind))
        return <EditorialEditor key={editing.id} value={editing} close={() => setEditing(null)} save={async (b) => { const r = await request(b); await reload(); return r; }}/>;
    const records = filterContent(work.entries.filter(e => e.kind === kind && (state === 'todos' || state === 'activos' && !['arquivado', 'lixo'].includes(e.status) || e.status === state) && normalise([e.title, e.body.description, e.body.tags].join(' ')).includes(normalise(search))),managed?filters:emptyContentFilters);
    return <><Heading title={tr(labels[kind] || kindNames[kind])} text={tr("Prepare os registos e publique apenas as informa\u00E7\u00F5es aprovadas.")}><Button onClick={() => setEditing({ id: academyRequestId(), kind, title: '', status: 'rascunho', body: kind === 'recurso' ? { type: 'manual' } : {}, revision: 0, created: '', updated: '' })}><Plus size={17}/>{tr("Adicionar ")}{tr(kindNames[kind].toLocaleLowerCase('pt'))}</Button></Heading>
 <div className="workspace-filter"><F label={tr("Pesquisar")}><Input type="search" value={search} onChange={e => {setSearch(e.target.value);setSelected([]);}}/></F><F label={tr("Estado")}><select value={state} onChange={e => {setState(e.target.value);setSelected([]);}}><option value="activos">{tr("Em prepara\u00E7\u00E3o e publicados")}</option><option value="rascunho">{tr("Rascunhos")}</option><option value="publicado">{tr("Publicados")}</option><option value="arquivado">{tr("Arquivados")}</option><option value="em_revisao">{tr("Em revis\u00E3o")}</option><option value="agendado">{tr("Agendados")}</option><option value="lixo">{tr("Lixeira")}</option><option value="todos">{tr("Todos")}</option></select></F></div>
 <Notice error={error} success={success}/>{managed&&<ContentManagement entries={work.entries.filter(e=>e.kind===kind)} filters={filters} change={resetFilters} items={records} selected={selected.filter(id=>records.some(e=>e.id===id))} select={setSelected} busy={bulkBusy} apply={applyBulk}/>}<div className="workspace-records">{tr(records.map(e => <article className="panel workspace-record" key={e.id}>{managed&&!['arquivado','lixo'].includes(e.status)&&<label><input type="checkbox" disabled={bulkBusy||!selected.includes(e.id)&&selected.length>=50} checked={selected.includes(e.id)} onChange={event=>setSelected(event.target.checked?[...selected,e.id]:selected.filter(id=>id!==e.id))}/>{tr('Seleccionar')} {e.title}</label>}<span className={'badge ' + e.status}>{tr(e.status === 'publicado' ? 'Publicado' : e.status === 'arquivado' ? 'Arquivado' : e.status.replaceAll('_', ' '))}</span><h2>{tr(e.title)}</h2><p>{tr(e.body.description?.slice(0, 220))}</p><small>{tr("Vers\u00E3o ")}{tr(e.revision)}{tr(" \u00B7 ")}{tr(date(e.updated))}</small><div className="row wrap"><Button variant="outline" onClick={() => setEditing(e)}>{tr("Editar")}</Button><Button variant="ghost" onClick={async () => { try {
        const r = await request(undefined, '/api/workspace?history=' + encodeURIComponent(e.id));
        setHistory(r.history);
    }
    catch (e: any) {
        setError(e.message);
    } }}><History size={15}/>{tr("Hist\u00F3rico")}</Button>{tr(kind === 'recurso' && e.status === 'publicado' && <a className="text-button" href={resourceUrl(e)} target="_blank" rel="noreferrer">{tr("Abrir")}<ExternalLink size={15}/></a>)}</div></article>))}</div>{tr(!records.length && <NoRecords>{tr("Nenhum registo neste filtro.")}</NoRecords>)}
 <Dialog open={!!editing} onOpenChange={v => !v && setEditing(null)}><DialogContent className="dialog-wide"><DialogHeader><DialogTitle>{tr(editing?.revision ? 'Editar' : 'Adicionar')} {tr(kindNames[kind].toLocaleLowerCase('pt'))}</DialogTitle><DialogDescription>{tr("As altera\u00E7\u00F5es s\u00E3o guardadas no servidor e mant\u00EAm o hist\u00F3rico.")}</DialogDescription></DialogHeader>{tr(editing && <EntryEditor key={editing.id} value={editing} data={data} onSave={async (body) => { await request(body); await reload(); setEditing(null); }}/>)}</DialogContent></Dialog>
 <Dialog open={history !== null} onOpenChange={v => !v && setHistory(null)}><DialogContent className="dialog-wide"><DialogHeader><DialogTitle>{tr("Hist\u00F3rico de vers\u00F5es")}</DialogTitle><DialogDescription>{tr("Vers\u00F5es anteriores preservadas.")}</DialogDescription></DialogHeader>{tr(history?.length ? history.map((h: any) => <article className="version-record" key={h.revision}><h3>{tr("Vers\u00E3o ")}{tr(h.revision)}{tr(" \u00B7 ")}{tr(date(h.created))}</h3><HistoricalEntry payload={h.payload}/></article>) : <p>{tr("Ainda n\u00E3o existem vers\u00F5es anteriores.")}</p>)}</DialogContent></Dialog>
 </>;
}
export function PublicRecords({ kind, work, courses, onOpen, embedded, includeEbook = false }: {
    kind: EntryKind;
    work: Workspace;
    courses: any[];
    onOpen: (c: any) => void;
    embedded?: boolean;
    includeEbook?: boolean;
}) {
    const [search, setSearch] = useState(''), [category, setCategory] = useState(''), [detail, setDetail] = useState<Entry | null>(null);
    const list = entriesOf(work, kind).filter(published), items = list.filter(e => (!category || e.body.category === category) && normalise([e.title, e.body.description, e.body.category, e.body.tags].join(' ')).includes(normalise(search)));
    const showEbook = includeEbook && kind === 'recurso' && !category && normalise(academyEbook.title + ' ' + academyEbook.description).includes(normalise(search));
    const RecordIcon = kind === 'formador' ? Users : kind === 'evento' ? Calendar : kind === 'recurso' ? BookOpen : FileText;
    return <>{tr(!embedded && <Heading title={tr(labels[kind] || kindNames[kind])}/>)}<div className="workspace-filter"><F label={tr("Pesquisar")}><Input type="search" value={search} onChange={e => setSearch(e.target.value)}/></F><F label={tr("Categoria")}><select value={category} onChange={e => setCategory(e.target.value)}><option value="">{tr("Todas as categorias")}</option>{tr([...new Set(list.map(e => e.body.category).filter(Boolean))].map(c => <option key={c} value={c}>{tr(c)}</option>))}</select></F></div>
 <div className="workspace-records">{tr(showEbook && <EbookResource />)}{tr(items.map(e => <article className="academy-course-card academy-record-card" key={e.id}>
  <div className="academy-course-top"><span className="academy-category">{tr(e.body.category || e.body.specialty || e.body.type || kindNames[kind])}</span><RecordIcon size={25} strokeWidth={1.5} aria-hidden="true"/></div>
  {tr((e.body.imageId || e.body.imageUrl) && <figure>{e.body.imageId?<AcademyImage className="record-image" imageId={e.body.imageId} variants={e.body.imageVariants} alt={tr(e.body.imageAlt||e.title)} target={kind==='formador'?240:960}/>:<img className="record-image" src={e.body.imageUrl} alt={tr(e.body.imageAlt||e.title)} loading="lazy"/>}{tr(e.body.imageCredit && <figcaption>{tr(e.body.imageCredit)}</figcaption>)}</figure>)}
  <div className="academy-course-content"><h3>{tr(e.title)}</h3>{tr(kind === 'evento' && <p className="meta">{tr(date(e.body.date))}{tr(e.body.ends ? ' a ' + date(e.body.ends) : '')}{tr(" \u00B7 ")}{tr(e.body.location)}</p>)}{tr(kind === 'formador' && <p className="meta">{tr(e.body.institution)}</p>)}<p>{tr(e.body.description?.slice(0, 220))}</p>
   <div className="academy-course-actions">{tr(kind === 'recurso' ? <a className="button-link" href={resourceUrl(e)} target="_blank" rel="noreferrer">{tr("Consultar material")}<ExternalLink size={16}/></a> : <Button variant="outline" onClick={() => setDetail(e)}>{tr("Consultar")}<ArrowRight size={16}/></Button>)}</div>
  </div>
 </article>))}</div>{tr(!items.length && !showEbook && <NoRecords>{tr(includeEbook ? 'Nenhum material corresponde à pesquisa ou à categoria seleccionada.' : 'Ainda não existem registos publicados neste filtro.')}</NoRecords>)}
 <Dialog open={!!detail} onOpenChange={v => !v && setDetail(null)}><DialogContent className="dialog-wide"><DialogHeader><DialogTitle>{tr(detail?.title)}</DialogTitle><DialogDescription>{tr(detail?.body.category || detail?.body.institution || kindNames[kind])}</DialogDescription></DialogHeader>{tr(detail && <>{tr(detail.body.slug && <p><a href={academyOrigin + '/publications/' + encodeURIComponent(detail.body.slug)} target="_blank" rel="noreferrer">{tr("Liga\u00E7\u00E3o para esta publica\u00E7\u00E3o")}</a></p>)}{tr(detail.body.blocks && <LessonContent body={detail.body.blocks}/>)}<div className="workspace-prose">{tr(detail.body.description?.split(/\n\s*\n/).map((p: string, i: number) => <p key={i}>{tr(p)}</p>))}</div>{tr(kind === 'evento' && <EventPanel id={detail.id}/>)} {tr(kind === 'evento' && <p>{tr(date(detail.body.date))}{tr(" \u00B7 ")}{tr(detail.body.location)} {tr(detail.body.url && <a className="button-link" href={detail.body.url} target="_blank" rel="noreferrer">{tr("Participar / consultar")}<ExternalLink size={15}/></a>)}</p>)}{tr(kind === 'programa' && <section><h3>{tr("Cursos do programa")}</h3>{tr(courses.filter(c => c.status === 'publicado' && courseSetup(work, c.id).programId === detail.id).map(c => <button className="programme-course" key={c.id} onClick={() => { setDetail(null); onOpen(c); }}>{tr(c.title)}<ArrowRight size={16}/></button>))}{tr(!courses.some(c => c.status === 'publicado' && courseSetup(work, c.id).programId === detail.id) && <p>{tr("Ainda n\u00E3o existem cursos publicados neste programa.")}</p>)}</section>)}</>)}</DialogContent></Dialog>
 </>;
}
export function Announcements({ work }: {
    work: Workspace;
}) { const list = entriesOf(work, 'anuncio').filter(published); return list.length ? <section className="workspace-announcements" aria-label={tr("An\u00FAncios")}>{tr(list.map(e => <article key={e.id}><h2>{tr(e.title)}</h2><p>{tr(e.body.description)}</p></article>))}</section> : null; }
export function AdminDashboard({ work, data, navigate }: Props) {
    const recent = data.audit.slice(0, 8);
    const metrics = [['Cursos', data.courses.length], ['Inscrições', data.enrollments.length], ['Conclusões', data.enrollments.filter((e: any) => e.eligible).length], ['Turmas', data.cohorts.length], ['Programas', entriesOf(work, 'programa').length], ['Formadores', entriesOf(work, 'formador').length], ['Materiais', data.media.length], ['Certificados', data.certificates.length]];
    return <><Heading title={tr("Painel administrativo")} text={tr("Acompanhe os registos e organize a forma\u00E7\u00E3o da Academia.")}/><div className="metrics">{tr(metrics.map(([name, n]) => <div className="metric" key={name}><span>{tr(name)}</span><strong>{tr(n)}</strong></div>))}</div><div className="admin-shortcuts">{tr([['gestao', 'Cursos e conteúdos'], ['programas-gestao', 'Programas'], ['formadores-gestao', 'Formadores'], ['avaliacoes', 'Avaliações'], ['inscricoes', 'Inscrições'], ['turmas', 'Turmas'], ['biblioteca-gestao', 'Biblioteca digital'], ['relatorios', 'Relatórios'], ['configuracoes', 'Configurações']].map(([id, title]) => <button key={id} onClick={() => navigate(id)}><span>{tr(title)}</span><ArrowRight size={18}/></button>))}</div><section className="panel activity"><div className="section-title"><h2>{tr("Actividade recente")}</h2><Button variant="ghost" onClick={() => navigate('auditoria')}>{tr("Consultar auditoria")}</Button></div>{tr(recent.length ? recent.map((a: any) => <div className="activity-row" key={a.id}><History size={17}/><div><strong>{tr(a.action)}</strong><p>{tr(a.detail)}</p></div><time>{tr(date(a.created))}</time></div>) : <p>{tr("Ainda n\u00E3o existem opera\u00E7\u00F5es registadas.")}</p>)}</section></>;
}
export function SettingsPanel({ work, request, reload }: Props) {
    const current = work.entries.find(e => e.id === 'institucional' && e.kind === 'configuracao');
    const [form, setForm] = useState(current?.body || { name: 'Academia Digital', description: 'Formação em saúde. Aceda aos cursos e aos materiais de consulta.', about: '', logoUrl: '', faviconUrl: '', color: '#006878' }), [error, setError] = useState(''), [success, setSuccess] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(current?.revision || 0);
    return <><Heading title={tr("Configura\u00E7\u00F5es institucionais")} text={tr("Actualize a apresenta\u00E7\u00E3o e a identidade visual da Academia.")}/><form className="panel form settings-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); setSuccess(''); try {
        const r = await request({ action: 'entry', id: 'institucional', kind: 'configuracao', title: 'Identidade institucional', status: 'publicado', revision, body: form });
        setRevision(r.entry.revision);
        await reload();
        setSuccess('Configuração guardada.');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }}>{tr([['name', 'Nome da plataforma'], ['description', 'Apresentação no início'], ['logoUrl', 'Logótipo (ligação HTTPS)'], ['faviconUrl', 'Favicon (ligação HTTPS)']].map(([key, label]) => <F key={key} label={tr(label)}><Input required={key === 'name'} type={key.endsWith('Url') ? 'url' : 'text'} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}/></F>))}<F label={tr("Cor principal")}><Input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}/></F><F label={tr("Sobre a Academia")}><Textarea rows={8} value={form.about || ''} onChange={e => setForm({ ...form, about: e.target.value })}/></F><Notice error={error} success={success}/><Button disabled={busy} type="submit"><Save size={16}/>{tr(busy ? 'A guardar…' : 'Guardar configurações')}</Button></form></>;
}
export function CourseSetup({ course, work, request, reload }: {
    course: any;
    work: Workspace;
    request: WorkspaceRequest;
    reload: () => Promise<any>;
}) {
    const old = work.entries.find(e => e.kind === 'curso' && e.id === course.id);
    const [form, setForm] = useState({ ...courseSetup(work, course.id) }), [revision, setRevision] = useState(old?.revision || 0), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
    return <form className="form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); setSuccess(''); try {
        const r = await request({ action: 'entry', kind: 'curso', id: course.id, title: course.title, status: 'publicado', revision, body: form });
        setRevision(r.entry.revision);
        await reload();
        setSuccess('Organização e notas guardadas.');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }}><F label={tr("Programa")}><select value={form.programId || ''} onChange={e => setForm({ ...form, programId: e.target.value })}><option value="">{tr("Sem programa associado")}</option>{tr(entriesOf(work, 'programa').map(e => <option key={e.id} value={e.id}>{tr(e.title)}</option>))}</select></F><fieldset className="form teacher-select"><legend>{tr("Formadores associados")}</legend>{tr(entriesOf(work, 'formador').map(e => <label className="check-option" key={e.id}><input type="checkbox" checked={(form.teacherIds || []).includes(e.id)} onChange={v => setForm({ ...form, teacherIds: v.target.checked ? [...(form.teacherIds || []), e.id] : (form.teacherIds || []).filter((id: string) => id !== e.id) })}/>{tr(e.title)}</label>))}{tr(!entriesOf(work, 'formador').length && <p>{tr("Ainda n\u00E3o existem formadores registados.")}</p>)}</fieldset><div className="form-grid">{tr([['starts', 'Início da formação'], ['ends', 'Fim da formação'], ['registrationStarts', 'Abertura de inscrições'], ['registrationEnds', 'Fecho de inscrições']].map(([key, label]) => <F key={key} label={tr(label)}><Input type="date" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}/></F>))}</div><F label={tr("Notas e orienta\u00E7\u00F5es do curso")}><Textarea rows={8} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}/></F><Notice error={error} success={success}/><Button disabled={busy} type="submit">{tr("Guardar organiza\u00E7\u00E3o e notas")}</Button></form>;
}
export function EnrollmentPanel({ data, work, request, reload }: Props) {
    const internal = data.courses.filter((c: any) => c.status === 'publicado' && !c.external);
    const [courseId, setCourseId] = useState(internal[0]?.id || ''), [csv, setCsv] = useState(''), [search, setSearch] = useState(''), [province, setProvince] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
    const [single, setSingle] = useState({ nome: '', provincia: 'Maputo Cidade', instituicao: '' });
    const enrollments = data.enrollments.filter((e: any) => (!courseId || e.courseId === courseId) && (!province || e.province === province) && normalise(e.participant + ' ' + e.institution).includes(normalise(search)));
    async function save(rows: any[]) { setBusy(true); setError(''); setSuccess(''); try {
        const r = await request({ action: 'enroll_bulk', courseId, rows });
        await reload();
        setSuccess(r.added + ' inscrições adicionadas. ' + r.skipped + ' duplicados já existentes.');
        setSingle({ ...single, nome: '' });
        setCsv('');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    return <><Heading title={tr("Inscri\u00E7\u00F5es")} text={tr("Inscreva participantes individualmente ou por ficheiro CSV.")}/><div className="workspace-filter"><F label={tr("Curso interno publicado")}><select value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">{tr("Seleccione um curso")}</option>{tr(internal.map((c: any) => <option key={c.id} value={c.id}>{tr(c.title)}</option>))}</select></F><F label={tr("Pesquisar participante / institui\u00E7\u00E3o")}><Input value={search} onChange={e => setSearch(e.target.value)}/></F><F label={tr("Prov\u00EDncia")}><select value={province} onChange={e => setProvince(e.target.value)}><option value="">{tr("Todas")}</option>{tr(provinces.map(p => <option key={p} value={p}>{tr(p)}</option>))}</select></F></div><Notice error={error} success={success}/>
 <div className="workspace-columns"><form className="panel form" onSubmit={e => { e.preventDefault(); save([single]); }}><h2>{tr("Inscri\u00E7\u00E3o individual")}</h2><F label={tr("Nome do participante")}><Input required maxLength={100} value={single.nome} onChange={e => setSingle({ ...single, nome: e.target.value })}/></F><F label={tr("Prov\u00EDncia do participante")}><select value={single.provincia} onChange={e => setSingle({ ...single, provincia: e.target.value })}>{tr(provinces.map(p => <option key={p} value={p}>{tr(p)}</option>))}</select></F><F label={tr("Institui\u00E7\u00E3o")}><Input value={single.instituicao} onChange={e => setSingle({ ...single, instituicao: e.target.value })}/></F><Button disabled={busy || !courseId} type="submit">{tr("Inscrever participante")}</Button></form><form className="panel form" onSubmit={e => { e.preventDefault(); try {
        save(parseCSV(csv));
    }
    catch (e: any) {
        setError(e.message);
    } }}><h2>{tr("Importa\u00E7\u00E3o CSV")}</h2><p>{tr("Colunas: Nome, Provincia e Instituicao. Use v\u00EDrgulas ou ponto e v\u00EDrgula. Cada linha corresponde a um participante.")}</p><input type="file" accept=".csv,text/csv" aria-label={tr("Seleccionar CSV de participantes")} onChange={async (e) => { const f = e.target.files?.[0]; if (f) {
        if (f.size > 1024 * 1024) {
            setError('Use um CSV até 1 MB.');
            return;
        }
        setCsv(await f.text());
    } }}/><F label={tr("Conte\u00FAdo do CSV")}><Textarea rows={6} value={csv} onChange={e => setCsv(e.target.value)}/></F><Button disabled={busy || !courseId || !csv} type="submit">{tr("Importar participantes")}</Button></form></div>
 <div className="panel workspace-table"><h2>{tr("Participantes inscritos")}</h2>{tr(enrollments.length ? <table><thead><tr><th>{tr("Participante")}</th><th>{tr("Curso")}</th><th>{tr("Prov\u00EDncia")}</th><th>{tr("Institui\u00E7\u00E3o")}</th><th>{tr("Turmas")}</th></tr></thead><tbody>{tr(enrollments.map((e: any) => <tr key={e.id}><td>{tr(e.participant)}</td><td>{tr(e.c.title)}</td><td>{tr(e.province)}</td><td>{tr(e.institution)}</td><td>{tr(work.members.filter(m => m.enrollmentId === e.id).map(m => data.cohorts.find((c: any) => c.id === m.cohortId)?.title).filter(Boolean).join(', ') || '—')}</td></tr>))}</tbody></table> : <p>{tr("Sem inscri\u00E7\u00F5es neste filtro.")}</p>)}</div></>;
}
export function CohortMembers({ cohort, data, work, request, reload }: {
    cohort: any;
    data: any;
    work: Workspace;
    request: WorkspaceRequest;
    reload: () => Promise<any>;
}) {
    const [enrollmentId, setEnrollmentId] = useState(''), [sessionDate, setSessionDate] = useState(cohort.starts), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const members = work.members.filter(m => m.cohortId === cohort.id), candidates = data.enrollments.filter((e: any) => e.courseId === cohort.courseId && !members.some(m => m.enrollmentId === e.id));
    async function save(b: any) { setBusy(true); setError(''); try {
        await request(b);
        await reload();
        setEnrollmentId('');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    return <section className="form"><h3>{tr("Participantes \u00B7 ")}{tr(members.length)}{tr(" / ")}{tr(cohort.capacity)}{tr(" vagas")}</h3>{tr(data.canManageMembers !== false && <div className="row wrap"><F label={tr("Adicionar inscri\u00E7\u00E3o \u00E0 turma")}><select value={enrollmentId} onChange={e => setEnrollmentId(e.target.value)}><option value="">{tr("Seleccione um participante inscrito")}</option>{tr(candidates.map((e: any) => <option key={e.id} value={e.id}>{tr(e.participant)}</option>))}</select></F><Button disabled={busy || !enrollmentId} onClick={() => save({ action: 'cohort_member', cohortId: cohort.id, enrollmentId })}>{tr("Adicionar \u00E0 turma")}</Button></div>)}<F label={tr("Data da sess\u00E3o")}><Input type="date" min={cohort.starts} max={cohort.ends} value={sessionDate} onChange={e => setSessionDate(e.target.value)}/></F><Notice error={error}/><div className="workspace-table"><table><thead><tr><th>{tr("Participante")}</th><th>{tr("Progresso")}</th><th>{tr("Presen\u00E7a nesta sess\u00E3o")}</th></tr></thead><tbody>{tr(members.map(m => { const e = data.enrollments.find((e: any) => e.id === m.enrollmentId), a = work.attendance.find(a => a.cohortId === cohort.id && a.enrollmentId === m.enrollmentId && a.sessionDate === sessionDate); return <tr key={m.enrollmentId}><td>{tr(e?.participant)}</td><td>{tr(e?.done)}{tr(" / ")}{tr(e?.total)}{tr(" aulas")}</td><td><select aria-label={tr('Presença de ' + e?.participant)} value={a?.state || ''} disabled={busy || !sessionDate} onChange={v => save({ action: 'attendance', cohortId: cohort.id, enrollmentId: m.enrollmentId, sessionDate, state: v.target.value })}><option value="" disabled>{tr("Por registar")}</option><option value="presente">{tr("Presente")}</option><option value="ausente">{tr("Ausente")}</option><option value="justificada">{tr("Falta justificada")}</option></select></td></tr>; }))}</tbody></table></div>{tr(!members.length && <p>{tr("Ainda n\u00E3o existem participantes associados \u00E0 turma.")}</p>)}</section>;
}
export function ReportsPanel({ data, work }: Props) {
    const [exportError, setExportError] = useState(''), [exporting, setExporting] = useState(false);
    const [filter, setFilter] = useState({ course: '', program: '', cohort: '', teacher: '', province: '', institution: '', from: '', to: '' });
    const set = (key: string, value: string) => setFilter({ ...filter, [key]: value });
    const rows = data.enrollments.filter((e: any) => { const config = courseSetup(work, e.courseId); return (!filter.course || e.courseId === filter.course) && (!filter.program || config.programId === filter.program) && (!filter.teacher || (config.teacherIds || []).includes(filter.teacher)) && (!filter.cohort || work.members.some(m => m.cohortId === filter.cohort && m.enrollmentId === e.id)) && (!filter.province || e.province === filter.province) && (!filter.institution || e.institution === filter.institution) && (!filter.from || e.created.slice(0, 10) >= filter.from) && (!filter.to || e.created.slice(0, 10) <= filter.to); });
    const exported = [['Participante', 'Curso', 'Província', 'Instituição', 'Inscrição', 'Aulas concluídas', 'Total de aulas', 'Melhor nota', 'Conclusão'], ...rows.map((e: any) => [e.participant, e.c.title, e.province, e.institution, e.created.slice(0, 10), e.done, e.total, e.best, e.eligible ? 'Concluído' : 'Em curso'])];
    const metrics = [['Inscrições', rows.length], ['Conclusões', rows.filter((e: any) => e.eligible).length], ['Aprovações', rows.filter((e: any) => e.best !== null && e.best >= e.c.pass).length], ['Tentativas', rows.reduce((n: number, e: any) => n + e.attempts.length, 0)], ['Horas concluídas', rows.filter((e: any) => e.eligible).reduce((n: number, e: any) => n + e.c.hours, 0)]];
    const months = [...new Set<string>(rows.map((e: any) => e.created.slice(0, 7)))].sort();
    async function exportReport(format: 'csv' | 'xlsx' | 'pdf') { setExporting(true); setExportError(''); try {
        const r = await academyFetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ format, ids: rows.map((e: any) => e.id) }) });
        if (!r.ok)
            throw Error('Não foi possível autorizar e registar a exportação. Actualize os dados.');
        if (format === 'pdf')
            window.print();
        else
            downloadRows(exported, format);
    }
    catch (e) {
        setExportError((e as Error).message);
    }
    finally {
        setExporting(false);
    } }
    return <><Heading title={tr("Relat\u00F3rios e analytics")} text={tr("Filtre os registos e exporte os resultados da selec\u00E7\u00E3o.")}><div className="row wrap"><Button variant="outline" disabled={exporting} onClick={() => void exportReport('pdf')}>{tr("Imprimir / PDF")}</Button><Button variant="outline" disabled={exporting} onClick={() => void exportReport('csv')}>{tr("CSV")}</Button><Button disabled={exporting} onClick={() => void exportReport('xlsx')}>{tr("Excel")}</Button></div></Heading>{tr(exportError && <p role="alert" className="editor-error">{tr(exportError)}</p>)}<div className="report-filters">{tr([['course', 'Curso', data.courses.map((c: any) => ({ id: c.id, title: c.title }))], ['program', 'Programa', entriesOf(work, 'programa')], ['teacher', 'Formador', entriesOf(work, 'formador')], ['cohort', 'Turma', data.cohorts], ['province', 'Província', provinces.map(id => ({ id, title: id }))], ['institution', 'Instituição', [...new Set<string>(data.enrollments.map((e: any) => e.institution))].map(id => ({ id, title: id }))]].map(([key, label, items]: any) => <F label={tr(label)} key={key}><select value={(filter as any)[key]} onChange={e => set(key, e.target.value)}><option value="">{tr("Todos")}</option>{tr(items.map((v: any) => <option value={v.id} key={v.id}>{tr(v.title)}</option>))}</select></F>))}<F label={tr("Inscri\u00E7\u00F5es desde")}><Input type="date" value={filter.from} onChange={e => set('from', e.target.value)}/></F><F label={tr("Inscri\u00E7\u00F5es at\u00E9")}><Input type="date" value={filter.to} onChange={e => set('to', e.target.value)}/></F></div><div className="metrics">{tr(metrics.map(([name, n]) => <div className="metric" key={name}><span>{tr(name)}</span><strong>{tr(n)}</strong></div>))}</div><div className="panel workspace-table"><table><thead><tr>{tr(exported[0].map((v: any) => <th key={v}>{tr(v)}</th>))}</tr></thead><tbody>{tr(exported.slice(1).map((r: any[], i: number) => <tr key={i}>{tr(r.map((v: any, j: number) => <td key={j}>{tr(v ?? '—')}</td>))}</tr>))}</tbody></table>{tr(!rows.length && <p>{tr("Sem registos neste filtro.")}</p>)}</div><div className="workspace-columns"><section className="panel"><h2>{tr("Participa\u00E7\u00E3o por prov\u00EDncia")}</h2>{tr([...new Set<string>(rows.map((e: any) => e.province))].sort().map(p => { const n = rows.filter((e: any) => e.province === p).length; return <div className="report-bar" key={p}><span>{tr(p)}</span><progress max={rows.length || 1} value={n}/><strong>{tr(n)}</strong></div>; }))}{tr(!rows.length && <p>{tr("Sem dados neste filtro.")}</p>)}</section><section className="panel"><h2>{tr("Evolu\u00E7\u00E3o das inscri\u00E7\u00F5es")}</h2>{tr(months.map(m => { const n = rows.filter((e: any) => e.created.startsWith(m)).length; return <div className="report-bar" key={m}><span>{tr(m)}</span><progress max={rows.length || 1} value={n}/><strong>{tr(n)}</strong></div>; }))}{tr(!months.length && <p>{tr("Sem dados neste filtro.")}</p>)}</section></div></>;
}
