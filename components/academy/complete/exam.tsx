'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useState } from 'react';
import { completion } from './common';
export function ExamMode({ run }: {
    run: any;
}) { const [warning, setWarning] = useState(''), [full, setFull] = useState(false); useEffect(() => { if (!run?.examMode || run.state !== 'active')
    return; let last = 0; const report = (kind: string) => { setWarning('Foi registada uma interrupção ou tentativa de copiar conteúdo durante a avaliação.'); if (Date.now() - last < 2000)
    return; last = Date.now(); void completion({ action: 'exam_event', runId: run.id, kind }).catch(() => { }); }; const blur = () => report('blur'), visibility = () => { if (document.hidden)
    report('hidden'); }, fs = () => { setFull(!!document.fullscreenElement); if (!document.fullscreenElement)
    report('fullscreen_exit'); }, block = (e: Event) => { e.preventDefault(); report(e.type); }; window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility); document.addEventListener('fullscreenchange', fs); for (const name of ['copy', 'paste', 'contextmenu'])
    document.addEventListener(name, block); return () => { window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('fullscreenchange', fs); for (const name of ['copy', 'paste', 'contextmenu'])
    document.removeEventListener(name, block); }; }, [run?.id, run?.state, run?.examMode]); if (!run?.examMode || run.state !== 'active')
    return null; return <aside><p>{tr("Modo de exame activo. As sa\u00EDdas do ecr\u00E3 e tentativas de copiar ou colar s\u00E3o registadas.")}</p>{tr(!full && <button type="button" onClick={() => document.documentElement.requestFullscreen?.().catch(() => setWarning('Ecrã inteiro indisponível neste navegador.'))}>{tr("Abrir em ecr\u00E3 inteiro")}</button>)}<p role="status">{tr(warning)}</p><span className="exam-watermark">{tr("Academia INS \u00B7 Sess\u00E3o ")}{tr(run.id)}{tr(" \u00B7 ")}{tr(new Date(run.started).toLocaleString(getLocale()))}</span></aside>; }
export function OrderedAnswer({ question: q, value, onChange }: {
    question: any;
    value: any;
    onChange: (v: number[]) => void;
}) { const selected = Array.isArray(value) ? value : q.options.map((_: any, i: number) => i); return <div>{tr(q.options.map((o: string, i: number) => <label className="field" key={i}><span>{tr(q.type === 'ordem' ? 'Posição ' + (i + 1) : o.split(' → ')[0])}</span><select value={selected[i]} onChange={e => { const next = selected.slice(); next[i] = Number(e.target.value); onChange(next); }}>{tr(q.options.map((v: string, j: number) => <option value={j} key={j}>{tr(q.type === 'ordem' ? v : v.split(' → ').slice(1).join(' → ') || v)}</option>))}</select></label>))}<button type="button" onClick={() => onChange(selected)}>{tr("Confirmar ordem / correspond\u00EAncias")}</button></div>; }
export function ManualAssessments({ courseId }: {
    courseId: string;
}) { const [runs, setRuns] = useState<any[]>([]), [marks, setMarks] = useState<any>({}), [error, setError] = useState(''); const load = () => completion(undefined, '?manual=' + courseId).then(r => setRuns(r.runs)).catch(e => setError(e.message)); useEffect(() => { void load(); }, [courseId]); return <section><h2>{tr("Correc\u00E7\u00F5es pendentes")}</h2><p role="alert">{tr(error)}</p>{tr(runs.map(r => <form key={r.id} className="panel" onSubmit={async (e) => { e.preventDefault(); try {
    await completion({ action: 'assessment_grade', id: r.id, marks: marks[r.id] || {} });
    await load();
}
catch (e: any) {
    setError(e.message);
} }}><h3>{tr(r.title)}{tr(" \u00B7 ")}{tr(r.participant)}</h3>{tr(r.questions.filter((q: any) => q.type === 'longa').map((q: any) => <div key={q.id}><h4>{tr(q.prompt)}</h4><p style={{ whiteSpace: 'pre-wrap' }}>{tr(r.answers[q.id])}</p><label className="field">{tr("Nota da resposta (%)")}<input required type="number" min={0} max={100} value={marks[r.id]?.[q.id] ?? ''} onChange={e => setMarks({ ...marks, [r.id]: { ...marks[r.id], [q.id]: Number(e.target.value) } })}/></label></div>))}<button>{tr("Guardar correc\u00E7\u00E3o")}</button></form>))}{tr(!runs.length && <p>{tr("Sem respostas por corrigir.")}</p>)}</section>; }
