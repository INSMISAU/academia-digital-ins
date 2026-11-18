'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useState } from 'react';
import { completion, ErrorText } from './common';
import { academyFetch } from '@/lib/academy-client';
import { downloadRows } from '@/lib/academy-export';
export function EventPanel({ id, management = false }: {
    id: string;
    management?: boolean;
}) { const [data, setData] = useState<any>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false); const load = () => completion(undefined, '?event=' + encodeURIComponent(id)).then(setData).catch(e => setError(e.message)); useEffect(() => { void load(); }, [id]); async function act(b: any) { setBusy(true); setError(''); try {
    await completion({ ...b, eventId: id });
    await load();
}
catch (e: any) {
    setError(e.message);
}
finally {
    setBusy(false);
} } return <section className="panel"><h2>{tr(management ? 'Inscrições e presenças' : 'Participar no evento')}</h2><ErrorText value={error}/>{tr(data && <><p>{tr(data.event.body.start && new Date(data.event.body.start).toLocaleString(getLocale(), { timeZone: 'Africa/Maputo' }))}{tr(" \u00B7 Maputo")}</p><p>{tr(data.event.body.programme)}</p><p>{tr(data.event.body.speakers)}</p><button onClick={async () => { try {
    const r = await academyFetch('/api/completion?calendar=' + id);
    if (!r.ok)
        throw Error('Calendário indisponível.');
    const u = URL.createObjectURL(await r.blob()), a = document.createElement('a');
    a.href = u;
    a.download = 'evento.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
}
catch (e: any) {
    setError(e.message);
} }}>{tr("Adicionar ao calend\u00E1rio")}</button>{tr(management ? <><button onClick={() => downloadRows([['Nome', 'Email', 'Estado'], ...data.registrations.map((r: any) => [r.name, r.email, r.state])], 'csv', 'inscricoes-evento')}>{tr("Exportar inscri\u00E7\u00F5es")}</button><div className="workspace-table"><table><thead><tr><th>{tr("Nome")}</th><th>{tr("Estado")}</th><th>{tr("Decis\u00E3o")}</th><th>{tr("Presen\u00E7as")}</th></tr></thead><tbody>{tr(data.registrations.map((r: any) => <tr key={r.id}><td>{tr(r.name)}</td><td>{tr(r.state)}</td><td>{tr(['confirmado', 'recusado', 'cancelado'].map(state => <button key={state} disabled={busy} onClick={() => act({ action: 'event_decision', id: r.id, state })}>{tr(state)}</button>))}</td><td>{tr([{ id: 'evento', title: 'Evento' }, ...(data.event.body.sessions || [])].map((s: any) => <label key={s.id}><input type="checkbox" disabled={busy || r.state !== 'confirmado'} checked={!!data.attendance.find((v: any) => v.registrationId === r.id && v.sessionId === s.id)?.present} onChange={e => act({ action: 'event_attendance', id: r.id, sessionId: s.id, present: e.target.checked })}/>{tr(s.title)}</label>))}</td></tr>))}</tbody></table></div></> : <><p>{tr(data.registration ? 'Estado da inscrição: ' + data.registration.state : '')}</p>{tr(!data.registration || data.registration.state === 'cancelado' ? <button disabled={busy || !data.event.body.registrationOpen} onClick={() => act({ action: 'event_register' })}>{tr("Inscrever-me")}</button> : <button disabled={busy} onClick={() => act({ action: 'event_cancel' })}>{tr("Cancelar inscri\u00E7\u00E3o")}</button>)}{tr(data.registration?.state === 'confirmado' && data.event.body.joinUrl && <p><a href={data.event.body.joinUrl} target="_blank" rel="noreferrer">{tr("Entrar no evento")}</a>{tr(data.event.body.joinCode && <>{tr(" \u00B7 C\u00F3digo: ")}{tr(data.event.body.joinCode)}</>)}</p>)}</>)}</>)}</section>; }
