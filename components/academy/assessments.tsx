'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { ExamMode, OrderedAnswer, ManualAssessments } from './complete/exam';
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ClipboardCheck, Clock, History, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { entriesOf, courseAssessments, type Entry, type Workspace, type Question } from '@/lib/academy-workspace';
import { academyRequestId } from '@/lib/academy-client';
import { F, Heading, NoRecords, type WorkspaceRequest } from './workspace';
const types = { unica: 'Escolha única', multipla: 'Múltiplas respostas', verdadeiro: 'Verdadeiro / falso', curta: 'Resposta curta', longa: 'Resposta longa (correcção manual)', ordem: 'Ordenação', associacao: 'Associação' };
function AssessmentEditor({ value, courses, readOnly, save, bank }: {
    bank: Entry[];
    value: Entry;
    courses: any[];
    readOnly: boolean;
    save: (body: any) => Promise<void>;
}) {
    const [form, setForm] = useState({ ...value, body: { stage: 'pre', pass: 80, minutes: 0, attempts: 0, questionCount: 0, random: false, questions: [], ...value.body } }), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const b = form.body;
    const update = (key: string, v: any) => setForm({ ...form, body: { ...b, [key]: v } });
    const patch = (i: number, key: string, v: any) => update('questions', b.questions.map((q: Question, j: number) => i === j ? { ...q, [key]: v } : q));
    return <form className="form assessment-editor" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
        await save({ ...form, action: 'entry' });
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }}>
 <fieldset disabled={busy || readOnly} className="editor-fields"><F label={tr("T\u00EDtulo da avalia\u00E7\u00E3o")}><Input required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></F><div className="form-grid"><F label={tr("Curso")}><select required value={b.courseId || ''} onChange={e => update('courseId', e.target.value)}><option value="">{tr("Seleccione um curso")}</option>{tr(courses.map(c => <option key={c.id} value={c.id}>{tr(c.title)}</option>))}</select></F><F label={tr("Finalidade")}><select value={b.stage} onChange={e => update('stage', e.target.value)}><option value="pre">{tr("Pr\u00E9-teste diagn\u00F3stico")}</option><option value="pos">{tr("P\u00F3s-teste / avalia\u00E7\u00E3o final")}</option></select></F></div><p>{tr(b.stage === 'pre' ? 'O pré-teste regista o conhecimento inicial e não entra na nota final nem na emissão do certificado.' : 'A classificação do pós-teste integra o resultado do curso. A conclusão exige também todas as aulas concluídas.')}</p><div className="form-grid"><F label={tr("Nota m\u00EDnima (%)")}><Input required type="number" min={1} max={100} value={b.pass} onChange={e => update('pass', Number(e.target.value))}/></F><F label={tr("Tempo em minutos (0 = sem temporizador)")}><Input type="number" min={0} max={240} value={b.minutes} onChange={e => update('minutes', Number(e.target.value))}/></F><F label={tr("Tentativas permitidas (0 = sem limite)")}><Input type="number" min={0} max={100} value={b.attempts} onChange={e => update('attempts', Number(e.target.value))}/></F><F label={tr("Quest\u00F5es por tentativa (0 = todas)")}><Input type="number" min={0} max={b.questions.length} value={b.questionCount} onChange={e => update('questionCount', Number(e.target.value))}/></F></div><label className="check-option"><input type="checkbox" checked={b.random} onChange={e => update('random', e.target.checked)}/>{tr("Sortear a ordem das quest\u00F5es")}</label>
 <label className="check-option"><input type="checkbox" checked={!!b.examMode} onChange={e => update('examMode', e.target.checked)}/>{tr("Activar modo de exame")}</label><F label={tr("Reutilizar quest\u00E3o do banco")}><select value="" onChange={e => { const q = bank.find(v => v.id === e.target.value)?.body.question; if (q)
        update('questions', [...b.questions, { ...q, id: academyRequestId() }]); }}><option value="">{tr("Seleccione")}</option>{tr(bank.map(v => <option key={v.id} value={v.id}>{tr(v.title)}</option>))}</select></F><div className="assessment-bank">{tr(b.questions.map((q: Question, i: number) => <section className="editor-block" key={q.id}><header><h3>{tr("Quest\u00E3o ")}{tr(i + 1)}</h3>{tr(!readOnly && <Button type="button" variant="ghost" onClick={() => update('questions', b.questions.filter((_: any, j: number) => j !== i))}><Trash2 size={15}/>{tr("Retirar quest\u00E3o")}</Button>)}</header><F label={tr("Tipo de quest\u00E3o")}><select value={q.type} onChange={e => { const type = e.target.value; update('questions', b.questions.map((v: Question, j: number) => i === j ? { ...v, type, options: type === 'verdadeiro' ? ['Verdadeiro', 'Falso'] : type === 'curta' ? [] : ['', ''], answer: type === 'multipla' ? [] : type === 'curta' ? '' : 0 } : v)); }}>{tr(Object.entries(types).map(([v, l]) => <option key={v} value={v}>{tr(l)}</option>))}</select></F><F label={tr("Pergunta")}><Textarea required value={q.prompt} onChange={e => patch(i, 'prompt', e.target.value)}/></F>{tr(q.type === 'longa' ? <p>{tr("A resposta ser\u00E1 corrigida pelo formador.")}</p> : ['ordem', 'associacao'].includes(q.type) ? <><F label={tr(q.type === 'ordem' ? 'Elementos, um por linha' : 'Pares: esquerda → direita, um por linha')}><Textarea value={q.options.join('\n')} onChange={e => patch(i, 'options', e.target.value.split('\n'))}/></F><F label={tr("\u00CDndices correctos (come\u00E7am em 1), separados por v\u00EDrgula")}><Input value={Array.isArray(q.answer) ? q.answer.map(v => v + 1).join(',') : ''} onChange={e => patch(i, 'answer', e.target.value.split(',').map(v => Number(v.trim()) - 1))}/></F></> : q.type === 'curta' ? <F label={tr("Resposta aceite (use | entre alternativas)")}><Input required value={String(q.answer)} onChange={e => patch(i, 'answer', e.target.value)}/></F> : <><F label={tr("Op\u00E7\u00F5es (uma por linha)")}><Textarea required readOnly={q.type === 'verdadeiro'} value={q.options.join('\n')} onChange={e => { const options = e.target.value.split('\n'); update('questions', b.questions.map((v: Question, j: number) => i === j ? { ...v, options, answer: q.type === 'multipla' ? (Array.isArray(q.answer) ? q.answer.filter(x => x < options.length) : []) : Number(q.answer) < options.length ? q.answer : 0 } : v)); }}/></F><fieldset className="correct-answer"><legend>{tr("Resposta")}{tr(q.type === 'multipla' ? 's' : '')}{tr(" correcta")}{tr(q.type === 'multipla' ? 's' : '')}</legend>{tr(q.options.map((o, j) => <label className="check-option" key={j}><input type={q.type === 'multipla' ? 'checkbox' : 'radio'} name={'answer-' + q.id} checked={q.type === 'multipla' ? Array.isArray(q.answer) && q.answer.includes(j) : q.answer === j} onChange={e => patch(i, 'answer', q.type === 'multipla' ? (e.target.checked ? [...(Array.isArray(q.answer) ? q.answer : []), j] : (Array.isArray(q.answer) ? q.answer : []).filter(x => x !== j)) : j)}/>{tr(o || 'Opção ' + (j + 1))}</label>))}</fieldset></>)}<F label={tr("Explica\u00E7\u00E3o na revis\u00E3o")}><Textarea value={q.explanation} onChange={e => patch(i, 'explanation', e.target.value)}/></F></section>))}</div>
 {tr(!readOnly && <Button type="button" variant="outline" disabled={b.questions.length >= 100} onClick={() => update('questions', [...b.questions, { id: academyRequestId(), type: 'unica', prompt: '', options: ['', ''], answer: 0, explanation: '' }])}><Plus size={16}/>{tr("Adicionar quest\u00E3o")}</Button>)}<F label={tr("Estado")}><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Entry['status'] })}><option value="rascunho">{tr("Rascunho")}</option><option value="publicado">{tr("Dispon\u00EDvel no curso")}</option><option value="arquivado">{tr("Arquivado")}</option></select></F><p role="status" className="editor-error">{tr(error)}</p>{tr(!readOnly && <Button disabled={busy} type="submit"><Save size={16}/>{tr(busy ? 'A guardar…' : 'Guardar avaliação')}</Button>)}</fieldset>{tr(readOnly && <p>{tr("Para alterar o conte\u00FAdo de um curso publicado, prepare uma c\u00F3pia em rascunho na ficha do curso. As tentativas anteriores mant\u00EAm as quest\u00F5es da vers\u00E3o utilizada.")}</p>)}
 </form>;
}
export function AssessmentsPanel({ work, data, request, reload, courseId, readOnly = false }: {
    work: Workspace;
    data: any;
    request: WorkspaceRequest;
    reload: () => Promise<any>;
    courseId?: string;
    readOnly?: boolean;
}) {
    const [editing, setEditing] = useState<Entry | null>(null), [selected, setSelected] = useState(courseId || '');
    const all = entriesOf(work, 'avaliacao').filter(e => !selected || e.body.courseId === selected);
    const courses = data.courses.filter((c: any) => !c.external);
    const draftCourses = courses.filter((c: any) => c.status === 'rascunho' && c.permissions?.edit !== false);
    return <><Heading title={tr("Avalia\u00E7\u00F5es")} text={tr("Organize os pr\u00E9-testes e os p\u00F3s-testes de cada curso.")}>{tr(!readOnly && draftCourses.length > 0 && <Button onClick={() => setEditing({ id: academyRequestId(), kind: 'avaliacao', title: '', status: 'rascunho', revision: 0, created: '', updated: '', body: { courseId: draftCourses.find((c: any) => c.id === selected)?.id || draftCourses[0]?.id || '' } })}><Plus size={16}/>{tr("Criar avalia\u00E7\u00E3o")}</Button>)}</Heading>{tr(!courseId && <F label={tr("Filtrar por curso")}><select value={selected} onChange={e => setSelected(e.target.value)}><option value="">{tr("Todos os cursos")}</option>{tr(courses.map((c: any) => <option key={c.id} value={c.id}>{tr(c.title)}</option>))}</select></F>)}<div className="workspace-records">{tr(all.map(e => <article className="panel workspace-record" key={e.id}><span className="badge">{tr(e.body.stage === 'pre' ? 'Pré-teste' : 'Pós-teste')}</span><h2>{tr(e.title)}</h2><p>{tr(data.courses.find((c: any) => c.id === e.body.courseId)?.title)}</p><p>{tr(e.body.questions?.length || e.body.questionTotal || 0)}{tr(" quest\u00F5es \u00B7 ")}{tr(e.body.minutes ? e.body.minutes + ' min' : 'Sem temporizador')}{tr(" \u00B7 ")}{tr(e.status === 'publicado' ? 'Disponível' : e.status === 'arquivado' ? 'Arquivado' : 'Rascunho')}</p><Button variant="outline" onClick={() => setEditing(e)}>{tr(data.courses.find((c: any) => c.id === e.body.courseId)?.status === 'rascunho' ? 'Editar' : 'Consultar')}</Button></article>))}</div>{tr(!all.length && <NoRecords>{tr("Ainda n\u00E3o existem avalia\u00E7\u00F5es neste filtro.")}</NoRecords>)}<Dialog open={!!editing} onOpenChange={v => !v && setEditing(null)}><DialogContent className="dialog-wide"><DialogHeader><DialogTitle>{tr(editing?.revision ? 'Avaliação' : 'Criar avaliação')}</DialogTitle><DialogDescription>{tr("Prepare perguntas e respostas a partir dos conte\u00FAdos aprovados.")}</DialogDescription></DialogHeader>{tr(editing && <AssessmentEditor bank={entriesOf(work, 'banco_questao').filter(v => v.body.courseId === editing.body.courseId)} value={editing} courses={editing.revision ? courses : draftCourses} readOnly={readOnly || !draftCourses.some((c: any) => c.id === editing.body.courseId)} save={async (body) => { await request(body); for (const q of body.body.questions) {
        const existing = work.entries.find(v => v.kind === 'banco_questao' && v.id === 'bank-' + q.id);
        await request({ action: 'entry', kind: 'banco_questao', id: 'bank-' + q.id, title: q.prompt.slice(0, 200), status: 'rascunho', revision: existing?.revision || 0, body: { courseId: body.body.courseId, question: q } });
    } await reload(); setEditing(null); }}/>)}</DialogContent></Dialog>{tr(selected && <ManualAssessments courseId={selected}/>)}</>;
}
function answerText(q: any, value: any) { if (value === null || value === undefined)
    return 'Sem resposta'; if (['curta', 'longa'].includes(q.type))
    return String(value); if (Array.isArray(value))
    return value.map(i => q.options[i]).join('; ') || 'Sem resposta'; return q.options[value] ?? 'Sem resposta'; }
export function LearningAssessments({ work, courseId, enrollmentId, request, onResult }: {
    work: Workspace;
    courseId: string;
    enrollmentId: string;
    request: WorkspaceRequest;
    onResult: () => Promise<any>;
}) {
    const list = courseAssessments(work, courseId).filter(e => e.status === 'publicado');
    const [run, setRun] = useState<any>(null), [answers, setAnswers] = useState<any>({}), [runs, setRuns] = useState<any[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [clock, setClock] = useState(Date.now()), [saved, setSaved] = useState('');
    const submitRef = useRef<() => void>(() => { }), autoSubmitted = useRef('');
    const loadRuns = async () => { const r = await request(undefined, '/api/workspace?runs=' + encodeURIComponent(enrollmentId)); setRuns(r.runs); };
    useEffect(() => { loadRuns().catch(e => setError(e.message)); }, [enrollmentId]);
    useEffect(() => { if (run?.state !== 'active')
        return; const id = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(id); }, [run?.id, run?.state]);
    const serial = JSON.stringify(answers);
    useEffect(() => { if (run?.state !== 'active')
        return; const id = setTimeout(() => { request({ action: 'assessment_answers', id: run.id, answers: JSON.parse(serial) }).then(r => setSaved(r.saved ? 'Respostas guardadas.' : 'Tempo terminado.')).catch(e => setError(e.message)); }, 600); return () => clearTimeout(id); }, [serial, run?.id, run?.state]);
    const remaining = run?.deadline ? Math.max(0, Math.ceil((Date.parse(run.deadline) - clock) / 1000)) : null;
    useEffect(() => { if (run?.state === 'active' && remaining === 0 && autoSubmitted.current !== run.id) {
        autoSubmitted.current = run.id;
        submitRef.current();
    } }, [remaining, run?.state, run?.id]);
    async function start(e: Entry) { setBusy(true); setError(''); setSaved(''); try {
        const r = await request({ action: 'assessment_start', enrollmentId, assessmentId: e.id, requestId: academyRequestId() });
        setRun(r);
        setAnswers(r.answers || {});
        setClock(Date.now());
        autoSubmitted.current = '';
        await loadRuns();
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function review(id: string) { setBusy(true); setError(''); try {
        const r = await request(undefined, '/api/workspace?run=' + encodeURIComponent(id));
        setRun(r);
        setAnswers(r.answers || {});
        setClock(Date.now());
        autoSubmitted.current = '';
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function submit() { if (busy)
        return; setBusy(true); setError(''); try {
        const r = await request({ action: 'assessment_submit', id: run.id, answers });
        setRun(r);
        await loadRuns();
        await onResult();
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    submitRef.current = submit;
    return <section className="learning-assessments"><span className="eyebrow">{tr("AVALIA\u00C7\u00D5ES DO CURSO")}</span><h2>{tr("Pr\u00E9-teste e p\u00F3s-teste")}</h2><p>{tr("O pr\u00E9-teste \u00E9 diagn\u00F3stico e n\u00E3o influencia a nota final. O p\u00F3s-teste integra o resultado do curso. As tentativas ficam no hist\u00F3rico.")}</p><p className="editor-error" role="alert">{tr(error)}</p>
 {tr(!run && <div className="assessment-list">{tr(list.map(e => <article key={e.id} className="assessment-choice"><div><span className="badge">{tr(e.body.stage === 'pre' ? 'Pré-teste' : 'Pós-teste')}</span><h3>{tr(e.title)}</h3><p>{tr(e.body.minutes ? e.body.minutes + ' minutos' : 'Sem temporizador')}{tr(" \u00B7 ")}{tr(e.body.attempts ? e.body.attempts + ' tentativas' : 'Tentativas sem limite')}</p></div><Button disabled={busy} onClick={() => start(e)}>{tr("Iniciar / retomar")}</Button></article>))}</div>)}
 {tr(run && <><div className="row between wrap"><h3>{tr(run.title)}</h3>{tr(run.state === 'active' && remaining !== null && <strong className="assessment-timer" role="timer"><Clock size={17}/>{tr(Math.floor(remaining / 60))}{tr(":")}{tr(String(remaining % 60).padStart(2, '0'))}</strong>)}</div>{tr(run.state === 'active' ? <form onSubmit={e => { e.preventDefault(); submit(); }}><ExamMode run={run}/><p>{tr("Responda \u00E0s quest\u00F5es e submeta a tentativa. ")}{tr(run.deadline && 'Ao terminar o tempo, são submetidas as respostas já guardadas.')}</p>{tr(run.questions.map((q: any, i: number) => <fieldset className="question" key={q.id}><legend>{tr(i + 1)}{tr(". ")}{tr(q.prompt)}</legend>{tr(q.type === 'longa' ? <Textarea aria-label={tr('Resposta à questão ' + (i + 1))} value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}/> : ['ordem', 'associacao'].includes(q.type) ? <OrderedAnswer question={q} value={answers[q.id]} onChange={v => setAnswers({ ...answers, [q.id]: v })}/> : q.type === 'curta' ? <Input aria-label={tr('Resposta à questão ' + (i + 1))} value={answers[q.id] || ''} disabled={busy || remaining === 0} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}/> : q.options.map((o: string, j: number) => <label className="answer" key={j}><input disabled={busy || remaining === 0} type={q.type === 'multipla' ? 'checkbox' : 'radio'} name={'question-' + q.id} checked={q.type === 'multipla' ? (answers[q.id] || []).includes(j) : answers[q.id] === j} onChange={e => setAnswers({ ...answers, [q.id]: q.type === 'multipla' ? (e.target.checked ? [...(answers[q.id] || []), j] : (answers[q.id] || []).filter((x: number) => x !== j)) : j })}/>{tr(o)}</label>))}</fieldset>))}<div className="row wrap"><Button disabled={busy} type="submit">{tr(busy ? 'A submeter…' : remaining === 0 ? 'Concluir submissão' : 'Submeter avaliação')}</Button><small role="status">{tr(saved)}</small></div></form> : <><div className={'result-box ' + (run.score >= run.pass ? 'passed' : '')}><strong>{tr(run.state === 'pending' ? 'Aguarda correcção' : run.score + '%')}</strong><h3>{tr(run.state === 'pending' ? 'As respostas serão avaliadas pelo formador' : run.stage === 'pre' ? 'Resultado do pré-teste' : run.score >= run.pass ? 'Avaliação aprovada' : 'Nota mínima não atingida')}</h3><p>{tr(run.stage === 'pre' ? 'Resultado diagnóstico, sem peso na nota final.' : 'Nota mínima: ' + run.pass + '%.')}</p>{tr(run.review?.expired && <p>{tr("O tempo terminou. Foram consideradas as respostas guardadas at\u00E9 ao prazo.")}</p>)}</div><h3>{tr("Revis\u00E3o das respostas")}</h3>{tr(run.review?.questions.map((q: any, i: number) => <article className={'assessment-review ' + (q.correct ? 'correct' : 'incorrect')} key={q.id}><h4>{tr(i + 1)}{tr(". ")}{tr(q.prompt)}</h4><p><strong>{tr("A sua resposta:")}</strong> {tr(answerText(q, q.selected))}</p><p><strong>{tr("Resposta correcta:")}</strong> {tr(answerText(q, q.answer))}</p><p className="assessment-review-state">{tr(q.correct ? 'Resposta correcta' : 'Resposta incorrecta')}</p>{tr(q.explanation && <p>{tr(q.explanation)}</p>)}</article>))}<Button variant="outline" onClick={() => { setRun(null); setError(''); }}>{tr("Voltar \u00E0s avalia\u00E7\u00F5es")}</Button></>)}</>)}
 <section className="history"><h3><History size={17}/>{tr(" Hist\u00F3rico de tentativas")}</h3>{tr(runs.length ? runs.map(r => <div className="assessment-history" key={r.id}><div><strong>{tr(list.find(e => e.id === r.assessmentId)?.title || 'Avaliação')}{tr(" \u00B7 ")}{tr(r.stage === 'pre' ? 'Pré-teste' : 'Pós-teste')}</strong><p>{tr(new Date(r.started).toLocaleString(getLocale()))}{tr(" \u00B7 ")}{tr(r.state === 'submitted' ? r.score + '%' : r.state === 'pending' ? 'Aguarda correcção' : 'Em curso')}</p></div><Button variant="outline" disabled={busy} onClick={() => review(r.id)}>{tr(r.state === 'submitted' ? 'Rever respostas' : 'Retomar')}</Button></div>) : <p>{tr("Ainda n\u00E3o existem tentativas.")}</p>)}</section></section>;
}
