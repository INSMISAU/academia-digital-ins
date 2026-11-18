'use client';
import {LanguageSelector,tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { academyFetch, beginParticipant, hasExternalSession, participantScope, setParticipantSession } from '@/lib/academy-client';
import { candidate, identity, leaveParticipant, type Profile, type Method } from '@/lib/registration-client';
import { AccessOptions, VerifyContact } from './registration-access';
import { model, sections, districts, cleanAnswers, exempt, isOther, type Answers } from '@/lib/registration';
import './registration.css';
type Course = {
    id: string;
    title: string;
};
type Receipt = {
    reference: string;
    created: string;
    course: string;
};
const formId = (s: string) => 'ins-ficha-' + s;
const v = (x: Answers[string]) => Array.isArray(x) ? x.join('; ') : x || '';
const nameDeclaration = model.declarations[0], dataDeclaration = model.declarations[1];
export function Registration({ course, notice, close, onSaved, preview = false, unavailable = false, providers = [], initialProfile }: {
    course: Course;
    notice: string;
    close: () => void;
    onSaved: () => void;
    preview?: boolean;
    unavailable?: boolean;
    providers?: Method[];
    initialProfile?: Profile;
}) {
    const [a, set] = useState<Answers>(initialProfile ? { nome: initialProfile.name, email: initialProfile.email } : {}), [step, setStep] = useState(0), [copy, setCopy] = useState(false), [confirmed, setConfirmed] = useState([false, false]), [errors, setErrors] = useState<Record<string, string>>({}), [message, msg] = useState(''), [busy, working] = useState(false), [receipt, setReceipt] = useState<Receipt | null>(null);
    const [profile, setProfile] = useState<Profile | undefined>(initialProfile), [checkedEmail, setCheckedEmail] = useState(''), [scope, updateScope] = useState(() => preview ? '' : participantScope()), [manual, setManual] = useState(false), [restoring, restore] = useState(() => !preview && !initialProfile && hasExternalSession());
    const replacement = useRef('');
    const [identityError, setIdentityError] = useState('');
    useEffect(() => { if (preview)
        return; if (initialProfile || !hasExternalSession())
        return; let live = true; identity<Profile>({ action: 'profile' }).then(r => { if (live) {
        setProfile(r);
        set({ nome: r.name, email: r.email });
    } }).catch(() => { if (live)
        setIdentityError('A sessão terminou. Volte a entrar ou escolha o preenchimento manual.'); }).finally(() => { if (live)
        restore(false); }); return () => { live = false; }; }, [preview, initialProfile]);
    async function otherPerson() { if (lock.current)
        return; deleteDraft(); await leaveParticipant().catch(() => { }); updateScope(participantScope()); set({}); setProfile(undefined); setCheckedEmail(''); setManual(true); setIdentityError(''); setReceipt(null); setCopy(false); setConfirmed([false, false]); replacement.current = ''; hasDraft(false); next(0); onSaved(); }
    const [draft, hasDraft] = useState(false);
    const heading = useRef<HTMLHeadingElement>(null), lock = useRef(false);
    const draftKey = 'ins-ficha-rascunho-v1:' + course.id + (scope ? ':' + scope : '');
    useEffect(() => { if (preview)
        return; try {
        hasDraft(!!sessionStorage.getItem(draftKey));
    }
    catch { } }, [draftKey, preview]);
    const next = (x: number) => { setStep(x); setErrors({}); msg(''); setTimeout(() => heading.current?.focus(), 0); };
    function update(k: string, value: string | string[]) { set(prev => { const b = { ...prev, [k]: value }; if (k === 'nome' && copy)
        b.certificado = value; if (k === 'provincia' && value !== prev.provincia)
        delete b.distrito; if (k === 'situacao' && value === 'Sem vínculo institucional')
        for (const field of ['sector', 'tipo', 'instituicao', 'servico']) {
            delete b[field];
            delete b[field + 'Outro'];
        } const field = model.fields.find(f => f.key === k); if (field && !isOther(field, value))
        delete b[k + 'Outro']; return b; }); if (k === 'certificado')
        setCopy(false); if (k === 'email')
        setCheckedEmail(''); setConfirmed([false, false]); setErrors({}); msg(''); }
    function focusError(e: Record<string, string>) { setErrors(e); msg('Reveja os campos indicados.'); setTimeout(() => document.getElementById(formId(Object.keys(e)[0]))?.focus(), 0); }
    function proceed() { if (preview) {
        next(step + 1);
        return;
    } const all = cleanAnswers(a).errors; if (profile && String(a.email || '').trim().toLowerCase() !== profile.email.toLowerCase() && checkedEmail !== String(a.email || '').trim().toLowerCase())
        all.email = 'Verifique o novo endereço de email antes de continuar.'; const matched = Object.fromEntries(Object.entries(all).filter(([key]) => model.fields.some(f => f.section === step + 1 && (f.key === key || f.key + 'Outro' === key)))); if (Object.keys(matched).length) {
        focusError(matched);
        return;
    } next(step + 1); }
    function saveDraft() { try {
        sessionStorage.setItem(draftKey, JSON.stringify(cleanDraft(a)));
        hasDraft(true);
        msg('Preenchimento guardado neste separador.');
    }
    catch {
        msg('Não foi possível guardar o preenchimento neste navegador.');
    } }
    function cleanDraft(raw: Answers) { return Object.fromEntries(Object.entries(raw).filter(([k, value]) => model.fields.some(f => !exempt(f.key, raw) && (k === f.key || k === f.key + 'Outro' && isOther(f, raw[f.key]))) && (typeof value === 'string' || Array.isArray(value) && value.every(y => typeof y === 'string')))) as Answers; }
    function deleteDraft() { try {
        sessionStorage.removeItem(draftKey);
    }
    catch { } hasDraft(false); }
    async function send() {
        if (lock.current || preview || unavailable || restoring)
            return;
        const val = cleanAnswers(a);
        if (Object.keys(val.errors).length) {
            const first = Object.keys(val.errors)[0];
            next((model.fields.find(f => first === f.key || first === f.key + 'Outro')?.section || 1) - 1);
            focusError(val.errors);
            return;
        }
        if (!confirmed.every(Boolean)) {
            msg('Confirme as duas declarações antes de submeter.');
            return;
        }
        lock.current = true;
        working(true);
        msg('');
        try {
            if (!replacement.current)
                replacement.current = candidate();
            const response = await academyFetch('/api/registration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course.id, nextParticipant: replacement.current, answers: val.answers, confirmName: confirmed[0], confirmData: confirmed[1], notice }) });
            const r = await response.json() as Partial<Receipt> & {
                error?: string;
                participantSession?: string;
            };
            if (!response.ok || typeof r.reference !== 'string' || typeof r.created !== 'string' || typeof r.course !== 'string')
                throw Error(r.error || 'A inscrição não foi confirmada.');
            if (r.participantSession) {
                beginParticipant();
                setParticipantSession(r.participantSession);
            }
            setReceipt({ reference: r.reference, created: r.created, course: r.course });
            deleteDraft();
            onSaved();
            setTimeout(() => heading.current?.focus(), 0);
        }
        catch (e) {
            msg(e instanceof TypeError ? 'Não foi possível confirmar a inscrição. Mantenha a ficha aberta e tente de novo.' : e instanceof Error ? e.message : 'Não foi possível confirmar a inscrição.');
        }
        finally {
            lock.current = false;
            working(false);
        }
    }
    const summary = () => <dl className="ins-resumo">{tr(model.fields.filter(f => !exempt(f.key, a) && v(a[f.key])).map(f => <div key={f.key}><dt>{tr(f.label)}</dt><dd>{tr(v(a[f.key]))}{tr(isOther(f, a[f.key]) ? ' — ' + v(a[f.key + 'Outro']) : '')}</dd></div>))}</dl>;
    function fileCopy() { if (!receipt)
        return; const lines = ['Academia Digital do INS', 'Comprovativo de inscrição', receipt.course, receipt.reference, receipt.created, '', ...model.fields.filter(f => !exempt(f.key, a) && v(a[f.key])).map(f => f.label + ': ' + v(a[f.key]) + (isOther(f, a[f.key]) ? ' — ' + v(a[f.key + 'Outro']) : '')), ...model.declarations, 'Assinatura, quando aplicável: ______________________________']; const url = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = receipt.reference + '.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2500); }
    return <Dialog open onOpenChange={open => { if (!open && !lock.current)
        close(); }}><DialogContent className="ins-ficha" showCloseButton={!busy}><DialogTitle>{tr("Ficha de inscri\u00E7\u00E3o")}</DialogTitle><DialogDescription>{tr(course.title)}{tr(" \u00B7 Academia do Instituto Nacional de Sa\u00FAde")}</DialogDescription><LanguageSelector/>
 {tr(receipt ? <><h2 tabIndex={-1} ref={heading}>{tr("Inscri\u00E7\u00E3o registada")}</h2><p>{tr("Refer\u00EAncia: ")}<strong>{tr(receipt.reference)}</strong><br />{tr("Data: ")}{tr(new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Maputo' }).format(new Date(receipt.created)))}</p>{tr(summary())}{tr(model.declarations.map(line => <p key={line}>{tr(line)}</p>))}<p className="ins-assinatura">{tr("Assinatura, quando aplic\u00E1vel: ______________________________")}</p><div className="ins-actions"><Button onClick={fileCopy}>{tr("Descarregar ficha")}</Button><Button variant="outline" onClick={() => window.print()}>{tr("Imprimir")}</Button><Button variant="outline" onClick={close}>{tr("Fechar")}</Button><Button variant="outline" onClick={() => void otherPerson()}>{tr("Inscrever outra pessoa")}</Button><Button variant="outline" onClick={() => void leaveParticipant().finally(() => { onSaved(); close(); })}>{tr("Terminar sess\u00E3o")}</Button></div></> : <>
 <div className="ins-step">{tr("Etapa ")}{tr(step + 1)}{tr(" de 5")}</div><h2 tabIndex={-1} ref={heading}>{tr(step === 4 ? 'Revisão e declaração' : sections[step])}</h2>
 {tr(step === 0 && <><p>{tr("Os campos com * s\u00E3o obrigat\u00F3rios.")}</p>{tr(unavailable && <p role="status">{tr("A submiss\u00E3o de inscri\u00E7\u00F5es est\u00E1 temporariamente indispon\u00EDvel.")}</p>)}{tr(notice && <details className="ins-privacy"><summary>{tr("Protec\u00E7\u00E3o de dados")}</summary><p className="ins-notice">{tr(notice)}</p></details>)}{tr(!preview && providers.length > 0 && !profile && !manual && !restoring ? <AccessOptions course={course.id} enabled={providers} preview={preview} manual={() => void otherPerson()}/> : null)}{tr(!preview && profile && <p>{tr("Reveja o nome e o email disponibilizados pela sua conta.")}</p>)}{tr(identityError && <p role="alert">{tr(identityError)}</p>)}</>)}
 {tr(step === 1 && a.situacao === 'Sem vínculo institucional' && <p>{tr("Indique a prov\u00EDncia e o distrito de resid\u00EAncia. Os dados institucionais s\u00E3o dispensados.")}</p>)}
 <form noValidate onSubmit={e => { e.preventDefault(); if (step === 4)
            void send();
        else
            proceed(); }}>
 {tr(step < 4 ? model.fields.filter(f => f.section === step + 1 && !exempt(f.key, a)).map(f => {
                const k = f.key, id = formId(k), opts = k === 'provincia' ? Object.keys(districts) : k === 'distrito' ? (Object.hasOwn(districts, String(a.provincia)) ? districts[String(a.provincia)] : []) : f.options;
                const attrs = { id, 'aria-required': f.required, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? id + '-erro' : undefined };
                return <div className="ins-field" key={k}>{tr(k === 'dispositivos' ? <fieldset {...attrs} tabIndex={-1}><legend>{tr(f.label)}{tr(" * (at\u00E9 duas op\u00E7\u00F5es)")}</legend>{tr(opts.map(o => <label key={o} className="ins-check"><input type="checkbox" disabled={Array.isArray(a[k]) && a[k].length >= 2 && !a[k].includes(o)} checked={Array.isArray(a[k]) && a[k].includes(o)} onChange={e => { const list = Array.isArray(a[k]) ? a[k] as string[] : []; const updated = e.target.checked ? [...list, o] : list.filter(x => x !== o); update(k, updated); }}/>{tr(o)}</label>))}</fieldset> : <>
  <label htmlFor={id}>{tr(f.label)}{tr(f.required ? ' *' : ' (opcional)')}</label>
  {tr(opts.length || k === 'distrito' ? <select {...attrs} disabled={k === 'distrito' && !a.provincia} value={v(a[k])} onChange={e => update(k, e.target.value)}><option value="">{tr("Seleccione")}</option>{tr(opts.map(o => <option key={o} value={o}>{tr(o)}</option>))}</select> : <input {...attrs} type={k === 'email' ? 'email' : k === 'telefone' ? 'tel' : 'text'} value={v(a[k])} onChange={e => update(k, e.target.value)}/>)}</>)}
  {tr(k === 'email' && profile && !preview && <VerifyContact key={v(a.email)} email={v(a.email)} profile={profile} verified={checkedEmail} onVerified={setCheckedEmail}/>)}
  {tr(errors[k] && <p className="ins-error" id={id + '-erro'}>{tr(errors[k])}</p>)}
  {tr(isOther(f, a[k]) && <><label htmlFor={formId(k + 'Outro')}>{tr("Especifique *")}</label><input id={formId(k + 'Outro')} value={v(a[k + 'Outro'])} onChange={e => update(k + 'Outro', e.target.value)} aria-required="true" aria-describedby={errors[k + 'Outro'] ? id + '-outro-erro' : undefined} aria-invalid={!!errors[k + 'Outro']}/>{tr(errors[k + 'Outro'] && <p className="ins-error" id={id + '-outro-erro'}>{tr(errors[k + 'Outro'])}</p>)}</>)}
  {tr(k === 'certificado' && <><small>{tr("Use a grafia e os acentos que pretende no certificado, sem abreviaturas nem t\u00EDtulos.")}</small><label className="ins-check"><input type="checkbox" checked={copy} onChange={e => { if (e.target.checked)
                    update('certificado', v(a.nome)); setCopy(e.target.checked); }}/>{tr("Usar o nome completo do participante no certificado.")}</label></>)}
  </div>;
            }) : <>{tr(summary())}<p>{tr("Nome que constar\u00E1 no certificado: ")}<strong>{tr(v(a.certificado))}</strong></p>{tr([nameDeclaration, dataDeclaration].map((s, i) => <label key={s} className="ins-check"><input type="checkbox" checked={confirmed[i]} onChange={e => setConfirmed(confirmed.map((b, j) => j === i ? e.target.checked : b))}/>{tr(s)}</label>))}</>)}
 {tr(unavailable && step === 4 && <p>{tr("A submiss\u00E3o de inscri\u00E7\u00F5es est\u00E1 temporariamente indispon\u00EDvel.")}</p>)}<p role="status" className={message ? 'ins-status' : ''}>{tr(message)}</p>
 <div className="ins-actions">{tr(step > 0 && <Button type="button" variant="outline" disabled={busy} onClick={() => next(step - 1)}>{tr("Anterior")}</Button>)}<Button type="submit" disabled={busy || restoring || !!identityError || (step === 4 && (preview || unavailable))}>{tr(step === 4 ? (busy ? 'A registar…' : 'Submeter inscrição') : (step === 3 ? 'Rever ficha' : 'Continuar'))}</Button></div>
 </form>
 {tr(!preview && profile && step === 0 && <Button variant="outline" onClick={() => void otherPerson()}>{tr("Sair desta conta")}</Button>)}{tr(!preview && <details><summary>{tr("Guardar e continuar depois")}</summary><p>{tr("S\u00F3 \u00E9 guardado se escolher esta op\u00E7\u00E3o.")}</p><div className="ins-actions"><Button variant="outline" disabled={busy} onClick={saveDraft}>{tr("Guardar preenchimento")}</Button>{tr(draft && <><Button variant="outline" disabled={busy} onClick={() => { try {
            set(cleanDraft(JSON.parse(sessionStorage.getItem(draftKey) || '{}')));
            setConfirmed([false, false]);
            setCopy(false);
            next(0);
        }
        catch {
            msg('Não foi possível abrir o preenchimento.');
        } }}>{tr("Retomar preenchimento")}</Button><Button variant="outline" disabled={busy} onClick={() => { deleteDraft(); msg('Preenchimento eliminado.'); }}>{tr("Eliminar preenchimento")}</Button></>)}</div></details>)}
 </>)}</DialogContent></Dialog>;
}
