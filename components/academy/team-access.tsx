'use client';
import {LanguageSelector,tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useState, type ReactNode } from 'react';
import { academyAdministration, academyValidation, academyReadJson, academyFetch, setTeamAccess, setAdministrationSession, setParticipantSession, clearTeamAccess, beginParticipant, participantScope, hasExternalSession, academyManagement, hasTeamAccess } from '@/lib/academy-client';
export function TeamGate({ children }: {
    children: ReactNode;
}) {
    const [ready, setReady] = useState(false), [error, setError] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [attempt, setAttempt] = useState(0), [checking, setChecking] = useState(true), [busy, setBusy] = useState(false);
    useEffect(() => {
        let active = true;
        async function open() {
            setChecking(true);
            setError('');
            try {
                if (location.hash.startsWith('#ologakey=')) {
                    const key = location.hash.slice(10);
                    history.replaceState(null, '', location.pathname + location.search + '#painel');
                    setTeamAccess(key);
                    if (!academyAdministration() && !academyValidation()) {
                        location.replace('?administracao=1#plataformas');
                        return;
                    }
                }
                if (academyAdministration() || academyValidation()) {
                    await academyReadJson('/api/team-access');
                    if (academyValidation()) {
                        const response = await academyFetch('/api/team-access', { method: 'POST' });
                        if (!response.ok)
                            throw Error(((await response.json()) as {
                                error?: string;
                            }).error || 'Não foi possível abrir os testes internos.');
                        // Test identities never resume a real participant's external account.
                        if (!participantScope() || hasExternalSession() && !academyManagement() && new URLSearchParams(location.search).get('perfil') !== 'participante')
                            beginParticipant();
                    }
                }
                if (active)
                    setReady(true);
            }
            catch (e) {
                if (active) {
                    const status = (e as {
                        status?: number;
                    })?.status;
                    // An anonymous first visit is a sign-in screen, not a failed sign-in.
                    if (status === 401 && !hasTeamAccess() && attempt === 0)
                        setError('');
                    else
                        setError(status === 401 ? 'Acesso inválido ou expirado.' : e instanceof Error ? e.message : 'Não foi possível abrir a Academia.');
                }
            }
            finally {
                if (active)
                    setChecking(false);
            }
        }
        void open();
        return () => { active = false; };
    }, [attempt]);
    if (ready)
        return children;
    return <main className="ins-team-access"><LanguageSelector/><h1>{tr("Administra\u00E7\u00E3o da Academia")}</h1>{tr(checking ? <p role="status">{tr("A abrir a Academia\u2026")}</p> : <>
 {tr(error && <p role="alert">{tr(error)}</p>)}
 <form className="form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
            const response = await academyFetch('/api/administration-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const result = await response.json() as {
                session: string;
                expires: number;
                administration?: boolean;
                error?: string;
            };
            if (!response.ok)
                throw Error(result.error || 'Não foi possível entrar.');
            setAdministrationSession(result.session, result.expires);
            if (result.administration)
                setParticipantSession(result.session);
            setPassword('');
            setAttempt(n => n + 1);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        } }}>
 <label className="field"><span>{tr("Email")}</span><input className="ins-team-key" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/></label>
 <label className="field"><span>{tr("Palavra-passe")}</span><input className="ins-team-key" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label>
 <button className="button-link" type="submit" disabled={busy}>{tr(busy ? 'A entrar…' : 'Entrar')}</button>
 </form>{tr(error && hasTeamAccess() && <p><button className="text-button" onClick={() => setAttempt(n => n + 1)}>{tr("Tentar novamente")}</button></p>)}<a href="?">{tr("Voltar \u00E0 Academia")}</a>
 </>)}</main>;
}
export function TeamBar() {
    if (!academyAdministration() && !academyValidation() && !hasTeamAccess())
        return null;
    return <aside className="ins-team-bar" aria-label={tr("Navega\u00E7\u00E3o da administra\u00E7\u00E3o")}><strong>{tr(academyValidation() ? 'Validação' : 'Administração')}</strong><nav>{tr(academyValidation() && <><a href="?validacao=1#painel">{tr("Gest\u00E3o")}</a><a href="?validacao=1&perfil=participante#catalogo">{tr("\u00C1rea do participante")}</a></>)}<a href="?">{tr("Voltar \u00E0 Academia")}</a><button onClick={clearTeamAccess}>{tr("Sair")}</button></nav></aside>;
}

