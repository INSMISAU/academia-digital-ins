'use client';
import {useEffect,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {academyFetch,academyReadJson,beginParticipant,setParticipantSession,setAdministrationSession,forgetAdministrationSession,academyValidation} from '@/lib/academy-client';
import {startAccess,methods,type Method} from '@/lib/registration-client';
import './account.css';
import {ManagementAccess} from './mfa';
export async function accountAction(body:Record<string,unknown>){const response=await academyFetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json() as any;if(!response.ok)throw Error(data.error||'Não foi possível concluir.');return data;}
export function AccountPanel({navigate,changed}:{navigate:(view:string)=>void;changed:()=>Promise<unknown>}){
 const [data,setData]=useState<any>(null),[mode,setMode]=useState('login'),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let live=true;academyReadJson('/api/account').then(d=>{if(live)setData(d);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{
  const result=await accountAction({action:mode,name,email,password,code,notice:data.notice});
  setPassword('');if(result.session){beginParticipant();setParticipantSession(result.session);if(result.administration)setAdministrationSession(result.session,result.expires);await changed();setData(await academyReadJson('/api/account'));navigate('aprender');}
  else if(mode==='recover'){setMode('reset');setMessage(result.message);}
  else if(mode==='reset'){setMode('login');setMessage('Palavra-passe actualizada. Entre com a nova palavra-passe.');setCode('');}
 }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy(false);}}
 async function logout(){setBusy(true);setError('');try{await accountAction({action:'logout'});forgetAdministrationSession();beginParticipant();setData(null);await changed();setData(await academyReadJson('/api/account'));setMode('login');setPassword('');setEmail('');}catch(e){setError(e instanceof Error?e.message:'Não foi possível terminar a sessão.');}finally{setBusy(false);}}
 return <section className="academy-account"><div className="page-heading"><div><span className="eyebrow">ACADEMIA DIGITAL DO INS</span><h1>{data?.profile?'Meu perfil':mode==='register'?'Criar conta':mode==='recover'||mode==='reset'?'Recuperar acesso':'Entrar'}</h1></div></div>{error&&<p role="alert" className="editor-error">{error}</p>}{message&&<p role="status">{message}</p>}{!data&&!error&&<p role="status">A carregar…</p>}
 {data?.profile?<div className="panel form"><h2>{data.profile.name}</h2><p>{data.profile.email}</p><div className="row wrap"><Button onClick={()=>navigate('aprender')}>Meus cursos</Button><Button variant="outline" onClick={()=>navigate('certificados')}>Meus certificados</Button><Button variant="outline" disabled={busy} onClick={()=>void logout()}>Terminar sessão</Button></div>{data.management&&<ManagementAccess initial={data.management}/>}</div>:data&&<div className="panel form">
 {data.hasManualLearning&&<Button variant="outline" onClick={()=>navigate('aprender')}>Meus cursos neste acesso</Button>}
 {(mode==='login'||mode==='register')&&<div className="row wrap"><Button variant={mode==='login'?'default':'outline'} onClick={()=>{setMode('login');setError('');}}>Entrar</Button><Button variant={mode==='register'?'default':'outline'} onClick={()=>{setMode('register');setError('');}}>Criar conta</Button></div>}
 {mode==='register'&&!data.registrationOpen?<p>A criação de contas está temporariamente indisponível.</p>:<form className="form" onSubmit={submit}>
 {mode==='register'&&<label className="field"><span>Nome completo *</span><Input required autoComplete="name" maxLength={200} value={name} onChange={e=>setName(e.target.value)}/></label>}
 <label className="field"><span>Endereço de email *</span><Input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 {mode==='reset'&&<label className="field"><span>Código de recuperação *</span><Input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={code} onChange={e=>setCode(e.target.value)}/></label>}
 {mode!=='recover'&&<label className="field"><span>{mode==='reset'?'Nova palavra-passe':'Palavra-passe'} *</span><Input required type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?undefined:15} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)}/>{mode!=='login'&&<small>Entre 15 e 256 caracteres. Pode usar uma frase.</small>}</label>}
 {mode==='register'&&data.notice&&<details><summary>Protecção de dados</summary><p className="academy-account-notice">{data.notice}</p></details>}
 {academyValidation()&&mode==='register'&&<p>Use um email fictício terminado em @example.invalid.</p>}
 <Button type="submit" disabled={busy}>{busy?'A processar…':mode==='register'?'Criar conta':mode==='recover'?'Enviar código':mode==='reset'?'Guardar nova palavra-passe':'Entrar'}</Button>
 </form>}
 {mode==='login'&&data.recoveryAvailable&&<button className="text-button" onClick={()=>{setMode('recover');setError('');setPassword('');}}>Esqueci a palavra-passe</button>}
 {(mode==='recover'||mode==='reset')&&<button className="text-button" onClick={()=>setMode('login')}>Voltar a Entrar</button>}
 {(mode==='login'||mode==='register')&&data.providers?.length>0&&<div className="form">{data.providers.map((p:Method)=><Button key={p} variant="outline" disabled={busy} onClick={()=>void startAccess('',p).catch(e=>setError(e.message))}>Continuar com {methods[p]}</Button>)}</div>}
 </div>}
 </section>;
}
