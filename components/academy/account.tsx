'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { academyFetch, academyReadJson, beginParticipant, setParticipantSession, setAdministrationSession, forgetAdministrationSession, academyValidation } from '@/lib/academy-client';
import { startAccess, methods, type Method } from '@/lib/registration-client';
import './account.css';
import { ManagementAccess } from './mfa';
export async function accountAction(body: Record<string, unknown>) { const response = await academyFetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await response.json() as any; if (!response.ok)
    throw Error(data.error || 'Não foi possível concluir.'); return data; }
export function AccountPanel({ navigate, changed }: {
    navigate: (view: string) => void;
    changed: () => Promise<unknown>;
}) {
    const [data, setData] = useState<any>(null), [mode, setMode] = useState('login'), [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [code, setCode] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    useEffect(() => { let live = true; academyReadJson('/api/account').then(d => { if (live)
        setData(d); }).catch(e => { if (live)
        setError(e.message); }); return () => { live = false; }; }, []);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const result = await accountAction({ action: mode, name, email, password, code, notice: data.notice });
            setPassword('');
            if (result.session) {
                beginParticipant();
                setParticipantSession(result.session);
                if (result.administration)
                    setAdministrationSession(result.session, result.expires);
                await changed();
                setData(await academyReadJson('/api/account'));
                navigate('aprender');
            }
            else if (mode === 'recover') {
                setMode('reset');
                setMessage(result.message);
            }
            else if (mode === 'reset') {
                setMode('login');
                setMessage('Palavra-passe actualizada. Entre com a nova palavra-passe.');
                setCode('');
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Não foi possível concluir.');
        }
        finally {
            setBusy(false);
        }
    }
    async function logout() { setBusy(true); setError(''); try {
        await accountAction({ action: 'logout' });
        forgetAdministrationSession();
        beginParticipant();
        setData(null);
        await changed();
        setData(await academyReadJson('/api/account'));
        setMode('login');
        setPassword('');
        setEmail('');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível terminar a sessão.');
    }
    finally {
        setBusy(false);
    } }
    return <section className="academy-account"><div className="page-heading"><div><span className="eyebrow">{tr("ACADEMIA DIGITAL DO INS")}</span><h1>{tr(data?.profile ? 'Meu perfil' : mode === 'register' ? 'Criar conta' : mode === 'recover' || mode === 'reset' ? 'Recuperar acesso' : 'Entrar')}</h1></div></div>{tr(error && <p role="alert" className="editor-error">{tr(error)}</p>)}{tr(message && <p role="status">{tr(message)}</p>)}{tr(!data && !error && <p role="status">{tr("A carregar\u2026")}</p>)}
 {tr(data?.profile ? <div className="panel form"><h2>{tr(data.profile.name)}</h2><p>{tr(data.profile.email)}</p><div className="row wrap"><Button onClick={() => navigate('aprender')}>{tr("Meus cursos")}</Button><Button variant="outline" onClick={() => navigate('certificados')}>{tr("Meus certificados")}</Button><Button variant="outline" disabled={busy} onClick={() => void logout()}>{tr("Terminar sess\u00E3o")}</Button></div>{tr(data.management && <ManagementAccess initial={data.management}/>)}</div> : data && <div className="panel form">
 {tr(data.hasManualLearning && <Button variant="outline" onClick={() => navigate('aprender')}>{tr("Meus cursos neste acesso")}</Button>)}
 {tr((mode === 'login' || mode === 'register') && <div className="row wrap"><Button variant={mode === 'login' ? 'default' : 'outline'} onClick={() => { setMode('login'); setError(''); }}>{tr("Entrar")}</Button><Button variant={mode === 'register' ? 'default' : 'outline'} onClick={() => { setMode('register'); setError(''); }}>{tr("Criar conta")}</Button></div>)}
 {tr(mode === 'register' && !data.registrationOpen ? <p>{tr("A cria\u00E7\u00E3o de contas est\u00E1 temporariamente indispon\u00EDvel.")}</p> : <form className="form" onSubmit={submit}>
 {tr(mode === 'register' && <label className="field"><span>{tr("Nome completo *")}</span><Input required autoComplete="name" maxLength={200} value={name} onChange={e => setName(e.target.value)}/></label>)}
 <label className="field"><span>{tr("Endere\u00E7o de email *")}</span><Input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/></label>
 {tr(mode === 'reset' && <label className="field"><span>{tr("C\u00F3digo de recupera\u00E7\u00E3o *")}</span><Input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={code} onChange={e => setCode(e.target.value)}/></label>)}
 {tr(mode !== 'recover' && <label className="field"><span>{tr(mode === 'reset' ? 'Nova palavra-passe' : 'Palavra-passe')}{tr(" *")}</span><Input required type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? undefined : 15} maxLength={256} value={password} onChange={e => setPassword(e.target.value)}/>{tr(mode !== 'login' && <small>{tr("Entre 15 e 256 caracteres. Pode usar uma frase.")}</small>)}</label>)}
 {tr(mode === 'register' && data.notice && <details><summary>{tr("Protec\u00E7\u00E3o de dados")}</summary><p className="academy-account-notice">{tr(data.notice)}</p></details>)}
 {tr(academyValidation() && mode === 'register' && <p>{tr("Use um email fict\u00EDcio terminado em @example.invalid.")}</p>)}
 <Button type="submit" disabled={busy}>{tr(busy ? 'A processar…' : mode === 'register' ? 'Criar conta' : mode === 'recover' ? 'Enviar código' : mode === 'reset' ? 'Guardar nova palavra-passe' : 'Entrar')}</Button>
 </form>)}
 {tr(mode === 'login' && data.recoveryAvailable && <button className="text-button" onClick={() => { setMode('recover'); setError(''); setPassword(''); }}>{tr("Esqueci a palavra-passe")}</button>)}
 {tr((mode === 'recover' || mode === 'reset') && <button className="text-button" onClick={() => setMode('login')}>{tr("Voltar a Entrar")}</button>)}
 {tr((mode === 'login' || mode === 'register') && data.providers?.length > 0 && <div className="form">{tr(data.providers.map((p: Method) => <Button key={p} variant="outline" disabled={busy} onClick={() => void startAccess('', p).catch(e => setError(e.message))}>{tr("Continuar com ")}{tr(methods[p])}</Button>))}</div>)}
 </div>)}
 </section>;
}
