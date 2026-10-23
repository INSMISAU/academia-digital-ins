'use client';
import {useState} from 'react';
import {ArrowDown, ArrowUp, Eye, GripVertical, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {CourseOverview, LessonContent} from './content';
import {academyRequestId} from '@/lib/academy-client';
import {useDraftAutosave} from './autosave';
import {resourceUrl} from './workspace';
import type {Entry} from '@/lib/academy-workspace';
import {blockLabels, courseOverview, encodeOverview, encodeLesson, lessonContent, modalities, moveBlock, newBlock, type BlockType, type ContentBlock} from '@/lib/academy-content';

type EditorProps = {value: any; busy: boolean; onSave: (body: any) => Promise<unknown>; onAutoSave?: (body:any)=>Promise<unknown>};
function Field({label, children}: {label: string; children: React.ReactNode}) {return <label className="field"><span>{label}</span>{children}</label>;}
function SaveStatus({error, busy}: {error: string; busy: boolean}) {return <div aria-live="polite">{error && <p className="editor-error" role="alert">{error}</p>}{busy && <p> A guardar no servidor…</p>}</div>;}

export function CourseEditor({value, busy, onSave,onAutoSave}: EditorProps) {
  const [form, setForm] = useState({...value, ...courseOverview(value.summary)});
  const [preview, setPreview] = useState(false), [error, setError] = useState('');
  const update = (key: string, next: string | number) => {setForm({...form, [key]: next}); setError('');};
  let draftBody:any=null;try{draftBody={...value,title:form.title,category:form.category,hours:form.hours,pass:form.pass,summary:encodeOverview(form),action:'course'};}catch{}
  const autoStatus=useDraftAutosave(draftBody,onAutoSave,!!value.id&&!busy&&!!form.title?.trim()&&!!form.category?.trim());
  async function save(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {await onSave({...value, title: form.title, category: form.category, hours: form.hours, pass: form.pass, summary: encodeOverview(form), action: 'course'});}
    catch (e: any) {setError(e.message);}
  }
  return <form className="form academy-editor" onSubmit={save}>
    <fieldset disabled={busy} className="editor-fields"><div className="editor-switch"><Button type="button" variant={preview ? 'outline' : 'default'} onClick={() => setPreview(false)}>Editar ficha</Button><Button type="button" variant={preview ? 'default' : 'outline'} onClick={() => setPreview(true)}><Eye size={16}/>Pré-visualizar</Button></div>
    {preview ? <section className="editor-preview"><span className="eyebrow">PRÉ-VISUALIZAÇÃO · NÃO PUBLICADA</span><h2>{form.title || 'Título do curso'}</h2><p>{form.category}{form.hours > 0 ? ' · ' + form.hours + ' h' : ''}</p><CourseOverview summary={(() => {try {return encodeOverview(form);} catch {return form.summary;}})()}/></section> : <>
      <Field label="Título"><Input required maxLength={180} value={form.title} onChange={e => update('title', e.target.value)}/></Field>
      <Field label="Resumo"><Textarea required maxLength={3000} value={form.summary} onChange={e => update('summary', e.target.value)}/></Field>
      <Field label="Objectivos de aprendizagem (um por linha)"><Textarea value={form.objectives} onChange={e => update('objectives', e.target.value)}/></Field>
      <Field label="A quem se destina"><Textarea value={form.audience} onChange={e => update('audience', e.target.value)}/></Field>
      <Field label="Requisitos de participação"><Textarea value={form.prerequisites} onChange={e => update('prerequisites', e.target.value)}/></Field>
      <div className="form-grid"><Field label="Área temática"><Input required maxLength={100} value={form.category} onChange={e => update('category', e.target.value)}/></Field><Field label="Modalidade"><select aria-label="Modalidade" value={form.modality} onChange={e => update('modality', e.target.value)}><option value="">Por definir</option>{modalities.map(m => <option key={m}>{m}</option>)}</select></Field></div>
      <div className="form-grid"><Field label="Carga horária (0 = por definir)"><Input type="number" min={0} max={1000} required value={form.hours} onChange={e => update('hours', Number(e.target.value))}/></Field><Field label="Nota mínima (%)"><Input type="number" min={1} max={100} required value={form.pass} onChange={e => update('pass', Number(e.target.value))}/></Field></div>
    </>}
    <SaveStatus error={error} busy={busy}/><p className="autosave-status" role="status">{autoStatus}</p><Button type="submit" disabled={busy}>{busy ? 'A guardar…' : 'Guardar rascunho'}</Button></fieldset>
  </form>;
}

export function LessonEditor({value, busy, onSave,onAutoSave, modules,resources=[]}: EditorProps & {modules: string[];resources?:Entry[]}) {
  const [title, setTitle] = useState(value.title || ''), [module, setModule] = useState(value.module || '');
  const [content, setContent] = useState(() => lessonContent(value.body));
  const [preview, setPreview] = useState(false), [error, setError] = useState(''), [type, setType] = useState<BlockType>('text'), [drag, setDrag] = useState<number | null>(null);
  const patch = (index: number, field: keyof ContentBlock, next: string) => {setContent({...content, blocks: content.blocks.map((b, i) => i === index ? {...b, [field]: next} : b)}); setError('');};
  const move = (from: number, to: number) => {setContent({...content, blocks: moveBlock(content.blocks, from, to)}); setError('');};
  async function save(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      if (!module.trim() || !title.trim()) throw Error('Preencha o módulo e o título da aula.');
      await onSave({...value, action: 'lesson', title: title.trim(), module: module.trim(), body: encodeLesson(content)});
    } catch (e: any) {setError(e.message);}
  }
  let draftBody:any=null;try{draftBody={...value,action:'lesson',title:title.trim(),module:module.trim(),body:encodeLesson(content)};}catch{}
  const autoStatus=useDraftAutosave(draftBody,onAutoSave,!!value.id&&!busy&&!!title.trim()&&!!module.trim());
  return <form className="form academy-editor" onSubmit={save}>
    <fieldset disabled={busy} className="editor-fields"><div className="editor-switch"><Button type="button" variant={preview ? 'outline' : 'default'} onClick={() => setPreview(false)}>Editar aula</Button><Button type="button" variant={preview ? 'default' : 'outline'} onClick={() => setPreview(true)}><Eye size={16}/>Pré-visualizar</Button></div>
    {preview ? <section className="editor-preview"><span className="eyebrow">PRÉ-VISUALIZAÇÃO · NÃO PUBLICADA</span><p>{module}</p><h2>{title || 'Título da aula'}</h2><LessonContent body={'INS_ACADEMY_LESSON_V1\n' + JSON.stringify(content)}/></section> : <>
      <div className="form-grid"><Field label="Módulo"><Input required maxLength={160} list="academy-module-options" value={module} onChange={e => setModule(e.target.value)} placeholder="Escreva ou seleccione um módulo"/><datalist id="academy-module-options">{modules.map(m => <option key={m} value={m}/>)}</datalist></Field><Field label="Título da aula"><Input required maxLength={180} value={title} onChange={e => setTitle(e.target.value)}/></Field></div>
      <Field label="Alinhamento do texto"><select aria-label="Alinhamento do texto" value={content.align} onChange={e => setContent({...content, align: e.target.value as 'left' | 'justify'})}><option value="left">À esquerda</option><option value="justify">Justificado</option></select></Field>
      <p className="editor-help">Organize os blocos pelas setas ou arraste a pega com o rato. Para materiais, indique uma ligação pública HTTPS. Use apenas imagens reais, com fonte e descrição; dê preferência a Moçambique e à representação de pessoas negras.</p>
      <div className="editor-blocks">{content.blocks.map((b, index) => <section className="editor-block" key={b.id} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); if (drag !== null) move(drag, index); setDrag(null);}}>
        <header><strong><span draggable onDragStart={() => setDrag(index)} onDragEnd={() => setDrag(null)} aria-hidden="true"><GripVertical size={16}/></span>{index + 1}. {blockLabels[b.type]}</strong><div><Button type="button" size="icon" variant="ghost" aria-label={'Subir bloco ' + (index + 1)} disabled={index === 0 || busy} onClick={() => move(index, index - 1)}><ArrowUp size={16}/></Button><Button type="button" size="icon" variant="ghost" aria-label={'Descer bloco ' + (index + 1)} disabled={index === content.blocks.length - 1 || busy} onClick={() => move(index, index + 1)}><ArrowDown size={16}/></Button><Button type="button" size="icon" variant="ghost" aria-label={'Remover bloco ' + (index + 1)} disabled={content.blocks.length === 1 || busy} onClick={() => setContent({...content, blocks: content.blocks.filter((_, i) => i !== index)})}><Trash2 size={16}/></Button></div></header>
        {['text', 'richtext', 'notice', 'heading', 'list'].includes(b.type) ? <div>{b.type==='richtext'&&<div className="richtext-tools">{[['**','Negrito'],['*','Itálico']].map(([marker,label])=><Button type="button" variant="outline" key={label} onClick={()=>{const field=document.getElementById('editor-text-'+b.id) as HTMLTextAreaElement|null;if(!field)return;const start=field.selectionStart,end=field.selectionEnd;patch(index,'text',b.text.slice(0,start)+marker+b.text.slice(start,end)+marker+b.text.slice(end));}}>{label}</Button>)}</div>}<Field label={b.type === 'list' ? 'Itens (um por linha)' : b.type === 'heading' ? 'Título de secção' : 'Texto'}><Textarea id={'editor-text-'+b.id} required value={b.text} onChange={e => patch(index, 'text', e.target.value)}/></Field></div> : <>
          {resources.length>0&&<Field label="Escolher material publicado da biblioteca"><select value="" onChange={e=>{const resource=resources.find(r=>r.id===e.target.value);if(!resource)return;const url=new URL(resourceUrl(resource),location.origin).href;setContent({...content,blocks:content.blocks.map((v,i)=>i===index?{...v,title:resource.title,url,source:resource.body.source||v.source}:v)});}}><option value="">Seleccione um material ou indique uma ligação abaixo</option>{resources.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></Field>}<Field label="Nome do material"><Input required value={b.title} onChange={e => patch(index, 'title', e.target.value)}/></Field>
          <Field label="Ligação pública HTTPS"><Input type="url" required value={b.url} placeholder="https://" onChange={e => patch(index, 'url', e.target.value)}/></Field>
          {b.type === 'image' && <Field label="Descrição da imagem (acessibilidade)"><Input required value={b.alt} onChange={e => patch(index, 'alt', e.target.value)}/></Field>}
          <Field label={b.type === 'image' ? 'Fonte / autoria (obrigatória)' : 'Fonte / autoria'}><Input required={b.type === 'image'} value={b.source} onChange={e => patch(index, 'source', e.target.value)}/></Field>
          <Field label="Legenda ou nota de apoio"><Textarea value={b.text} onChange={e => patch(index, 'text', e.target.value)}/></Field>
        </>}
      </section>)}</div>
      <div className="editor-add"><Field label="Tipo de bloco"><select value={type} aria-label="Tipo de bloco" onChange={e => setType(e.target.value as BlockType)}>{Object.entries(blockLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Button type="button" variant="outline" disabled={busy || content.blocks.length >= 40} onClick={() => setContent({...content, blocks: [...content.blocks, newBlock(type, academyRequestId())]})}><Plus size={16}/>Adicionar bloco</Button></div>
    </>}
    <SaveStatus error={error} busy={busy}/><p className="autosave-status" role="status">{autoStatus}</p><Button type="submit" disabled={busy}>{busy ? 'A guardar…' : 'Guardar aula'}</Button></fieldset>
  </form>;
}
