'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useRef, useState, useReducer } from 'react';
import { F } from '../workspace';
import { LessonContent } from '../content';
import { blockLabels, lessonContent, newBlock, moveBlock, LESSON_FORMAT } from '@/lib/academy-content';
import { academyRequestId } from '@/lib/academy-client';
import { completion, ImageField, ErrorText, localDate, maputoDate, useLeaveWarning } from './common';
import { editorHistory, initialEditorHistory } from '@/lib/academy-editor-history';
import { GripVertical } from 'lucide-react';
import { EventPanel } from './events';
export function EditorialEditor({ value, save, close }: {
    value: any;
    save: (b: any) => Promise<any>;
    close: () => void;
}) {
    const [draft, dispatch] = useReducer(editorHistory, value, initialEditorHistory);
    const form = draft.form, setForm = (form: any) => dispatch({type:'edit', form}), acceptForm = (form: any) => dispatch({type:'accept', form});
    const drag = useRef<string | null>(null);
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [preview, setPreview] = useState(false), [history, setHistory] = useState<any[]>([]), [selected, setSelected] = useState<any>(null), [saved, setSaved] = useState(JSON.stringify(value)), [failed, setFailed] = useState('');
    const dirty = JSON.stringify(form) !== saved;
    useLeaveWarning(dirty);
    const b = form.body, content = lessonContent(b.blocks || ''), change = (k: string, v: any) => setForm({ ...form, body: { ...b, [k]: v } });
    const setBlocks = (blocks: any[]) => change('blocks', LESSON_FORMAT + JSON.stringify({ ...content, blocks }));
    async function submit(status = form.status) { setBusy(true); setError(''); try {
        const r = await save({ ...form, status, action: 'entry' });
        if (r?.entry) {
            acceptForm(r.entry);
            setSaved(JSON.stringify(r.entry));
            setFailed('');
        }
        else
            close();
    }
    catch (e: any) {
        setError(e.message);
        setFailed(JSON.stringify(form));
    }
    finally {
        setBusy(false);
    } }
    useEffect(() => { if (!form.revision || form.status !== 'rascunho' || busy || !dirty || failed === JSON.stringify(form))
        return; const timer = setTimeout(() => void submit('rascunho'), 1500); return () => clearTimeout(timer); }, [JSON.stringify(form), busy, saved, failed]);
    useEffect(() => { const retry = () => setFailed(''); window.addEventListener('online', retry); return () => window.removeEventListener('online', retry); }, []);
    return <section className="form"><div className="row between"><button type="button" onClick={() => { if (!dirty || confirm(tr('Existem alterações por guardar. Sair do editor?')))
        close(); }}>{tr("\u2190 Voltar \u00E0 lista")}</button><button type="button" onClick={() => setPreview(!preview)}>{tr(preview ? 'Editar' : 'Pré-visualizar')}</button></div><h1>{tr(form.revision ? 'Editar' : 'Criar')} {tr(form.kind === 'evento' ? 'evento' : form.kind === 'noticia' ? 'notícia' : 'anúncio')}</h1><ErrorText value={error}/><div className="row wrap"><button type="button" disabled={busy || !draft.past.length} onClick={() => dispatch({type:'undo'})}>{tr('Desfazer')}</button><button type="button" disabled={busy || !draft.future.length} onClick={() => dispatch({type:'redo'})}>{tr('Refazer')}</button></div>{tr(preview ? <article><h2>{tr(form.title)}</h2><p>{tr(b.description)}</p>{tr(b.blocks && <LessonContent body={b.blocks}/>)}</article> : <fieldset disabled={busy} className="editor-fields"><F label={tr("T\u00EDtulo")}><input maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></F><F label={tr("Resumo")}><textarea maxLength={20000} value={b.description || ''} onChange={e => change('description', e.target.value)}/></F><div className="form-grid">{tr([['slug', 'Endereço da publicação'], ['author', 'Autor'], ['category', 'Categoria'], ['tags', 'Etiquetas'], ['seoTitle', 'Título para pesquisa'], ['seoDescription', 'Descrição para pesquisa']].map(([key, label]) => <F key={key} label={tr(label)}><input value={b[key] || ''} onChange={e => change(key, e.target.value)}/></F>))}</div><ImageField value={b} onChange={v => setForm({ ...form, body: v })}/><h2>{tr("Conte\u00FAdo")}</h2>{tr(content.blocks.map((block, i) => <fieldset className="panel" key={block.id} onDragOver={e => { if (!busy && drag.current) e.preventDefault(); }} onDrop={e => { const id = drag.current; drag.current = null; if (busy || !id) return; e.preventDefault(); const from = content.blocks.findIndex(b => b.id === id); if (from >= 0 && from !== i) setBlocks(moveBlock(content.blocks, from, i)); }}><legend><span draggable={!busy} aria-hidden="true" onDragStart={e => { drag.current = block.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', block.id); }} onDragEnd={() => { drag.current = null; }} style={{cursor:'grab'}}><GripVertical size={16}/></span>{tr(i + 1)}{tr(". ")}{tr(blockLabels[block.type])}</legend>{tr((['text', 'richtext', 'notice', 'heading', 'list'].includes(block.type) ? ['text'] : ['title', 'url', 'alt', 'source', 'text']).map(key => <F key={key} label={tr(({ text: 'Texto', title: 'Título', url: 'Ligação HTTPS', alt: 'Descrição da imagem', source: 'Autoria' } as any)[key])}><textarea value={(block as any)[key]} onChange={e => setBlocks(content.blocks.map((v, j) => j === i ? { ...v, [key]: e.target.value } : v))}/></F>))}<div className="row"><button type="button" disabled={i === 0} onClick={() => setBlocks(moveBlock(content.blocks, i, i - 1))}>{tr("Subir")}</button><button type="button" disabled={i === content.blocks.length - 1} onClick={() => setBlocks(moveBlock(content.blocks, i, i + 1))}>{tr("Descer")}</button><button type="button" onClick={() => setBlocks(content.blocks.filter((_, j) => i !== j))}>{tr("Remover bloco")}</button></div></fieldset>))}<F label={tr("Adicionar bloco")}><select value="" onChange={e => { if (e.target.value)
            setBlocks([...content.blocks, newBlock(e.target.value as any, academyRequestId())]); }}><option value="">{tr("Seleccione")}</option>{tr(Object.entries(blockLabels).map(([k, v]) => <option key={k} value={k}>{tr(v)}</option>))}</select></F>
 {tr(form.kind === 'evento' && <><h2>{tr("Dados do evento")}</h2><div className="form-grid">{tr([['eventType', 'Tipo de evento'], ['location', 'Local'], ['organiser', 'Organização'], ['contact', 'Contacto da organização'], ['url', 'Página pública'], ['joinUrl', 'Ligação reservada aos inscritos confirmados'], ['joinCode', 'Código reservado aos inscritos confirmados']].map(([key, label]) => <F key={key} label={tr(label)}><input value={b[key] || ''} onChange={e => change(key, e.target.value)}/></F>))}<F label={tr("Modalidade")}><select value={b.format || 'presencial'} onChange={e => change('format', e.target.value)}>{tr(['presencial', 'online', 'hibrido'].map(x => <option key={x} value={x}>{tr(x)}</option>))}</select></F><F label={tr("Estado do evento")}><select value={b.eventState || 'activo'} onChange={e => change('eventState', e.target.value)}>{tr(['activo', 'adiado', 'cancelado', 'concluido'].map(x => <option key={x} value={x}>{tr(x)}</option>))}</select></F>{tr([['start', 'Início'], ['end', 'Fim'], ['registrationStarts', 'Abertura das inscrições'], ['registrationEnds', 'Fecho das inscrições']].map(([key, label]) => <F key={key} label={tr(label + ' · Maputo (UTC+2)')}><input type="datetime-local" value={localDate(b[key] || '')} onChange={e => change(key, maputoDate(e.target.value))}/></F>))}<F label={tr("Vagas (0 = sem limite)")}><input type="number" min={0} value={b.capacity || 0} onChange={e => change('capacity', Number(e.target.value))}/></F></div>{tr([['registrationOpen', 'Aceitar inscrições'], ['approval', 'Exigir aprovação da inscrição'], ['allDay', 'Evento de dia inteiro']].map(([k, label]) => <label key={k}><input type="checkbox" checked={!!b[k]} onChange={e => change(k, e.target.checked)}/>{tr(label)}</label>))}{tr([['speakers', 'Oradores'], ['programme', 'Programa']].map(([k, label]) => <F key={k} label={tr(label)}><textarea value={b[k] || ''} onChange={e => change(k, e.target.value)}/></F>))}<h3>{tr("Sess\u00F5es")}</h3>{tr((b.sessions || []).map((s: any, i: number) => <div className="panel" key={s.id}>{tr([['title', 'Título'], ['start', 'Início'], ['end', 'Fim']].map(([k, label]) => <F key={k} label={tr(label)}><input type={k === 'title' ? 'text' : 'datetime-local'} value={k === 'title' ? s[k] : localDate(s[k] || '')} onChange={e => change('sessions', b.sessions.map((v: any, j: number) => i === j ? { ...v, [k]: k === 'title' ? e.target.value : maputoDate(e.target.value) } : v))}/></F>))}<button type="button" onClick={() => change('sessions', b.sessions.filter((_: any, j: number) => j !== i))}>{tr("Remover sess\u00E3o")}</button></div>))}<button type="button" onClick={() => change('sessions', [...(b.sessions || []), { id: academyRequestId(), title: '', start: '', end: '' }])}>{tr("Adicionar sess\u00E3o")}</button></>)}
 <h2>{tr("Publica\u00E7\u00E3o")}</h2><F label={tr("Visibilidade")}><select value={b.visibility || 'publico'} onChange={e => change('visibility', e.target.value)}><option value="publico">{tr("P\u00FAblico")}</option><option value="privado">{tr("Reservado \u00E0 gest\u00E3o")}</option></select></F>{tr([['publishAt', 'Agendar publicação'], ['expiresAt', 'Retirar da publicação']].map(([k, label]) => <F key={k} label={tr(label + ' · Maputo (UTC+2)')}><input type="datetime-local" value={localDate(b[k] || '')} onChange={e => change(k, maputoDate(e.target.value))}/></F>))}<F label={tr("Estado")}><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{tr([['rascunho', 'Rascunho'], ['em_revisao', 'Em revisão'], ['publicado', 'Publicado'], ['agendado', 'Agendado'], ['arquivado', 'Arquivado'], ['lixo', 'Lixeira']].map(([k, label]) => <option key={k} value={k}>{tr(label)}</option>))}</select></F></fieldset>)}
 <div className="row wrap"><button disabled={busy} onClick={() => submit()}>{tr(busy ? 'A guardar…' : 'Guardar')}</button><button disabled={busy} onClick={() => submit('rascunho')}>{tr("Guardar rascunho")}</button>{tr(form.revision > 0 && <><button onClick={async () => { try {
        const { academyReadJson } = await import('@/lib/academy-client');
        setHistory((await academyReadJson('/api/workspace?history=' + form.id)).history);
    }
    catch (e: any) {
        setError(e.message);
    } }}>{tr("Ver hist\u00F3rico")}</button><button onClick={async () => { try {
        const r = await completion({ action: 'editorial_duplicate', id: form.id });
        acceptForm(r.entry);
        setSaved(JSON.stringify(r.entry));
    }
    catch (e: any) {
        setError(e.message);
    } }}>{tr("Duplicar")}</button></>)}</div><p role="status">{tr(busy ? 'A guardar…' : !form.revision ? 'Novo registo por guardar.' : dirty ? 'Alterações por guardar.' : 'Registo guardado.')}</p>{tr(history.length > 0 && <section><h2>{tr("Hist\u00F3rico")}</h2>{tr(history.map(h => <button key={h.revision} onClick={() => setSelected(h)}>{tr("Revis\u00E3o ")}{tr(h.revision)}{tr(" \u00B7 ")}{tr(new Date(h.created).toLocaleString(getLocale()))}</button>))}</section>)}{tr(selected && <section><h3>{tr("Comparar com a revis\u00E3o ")}{tr(selected.revision)}</h3><div className="form-grid"><div><h4>{tr("Vers\u00E3o actual")}</h4><pre className="editor-comparison">{tr(JSON.stringify({ title: form.title, body: form.body }, null, 2))}</pre></div><div><h4>{tr("Vers\u00E3o anterior")}</h4><pre className="editor-comparison">{tr(JSON.stringify(JSON.parse(selected.payload), null, 2))}</pre></div></div><button onClick={async () => { try {
        const r = await completion({ action: 'editorial_restore', id: form.id, revision: form.revision, fromRevision: selected.revision });
        dispatch({type:'reset',form:r.entry});
        setSaved(JSON.stringify(r.entry));
        setSelected(null);
    }
    catch (e: any) {
        setError(e.message);
    } }}>{tr("Restaurar como novo rascunho")}</button></section>)}{tr(form.kind === 'evento' && form.revision > 0 && <EventPanel id={form.id} management/>)}</section>;
}
