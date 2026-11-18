'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useRef, useState } from 'react';
import { PackagePanel } from './packages';
import { F } from '../workspace';
import { completion, ErrorText, ImageField, ImageUrl, localDate, maputoDate } from './common';
import { academyFetch, academyRequestId } from '@/lib/academy-client';
export function LearningExtras({ courseId, lessonId = '', management = false, work, request, reload }: {
    courseId: string;
    lessonId?: string;
    management?: boolean;
    work?: any;
    request?: (v: any) => Promise<any>;
    reload?: () => Promise<any>;
}) {
    const [data, setData] = useState<any>(null), [error, setError] = useState(''), [draft, setDraft] = useState<any>(null), [content, setContent] = useState(''), [busy, setBusy] = useState(false), [responses, setResponses] = useState<Record<string, string>>({}), [files, setFiles] = useState<Record<string, string>>({});
    const session = useRef(academyRequestId()), active = useRef(Date.now());
    const load = () => completion(undefined, '?course=' + courseId).then(setData).catch(e => setError(e.message));
    useEffect(() => { void load(); }, [courseId]);
    useEffect(() => { if (management || !lessonId)
        return; const touch = () => active.current = Date.now(); const ping = () => { if (document.visibilityState === 'visible' && Date.now() - active.current < 120000)
        void completion({ action: 'study_ping', courseId, lessonId, session: session.current }).catch(() => { }); }; for (const name of ['pointerdown', 'keydown', 'scroll'])
        window.addEventListener(name, touch); ping(); const timer = setInterval(ping, 15000); return () => { clearInterval(timer); for (const name of ['pointerdown', 'keydown', 'scroll'])
        window.removeEventListener(name, touch); }; }, [courseId, lessonId, management]);
    async function act(b: any) { setBusy(true); setError(''); try {
        await completion({ ...b, courseId, lessonId });
        await load();
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    return <section><h2>{tr(management ? 'Actividades e trabalhos' : 'Actividades do curso')}</h2><ErrorText value={error}/>{tr(management && <button onClick={() => setDraft({ kind: 'tarefa', id: academyRequestId(), title: '', revision: 0, status: 'rascunho', body: { courseId, required: true, pass: 50, weight: 0, allowFile: true } })}>{tr("Criar actividade")}</button>)}{tr(draft && <form className="panel form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try {
        await request!({ ...draft, action: 'entry' });
        await reload?.();
        await load();
        setDraft(null);
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }}><F label={tr("T\u00EDtulo")}><input required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></F><F label={tr("Instru\u00E7\u00F5es")}><textarea value={draft.body.description || ''} onChange={e => setDraft({ ...draft, body: { ...draft.body, description: e.target.value } })}/></F><F label={tr("Prazo \u00B7 Maputo (UTC+2)")}><input type="datetime-local" value={localDate(draft.body.due || '')} onChange={e => setDraft({ ...draft, body: { ...draft.body, due: maputoDate(e.target.value) } })}/></F>{tr([['pass', 'Nota mínima (%)'], ['weight', 'Peso na nota das actividades']].map(([k, label]) => <F key={k} label={tr(label)}><input type="number" min={0} max={100} value={draft.body[k] || 0} onChange={e => setDraft({ ...draft, body: { ...draft.body, [k]: Number(e.target.value) } })}/></F>))}{tr([['required', 'Obrigatória para concluir'], ['allowFile', 'Aceitar ficheiro PDF ou texto']].map(([k, label]) => <label key={k}><input type="checkbox" checked={!!draft.body[k]} onChange={e => setDraft({ ...draft, body: { ...draft.body, [k]: e.target.checked } })}/>{tr(label)}</label>))}<F label={tr("Estado")}><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>{tr(['rascunho', 'publicado', 'arquivado'].map(v => <option key={v} value={v}>{tr(v)}</option>))}</select></F><button disabled={busy}>{tr("Guardar actividade")}</button><button type="button" onClick={() => setDraft(null)}>{tr("Fechar")}</button></form>)}
 {tr(data?.tasks.map((task: any) => { const s = data.submissions.find((s: any) => s.assignmentId === task.id); return <article className="panel" key={task.id}><h3>{tr(task.title)}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{tr(task.body.description)}</p><p>{tr(task.body.due ? 'Prazo: ' + new Date(task.body.due).toLocaleString(getLocale(), { timeZone: 'Africa/Maputo' }) : 'Sem prazo definido')}</p>{tr(management ? <><button onClick={() => setDraft(task)}>{tr("Editar actividade")}</button>{tr(data.submissions.filter((s: any) => s.assignmentId === task.id).map((s: any) => <GradeSubmission key={s.id} submission={s} save={act}/>))}</> : <><p>{tr(s ? { submetido: 'Entregue, aguarda avaliação', avaliado: 'Avaliado' }[s.state as 'submetido' | 'avaliado'] : 'Por entregar')}{tr(s?.score != null ? ' · ' + s.score + '%' : '')}</p>{tr(s?.feedback && <p>{tr(s.feedback)}</p>)}{tr(s?.state !== 'avaliado' && <><F label={tr("Resposta")}><textarea maxLength={20000} value={responses[task.id] ?? s?.body ?? ''} onChange={e => setResponses({ ...responses, [task.id]: e.target.value })}/></F>{tr(task.body.allowFile && <F label={tr("Anexar PDF ou texto \u00B7 at\u00E9 20 MB")}><input type="file" accept="application/pdf,text/plain" disabled={busy} onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
        return; setBusy(true); try {
        const form = new FormData();
        form.set('file', file);
        const r = await completion(form, '?upload=assignment');
        setFiles({ ...files, [task.id]: r.id });
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }}/></F>)}<button disabled={busy} onClick={() => act({ action: 'assignment_submit', assignmentId: task.id, revision: s?.revision || 0, content: responses[task.id] ?? s?.body ?? '', fileId: files[task.id] ?? s?.fileId ?? '' })}>{tr("Entregar trabalho")}</button></>)}</>)}</article>; }))}
 {tr(!data?.tasks.length && <p>{tr("Sem actividades adicionais publicadas.")}</p>)}{tr(!management && data && <p>{tr("Tempo de estudo registado: ")}{tr(Math.floor(data.study / 60))}{tr(" minutos.")}</p>)}{tr(!management && lessonId && <PackagePanel courseId={courseId} lessonId={lessonId}/>)}<h2>{tr(lessonId ? 'Comentários da aula' : 'Fórum do curso')}</h2>{tr(data?.discussions.filter((d: any) => !lessonId || d.lessonId === lessonId).map((d: any) => <article className="panel" key={d.id}><strong>{tr(d.name)}</strong><small>{tr(" \u00B7 ")}{tr(new Date(d.created).toLocaleString(getLocale()))}</small><p style={{ whiteSpace: 'pre-wrap' }}>{tr(d.content)}</p>{tr(management && <button onClick={() => act({ action: 'discussion_moderate', id: d.id, hide: d.state !== 'oculto' })}>{tr(d.state === 'oculto' ? 'Repor comentário' : 'Ocultar comentário')}</button>)}</article>))}{tr(!management && <form onSubmit={async (e) => { e.preventDefault(); await act({ action: 'discussion_post', content }); setContent(''); }}><F label={tr("Escrever coment\u00E1rio")}><textarea required maxLength={5000} value={content} onChange={e => setContent(e.target.value)}/></F><button disabled={busy}>{tr("Publicar coment\u00E1rio")}</button></form>)}</section>;
}
function GradeSubmission({ submission: s, save }: {
    submission: any;
    save: (b: any) => Promise<any>;
}) { const [score, setScore] = useState(s.score ?? ''), [feedback, setFeedback] = useState(s.feedback || ''); return <form className="panel" onSubmit={e => { e.preventDefault(); void save({ action: 'assignment_grade', id: s.id, revision: s.revision, score: Number(score), feedback }); }}><h4>{tr(s.participant)}</h4><p style={{ whiteSpace: 'pre-wrap' }}>{tr(s.body)}</p>{tr(s.fileId && <button type="button" onClick={async () => { const r = await academyFetch('/api/completion?file=' + s.fileId); if (!r.ok)
    return; const u = URL.createObjectURL(await r.blob()), a = document.createElement('a'); a.href = u; a.download = 'trabalho'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }}>{tr("Descarregar trabalho")}</button>)}<F label={tr("Nota (%)")}><input required type="number" min={0} max={100} value={score} onChange={e => setScore(e.target.value)}/></F><F label={tr("Coment\u00E1rio do formador")}><textarea value={feedback} onChange={e => setFeedback(e.target.value)}/></F><button>{tr("Guardar avalia\u00E7\u00E3o")}</button></form>; }
export function AdvancedCourse({ course, work, request, reload, data }: {
    course: any;
    work: any;
    request: (b: any) => Promise<any>;
    reload: () => Promise<any>;
    data: any;
}) { const current = work.entries.find((e: any) => e.kind === 'curso' && e.id === course.id), [form, setForm] = useState<any>(current?.body || {}), [error, setError] = useState(''), [busy, setBusy] = useState(false), [success, setSuccess] = useState(''); const update = (k: string, v: any) => setForm({ ...form, [k]: v }); return <form className="form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setSuccess(''); try {
    await request({ action: 'entry', kind: 'curso', id: course.id, title: course.title, status: 'publicado', revision: current?.revision || 0, body: { ...current?.body, ...form } });
    await reload();
    setSuccess('Configuração guardada.');
}
catch (e: any) {
    setError(e.message);
}
finally {
    setBusy(false);
} }}><h2>{tr("Disponibilidade e conclus\u00E3o")}</h2><ErrorText value={error}/><fieldset disabled={busy || course.status !== 'rascunho'} className="editor-fields"><ImageField value={form} onChange={setForm}/><F label={tr("Cursos pr\u00E9vios obrigat\u00F3rios")}><select multiple value={form.prerequisiteCourses || []} onChange={e => update('prerequisiteCourses', Array.from(e.target.selectedOptions, x => x.value))}>{tr(data.courses.filter((c: any) => c.id !== course.id).map((c: any) => <option key={c.id} value={c.id}>{tr(c.title)}</option>))}</select></F>{tr([['registrationStarts', 'Abertura das inscrições'], ['registrationEnds', 'Fecho das inscrições'], ['starts', 'Início do acesso'], ['ends', 'Fim do acesso']].map(([k, label]) => <F key={k} label={tr(label)}><input type="date" value={form[k] || ''} onChange={e => update(k, e.target.value)}/></F>))}{tr([['accessDays', 'Dias de acesso (0 = sem limite)'], ['minStudyMinutes', 'Minutos de estudo exigidos'], ['minAttendance', 'Presenças mínimas (%)']].map(([k, label]) => <F key={k} label={tr(label)}><input type="number" min={0} value={form[k] || 0} onChange={e => update(k, Number(e.target.value))}/></F>))}<label><input type="checkbox" checked={!!form.requireTrainerApproval} onChange={e => update('requireTrainerApproval', e.target.checked)}/>{tr("Exigir aprova\u00E7\u00E3o do formador para concluir")}</label><h3>{tr("Certificado")}</h3><F label={tr("Institui\u00E7\u00E3o emissora")}><input value={form.certificate?.institution || ''} onChange={e => update('certificate', { ...form.certificate, institution: e.target.value })}/></F><F label={tr("Validade em dias (0 = sem expira\u00E7\u00E3o)")}><input type="number" min={0} value={form.certificate?.validityDays || 0} onChange={e => update('certificate', { ...form.certificate, validityDays: Number(e.target.value) })}/></F>{tr([['templateId', 'Modelo em PDF'], ['signatureId', 'Imagem da assinatura autorizada']].map(([k, label]) => <F key={k} label={tr(label)}><select value={form.certificate?.[k] || ''} onChange={e => update('certificate', { ...form.certificate, [k]: e.target.value })}><option value="">{tr("N\u00E3o definido")}</option>{tr(data.media.filter((m: any) => k === 'templateId' ? m.type === 'application/pdf' : ['image/png', 'image/jpeg'].includes(m.type)).map((m: any) => <option key={m.id} value={m.id}>{tr(m.name)}</option>))}</select></F>))}{null}<button>{tr("Guardar configura\u00E7\u00E3o")}</button></fieldset><p role="status">{tr(success)}</p></form>; }
export function Notifications() { const [data, setData] = useState<any>(null), [error, setError] = useState(''); const load = () => completion().then(setData).catch(e => setError(e.message)); useEffect(() => { void load(); }, []); return <section className="panel"><h2>{tr("Notifica\u00E7\u00F5es e eventos")}</h2><ErrorText value={error}/>{tr(data?.notifications.map((n: any) => <article key={n.id}><h3>{tr(n.title)}</h3><p>{tr(n.body)}</p>{tr(!n.readAt && <button onClick={async () => { await completion({ action: 'notification_read', id: n.id }); await load(); }}>{tr("Marcar como lida")}</button>)}</article>))}{tr(data?.events.map((e: any) => <p key={e.id}>{tr(e.title)}{tr(" \u00B7 ")}{tr(e.state)}</p>))}{tr(data && !data.notifications.length && !data.events.length && <p>{tr("Sem notifica\u00E7\u00F5es ou inscri\u00E7\u00F5es em eventos.")}</p>)}</section>; }
export function Integrations() { const [data, setData] = useState<any>(null), [error, setError] = useState(''); const load = () => completion(undefined, '?integrations=1').then(setData).catch(e => setError(e.message)); useEffect(() => { void load(); }, []); return <section className="panel"><h2>{tr("Servi\u00E7os da Academia")}</h2><ErrorText value={error}/>{tr(data && <><table><thead><tr><th>{tr("Servi\u00E7o")}</th><th>{tr("Configura\u00E7\u00E3o")}</th></tr></thead><tbody>{tr(Object.entries(data.integrations).map(([k, v]) => <tr key={k}><td>{tr(({ email: 'Email', google: 'Google', microsoft: 'Microsoft', payment: 'Pagamentos', xapi: 'xAPI / LRS', scheduler: 'Agendamento' } as any)[k])}</td><td>{tr(v ? 'Configurado' : 'Por configurar')}</td></tr>))}</tbody></table><p>{tr("\u00DAltima execu\u00E7\u00E3o de tarefas: ")}{tr(data.jobs ? new Date(data.jobs.created).toLocaleString(getLocale()) : 'Ainda sem registo')}</p><button onClick={async () => { try {
    await completion({ action: 'run_jobs' });
    await load();
}
catch (e: any) {
    setError(e.message);
} }}>{tr("Executar tarefas pendentes")}</button></>)}</section>; }
export function CoursePayment({ courseId, price, currency }: {
    courseId: string;
    price: number;
    currency: string;
}) { const [error, setError] = useState(''), [busy, setBusy] = useState(false), [paid, setPaid] = useState(false); return <section className="panel"><h3>{tr("Inscri\u00E7\u00E3o paga")}</h3><p>{tr(price)} {tr(currency)}</p><ErrorText value={error}/>{tr(paid ? <p>{tr("Pagamento confirmado. Pode preencher a ficha de inscri\u00E7\u00E3o.")}</p> : <button disabled={busy} onClick={async () => { setBusy(true); try {
    const r = await completion({ action: 'checkout', courseId });
    if (r.paid)
        setPaid(true);
    else
        location.assign(r.url);
}
catch (e: any) {
    setError(e.message);
}
finally {
    setBusy(false);
} }}>{tr("Pagar / verificar pagamento")}</button>)}</section>; }
export function CourseTrash({ onRestore }: {
    onRestore?: () => Promise<any>;
}) { const [items, setItems] = useState<any[]>([]), [error, setError] = useState(''); const load = () => completion(undefined, '?trash=1').then(r => setItems(r.courses)).catch(e => setError(e.message)); useEffect(() => { void load(); }, []); return <section className="panel"><h2>{tr("Lixeira de rascunhos")}</h2><ErrorText value={error}/>{tr(items.map(c => <article key={c.courseId}><p>{tr(JSON.parse(c.payload).title)}</p><button onClick={async () => { try {
    await completion({ action: 'course_trash_restore', id: c.courseId });
    await load();
    await onRestore?.();
}
catch (e: any) {
    setError(e.message);
} }}>{tr("Restaurar rascunho")}</button></article>))}{tr(!items.length && <p>{tr("Sem rascunhos na lixeira.")}</p>)}</section>; }
