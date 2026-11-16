'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {methods,startAccess,identity,type Profile,type Method} from '@/lib/registration-client';
export function AccessOptions({course,enabled,preview,manual}:{course:string;enabled:Method[];preview:boolean;manual:()=>void}){
 const [busy,setBusy]=useState(false),[error,msg]=useState('');
 async function start(p:Method){setBusy(true);msg('');try{await startAccess(course,p);}catch(e){msg(e instanceof Error?e.message:'Não foi possível iniciar o acesso.');setBusy(false);}}
 return <><div className="ins-actions" aria-label="Acesso e preenchimento">{(Object.keys(methods) as Method[]).filter(p=>enabled.includes(p)).map(p=><Button key={p} type="button" variant="outline" disabled={preview||busy} onClick={()=>void start(p)}>{methods[p]}</Button>)}<Button type="button" variant="outline" disabled={busy||preview} onClick={manual}>Outro / Preencher manualmente</Button></div>{error&&<p role="alert">{error}</p>}</>;
}
export function VerifyContact({email,profile,verified,onVerified}:{email:string;profile:Profile;verified:string;onVerified:(email:string)=>void}){
 const [code,setCode]=useState(''),[sent,setSent]=useState(false),[busy,wait]=useState(false),[message,msg]=useState('');
 const norm=email.trim().toLowerCase();if(!norm||(norm===profile.email.toLowerCase()&&profile.verified))return null;
 if(verified===norm)return <small role="status">Email verificado.</small>;
 async function act(action:'send'|'verify'){wait(true);msg('');try{await identity({action,email,code});if(action==='send'){setSent(true);msg('Código enviado para '+email+'.');}else onVerified(norm);}catch(e){msg(e instanceof Error?e.message:'Não foi possível verificar o email.');}finally{wait(false);}}
 return <div><Button type="button" variant="outline" disabled={busy} onClick={()=>void act('send')}>{sent?'Reenviar código':'Verificar email'}</Button>{sent&&<><label htmlFor="ins-email-code">Código recebido por email</label><input id="ins-email-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)}/><Button type="button" variant="outline" disabled={busy} onClick={()=>void act('verify')}>Confirmar código</Button></>}<small role="status">{message}</small></div>;
}
