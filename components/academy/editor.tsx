'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CourseOverview, LessonContent } from './content';
import { academyRequestId } from '@/lib/academy-client';
import { useDraftAutosave } from './autosave';
import { resourceUrl } from './workspace';
import type { Entry } from '@/lib/academy-workspace';
import { blockLabels, courseOverview, encodeOverview, encodeLesson, lessonContent, modalities, moveBlock, newBlock, type BlockType, type ContentBlock } from '@/lib/academy-content';
type EditorProps = {
    value: any;
    busy: boolean;
    onSave: (body: any) => Promise<unknown>;
    onAutoSave?: (body: any) => Promise<unknown>;
};
function Field({ label, children }: {
    label: string;
    children: React.ReactNode;
}) { return <label className="field"><span>{tr(label)}</span>{tr(children)}</label>; }
function SaveStatus({ error, busy }: {
    error: string;
    busy: boolean;
}) { return <div aria-live="polite">{tr(error && <p className="editor-error" role="alert">{tr(error)}</p>)}{tr(busy && <p>{tr(" A guardar no servidor\u2026")}</p>)}</div>; }
export function CourseEditor({ value, busy, onSave, onAutoSave }: EditorProps) {
    const [form, setForm] = useState({ ...value, ...courseOverview(value.summary) });
    const [preview, setPreview] = useState(false), [error, setError] = useState('');
    const update = (key: string, next: string | number) => { setForm({ ...form, [key]: next }); setError(''); };
    let draftBody: any = null;
    try {
        draftBody = { ...value, title: form.title, category: form.category, hours: form.hours, pass: form.pass, summary: encodeOverview(form), action: 'course' };
    }
    catch { }
    const autoStatus = useDraftAutosave(draftBody, onAutoSave, !!value.id && !busy && !!form.title?.trim());
    async function save(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        try {
            await onSave({ ...value, title: form.title, category: form.category, hours: form.hours, pass: form.pass, summary: encodeOverview(form), action: 'course' });
        }
        catch (e: any) {
            setError(e.message);
        }
    }
    return <form className="form academy-editor" onSubmit={save}>
    <fieldset disabled={busy} className="editor-fields"><div className="editor-switch"><Button type="button" variant={preview ? 'outline' : 'default'} onClick={() => setPreview(false)}>{tr("Editar ficha")}</Button><Button type="button" variant={preview ? 'default' : 'outline'} onClick={() => setPreview(true)}><Eye size={16}/>{tr("Pr\u00E9-visualizar")}</Button></div>
    {tr(preview ? <section className="editor-preview"><span className="eyebrow">{tr("PR\u00C9-VISUALIZA\u00C7\u00C3O \u00B7 N\u00C3O PUBLICADA")}</span><h2>{tr(form.title || 'Título do curso')}</h2><p>{tr(form.category)}{tr(form.hours > 0 ? ' · ' + form.hours + ' h' : '')}</p><CourseOverview summary={(() => { try {
            return encodeOverview(form);
        }
        catch {
            return form.summary;
        } })()}/></section> : <>
      <Field label={tr("T\u00EDtulo")}><Input required maxLength={180} value={form.title} onChange={e => update('title', e.target.value)}/></Field>
      <Field label={tr("Resumo")}><Textarea maxLength={3000} value={form.summary} onChange={e => update('summary', e.target.value)}/></Field>
      <Field label={tr("Objectivos de aprendizagem (um por linha)")}><Textarea value={form.objectives} onChange={e => update('objectives', e.target.value)}/></Field>
      <Field label={tr("A quem se destina")}><Textarea value={form.audience} onChange={e => update('audience', e.target.value)}/></Field>
      <Field label={tr("Requisitos de participa\u00E7\u00E3o")}><Textarea value={form.prerequisites} onChange={e => update('prerequisites', e.target.value)}/></Field>
      <fieldset className="panel"><legend>{tr('Tradução inglesa')}</legend>{null}{[['title','Título em inglês'],['category','Categoria em inglês'],['summary','Resumo em inglês'],['objectives','Objectivos em inglês'],['audience','Destinatários em inglês'],['prerequisites','Requisitos em inglês']].map(([key,label])=><Field key={key} label={tr(label)}><Textarea lang="en" maxLength={key==='title'?180:key==='category'?100:3000} value={form.translations?.en?.[key]||''} onChange={event=>setForm({...form,translations:{...form.translations,en:{...form.translations?.en,[key]:event.target.value}}})}/></Field>)}</fieldset>
      <div className="form-grid"><Field label={tr("\u00C1rea tem\u00E1tica")}><Input maxLength={100} value={form.category} onChange={e => update('category', e.target.value)}/></Field><Field label={tr("Modalidade")}><select aria-label={tr("Modalidade")} value={form.modality} onChange={e => update('modality', e.target.value)}><option value="">{tr("Por definir")}</option>{tr(modalities.map(m => <option key={m} value={m}>{tr(m)}</option>))}</select></Field></div>
      <div className="form-grid"><Field label={tr("Carga hor\u00E1ria (0 = por definir)")}><Input type="number" min={0} max={1000} required value={form.hours} onChange={e => update('hours', Number(e.target.value))}/></Field><Field label={tr("Nota m\u00EDnima (%)")}><Input type="number" min={1} max={100} required value={form.pass} onChange={e => update('pass', Number(e.target.value))}/></Field></div>
    </>)}
    <SaveStatus error={error} busy={busy}/><p className="autosave-status" role="status">{tr(autoStatus)}</p><Button type="submit" disabled={busy}>{tr(busy ? 'A guardar…' : 'Guardar rascunho')}</Button></fieldset>
  </form>;
}
export function LessonEditor({ value, busy, onSave, onAutoSave, modules, resources = [] }: EditorProps & {
    modules: string[];
    resources?: Entry[];
}) {
    const [title, setTitle] = useState(value.title || ''), [module, setModule] = useState(value.module || '');
    const [content, setContent] = useState(() => lessonContent(value.body));
    const [preview, setPreview] = useState(false), [error, setError] = useState(''), [type, setType] = useState<BlockType>('text'), [drag, setDrag] = useState<number | null>(null);
    const patch = (index: number, field: keyof ContentBlock, next: string) => { setContent({ ...content, blocks: content.blocks.map((b, i) => i === index ? { ...b, [field]: next } : b) }); setError(''); };
    const english=(key:string,value:string)=>setContent({...content,translations:{en:{...content.translations?.en,[key]:value}}});
    const englishBlock=(id:string,key:string,value:string)=>setContent({...content,translations:{en:{...content.translations?.en,blocks:{...content.translations?.en?.blocks,[id]:{...content.translations?.en?.blocks?.[id],[key]:value}}}}});
    const move = (from: number, to: number) => { setContent({ ...content, blocks: moveBlock(content.blocks, from, to) }); setError(''); };
    async function save(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        try {
            if (!module.trim() || !title.trim())
                throw Error('Preencha o módulo e o título da aula.');
            await onSave({ ...value, action: 'lesson', title: title.trim(), module: module.trim(), body: encodeLesson(content) });
        }
        catch (e: any) {
            setError(e.message);
        }
    }
    let draftBody: any = null;
    try {
        draftBody = { ...value, action: 'lesson', title: title.trim(), module: module.trim(), body: encodeLesson(content) };
    }
    catch { }
    const autoStatus = useDraftAutosave(draftBody, onAutoSave, !!value.id && !busy && !!title.trim() && !!module.trim());
    return <form className="form academy-editor" onSubmit={save}>
    <fieldset disabled={busy} className="editor-fields"><div className="editor-switch"><Button type="button" variant={preview ? 'outline' : 'default'} onClick={() => setPreview(false)}>{tr("Editar aula")}</Button><Button type="button" variant={preview ? 'default' : 'outline'} onClick={() => setPreview(true)}><Eye size={16}/>{tr("Pr\u00E9-visualizar")}</Button></div>
    {tr(preview ? <section className="editor-preview"><span className="eyebrow">{tr("PR\u00C9-VISUALIZA\u00C7\u00C3O \u00B7 N\u00C3O PUBLICADA")}</span><p>{tr(module)}</p><h2>{tr(title || 'Título da aula')}</h2><LessonContent body={'INS_ACADEMY_LESSON_V1\n' + JSON.stringify(content)}/></section> : <>
      <div className="form-grid"><Field label={tr("M\u00F3dulo")}><Input required maxLength={160} list="academy-module-options" value={module} onChange={e => setModule(e.target.value)} placeholder={tr("Escreva ou seleccione um m\u00F3dulo")}/><datalist id="academy-module-options">{tr(modules.map(m => <option key={m} value={m}/>))}</datalist></Field><Field label={tr("T\u00EDtulo da aula")}><Input required maxLength={180} value={title} onChange={e => setTitle(e.target.value)}/></Field></div>
      <Field label={tr("Alinhamento do texto")}><select aria-label={tr("Alinhamento do texto")} value={content.align} onChange={e => setContent({ ...content, align: e.target.value as 'left' | 'justify' })}><option value="left">{tr("\u00C0 esquerda")}</option><option value="justify">{tr("Justificado")}</option></select></Field>
      <fieldset className="panel"><legend>{tr('Tradução inglesa')}</legend>{null}<Field label={tr('Título em inglês')}><Input lang="en" maxLength={180} value={content.translations?.en?.title||''} onChange={event=>english('title',event.target.value)}/></Field><Field label={tr('Módulo em inglês')}><Input lang="en" maxLength={160} value={content.translations?.en?.module||''} onChange={event=>english('module',event.target.value)}/></Field>{content.blocks.map((block,index)=><fieldset className="panel" key={block.id}><legend>{index+1}. {tr(blockLabels[block.type])}</legend>{(['text','richtext','notice','heading','list'].includes(block.type)?[['text','Texto em inglês']]:[['title','Título em inglês'],['text','Legenda em inglês'],...(block.type==='image'?[['alt','Descrição da imagem em inglês']]:[])]).map(([key,label])=><Field key={key} label={tr(label)}><Textarea lang="en" maxLength={10000} value={content.translations?.en?.blocks?.[block.id]?.[key as 'text'|'title'|'alt']||''} onChange={event=>englishBlock(block.id,key,event.target.value)}/></Field>)}</fieldset>)}</fieldset>
      {null}
      <div className="editor-blocks">{tr(content.blocks.map((b, index) => <section className="editor-block" key={b.id} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (drag !== null)
                move(drag, index); setDrag(null); }}>
        <header><strong><span draggable onDragStart={() => setDrag(index)} onDragEnd={() => setDrag(null)} aria-hidden="true"><GripVertical size={16}/></span>{tr(index + 1)}{tr(". ")}{tr(blockLabels[b.type])}</strong><div><Button type="button" size="icon" variant="ghost" aria-label={tr('Subir bloco ' + (index + 1))} disabled={index === 0 || busy} onClick={() => move(index, index - 1)}><ArrowUp size={16}/></Button><Button type="button" size="icon" variant="ghost" aria-label={tr('Descer bloco ' + (index + 1))} disabled={index === content.blocks.length - 1 || busy} onClick={() => move(index, index + 1)}><ArrowDown size={16}/></Button><Button type="button" size="icon" variant="ghost" aria-label={tr('Remover bloco ' + (index + 1))} disabled={content.blocks.length === 1 || busy} onClick={() => setContent({ ...content, blocks: content.blocks.filter((_, i) => i !== index) })}><Trash2 size={16}/></Button></div></header>
        {tr(['text', 'richtext', 'notice', 'heading', 'list'].includes(b.type) ? <div>{tr(b.type === 'richtext' && <div className="richtext-tools">{tr([['**', 'Negrito'], ['*', 'Itálico']].map(([marker, label]) => <Button type="button" variant="outline" key={label} onClick={() => { const field = document.getElementById('editor-text-' + b.id) as HTMLTextAreaElement | null; if (!field)
                    return; const start = field.selectionStart, end = field.selectionEnd; patch(index, 'text', b.text.slice(0, start) + marker + b.text.slice(start, end) + marker + b.text.slice(end)); }}>{tr(label)}</Button>))}</div>)}<Field label={tr(b.type === 'list' ? 'Itens (um por linha)' : b.type === 'heading' ? 'Título de secção' : 'Texto')}><Textarea id={'editor-text-' + b.id} required value={b.text} onChange={e => patch(index, 'text', e.target.value)}/></Field></div> : <>
          {tr(resources.length > 0 && <Field label={tr("Escolher material publicado da biblioteca")}><select value="" onChange={e => { const resource = resources.find(r => r.id === e.target.value); if (!resource)
                    return; const url = new URL(resourceUrl(resource), location.origin).href; setContent({ ...content, blocks: content.blocks.map((v, i) => i === index ? { ...v, title: resource.title, url, source: resource.body.source || v.source } : v) }); }}><option value="">{tr("Seleccione um material ou indique uma liga\u00E7\u00E3o abaixo")}</option>{tr(resources.map(r => <option key={r.id} value={r.id}>{tr(r.title)}</option>))}</select></Field>)}<Field label={tr("Nome do material")}><Input required value={b.title} onChange={e => patch(index, 'title', e.target.value)}/></Field>
          <Field label={tr("Liga\u00E7\u00E3o p\u00FAblica HTTPS")}><Input type="url" required value={b.url} placeholder={tr("https://")} onChange={e => patch(index, 'url', e.target.value)}/></Field>
          {tr(b.type === 'image' && <Field label={tr("Descri\u00E7\u00E3o da imagem (acessibilidade)")}><Input required value={b.alt} onChange={e => patch(index, 'alt', e.target.value)}/></Field>)}
          <Field label={tr(b.type === 'image' ? 'Fonte / autoria (obrigatória)' : 'Fonte / autoria')}><Input required={b.type === 'image'} value={b.source} onChange={e => patch(index, 'source', e.target.value)}/></Field>
          <Field label={tr("Legenda ou nota de apoio")}><Textarea value={b.text} onChange={e => patch(index, 'text', e.target.value)}/></Field>
        </>)}
      </section>))}</div>
      <div className="editor-add"><Field label={tr("Tipo de bloco")}><select value={type} aria-label={tr("Tipo de bloco")} onChange={e => setType(e.target.value as BlockType)}>{tr(Object.entries(blockLabels).map(([key, label]) => <option key={key} value={key}>{tr(label)}</option>))}</select></Field><Button type="button" variant="outline" disabled={busy || content.blocks.length >= 40} onClick={() => setContent({ ...content, blocks: [...content.blocks, newBlock(type, academyRequestId())] })}><Plus size={16}/>{tr("Adicionar bloco")}</Button></div>
    </>)}
    <SaveStatus error={error} busy={busy}/><p className="autosave-status" role="status">{tr(autoStatus)}</p><Button type="submit" disabled={busy}>{tr(busy ? 'A guardar…' : 'Guardar aula')}</Button></fieldset>
  </form>;
}
