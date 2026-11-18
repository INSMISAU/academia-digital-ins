'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { academyFetch, academyReadJson, academyValidation } from '@/lib/academy-client';
export function ManagementAccess({ initial }: {
    initial: any;
}) {
    const [state, setState] = useState(initial), [setup, setSetup] = useState<any>(null), [code, setCode] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    async function action(action: string) { setBusy(true); setError(''); try {
        const r = await academyFetch('/api/mfa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, code }) }), d: any = await r.json();
        if (!r.ok)
            throw Error(d.error);
        if (action === 'setup')
            setSetup(d);
        else {
            setSetup(null);
            setCode('');
            setState(await academyReadJson('/api/mfa'));
        }
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <section className="form"><h3>{tr("Acesso \u00E0 gest\u00E3o")}</h3>{tr(error && <p className="editor-error" role="alert">{tr(error)}</p>)}{tr(state.verified ? <a className="button-link" href={(academyValidation() ? '?validacao=1&perfil=participante&gestao=1' : '?gestao=1') + '#gestao'}>{tr("Abrir gest\u00E3o autorizada")}</a> : !state.available ? <p>{tr("A autentica\u00E7\u00E3o adicional est\u00E1 temporariamente indispon\u00EDvel.")}</p> : <><p>{tr("Confirme a sua identidade com o c\u00F3digo da aplica\u00E7\u00E3o autenticadora.")}</p>{tr(!state.enabled && !setup && <Button variant="outline" disabled={busy} onClick={() => void action('setup')}>{tr("Configurar autentica\u00E7\u00E3o adicional")}</Button>)}{tr(setup && <><p>{tr("Adicione uma conta na aplica\u00E7\u00E3o autenticadora com esta chave. Guarde-a em local seguro.")}</p><code style={{ overflowWrap: 'anywhere' }}>{tr(setup.secret)}</code></>)}{tr((state.enabled || setup) && <form className="form" onSubmit={e => { e.preventDefault(); void action('verify'); }}><label className="field"><span>{tr("C\u00F3digo de seis d\u00EDgitos")}</span><Input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)}/></label><Button disabled={busy}>{tr("Confirmar c\u00F3digo")}</Button></form>)}</>)}</section>;
}
