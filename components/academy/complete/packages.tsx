'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useRef, useState } from 'react';
import { completion, ErrorText } from './common';
import { academyOrigin } from '@/lib/academy-client';
export function PackagePanel({ courseId, lessonId, management = false, lessons = [] }: {
    courseId: string;
    lessonId?: string;
    management?: boolean;
    lessons?: any[];
}) { const [data, setData] = useState<any[]>([]), [target, setTarget] = useState(lessonId || lessons[0]?.id || ''), [error, setError] = useState(''), [launch, setLaunch] = useState<any>(null), [saved, setSaved] = useState(''), [busy, setBusy] = useState(false); const frame = useRef<HTMLIFrameElement>(null), revision = useRef(0), chain = useRef(Promise.resolve()); const load = () => completion(undefined, '?packages=' + courseId).then(r => setData(r.packages)).catch(e => setError(e.message)); useEffect(() => { void load(); }, [courseId]); useEffect(() => { setLaunch(null); }, [lessonId]); useEffect(() => { if (!launch)
    return; const listener = (e: MessageEvent) => { if (e.source !== frame.current?.contentWindow || e.data?.type !== 'ins-scorm' || e.data.packageId !== launch.id)
    return; const data = e.data.data; chain.current = chain.current.then(async () => { const r = await completion({ action: 'package_commit', id: launch.id, data, revision: revision.current }); revision.current = r.revision; setSaved('Progresso do pacote guardado.'); }).catch(e => setError(e.message)); }; window.addEventListener('message', listener); return () => window.removeEventListener('message', listener); }, [launch]); return <section className="panel"><h2>{tr("Conte\u00FAdos SCORM")}</h2><ErrorText value={error}/>{tr(management && <><label className="field">{tr("Aula")}<select value={target} onChange={e => setTarget(e.target.value)}>{tr(lessons.map(l => <option value={l.id} key={l.id}>{tr(l.title)}</option>))}</select></label><label className="field">{tr("Importar pacote ZIP \u00B7 at\u00E9 20 MB")}<input disabled={busy || !target} type="file" accept=".zip" onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
    return; setBusy(true); try {
    const f = new FormData();
    f.set('file', file);
    f.set('courseId', courseId);
    f.set('lessonId', target);
    await completion(f, '?upload=package');
    await load();
}
catch (e: any) {
    setError(e.message);
}
finally {
    setBusy(false);
} }}/></label></>)}{tr(data.filter(p => management || p.lessonId === lessonId).map(p => <article key={p.id}><p>{tr(p.standard)}{tr(" \u00B7 ")}{tr(lessons.find(l => l.id === p.lessonId)?.title || 'Conteúdo da aula')}</p>{tr(!management && p.launches.map((unit: any) => <button key={unit.id} onClick={async () => { setError(''); try {
    const r = await completion({ action: 'package_launch', id: p.id, unit: unit.id });
    revision.current = r.revision;
    setLaunch({ ...r, id: p.id });
    setSaved('');
}
catch (e: any) {
    setError(e.message);
} }}>{tr("Abrir ")}{tr(unit.title)}</button>))}</article>))}{tr(launch && <><iframe ref={frame} title={tr("Conte\u00FAdo de aprendizagem SCORM")} sandbox="allow-scripts" referrerPolicy="no-referrer" src={academyOrigin + launch.path} style={{ width: '100%', height: '70vh', border: '1px solid #bccdd0' }}/><p role="status">{tr(saved)}</p></>)}{tr(!data.length && <p>{tr("Sem pacotes importados neste curso.")}</p>)}</section>; }
