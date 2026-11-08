'use client';
import {useState,useEffect,useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {academyFetch} from '@/lib/academy-client';
import {model,sections,districts,cleanAnswers,exempt,isOther,type Answers} from '@/lib/registration';
import './registration.css';
type Course={id:string;title:string};
type Receipt={reference:string;created:string;course:string};
const formId=(s:string)=>'ins-ficha-'+s;
const v=(x:Answers[string])=>Array.isArray(x)?x.join('; '):x||'';
const nameDeclaration=model.declarations[0], dataDeclaration=model.declarations[1];
export function Registration({course,notice,close,onSaved,preview=false}:{course:Course;notice:string;close:()=>void;onSaved:()=>void;preview?:boolean}){
 const [a,set]=useState<Answers>({}),[step,setStep]=useState(0),[copy,setCopy]=useState(false),[confirmed,setConfirmed]=useState([false,false]),[errors,setErrors]=useState<Record<string,string>>({}),[message,msg]=useState(''),[busy,working]=useState(false),[receipt,setReceipt]=useState<Receipt|null>(null);
 const [draft,hasDraft]=useState(false);const heading=useRef<HTMLHeadingElement>(null),lock=useRef(false);
 const draftKey='ins-ficha-rascunho-v1:'+course.id;
 useEffect(()=>{try{hasDraft(!!sessionStorage.getItem(draftKey))}catch{}},[draftKey]);
 const next=(x:number)=>{setStep(x);setErrors({});msg('');setTimeout(()=>heading.current?.focus(),0)};
 function update(k:string,value:string|string[]){set(prev=>{const b={...prev,[k]:value};if(k==='nome'&&copy)b.certificado=value;if(k==='provincia'&&value!==prev.provincia)delete b.distrito;if(k==='situacao'&&value==='Sem vínculo institucional')for(const field of ['sector','tipo','instituicao','servico']){delete b[field];delete b[field+'Outro'];}if(!isOther(value))delete b[k+'Outro'];return b;});if(k==='certificado')setCopy(false);setConfirmed([false,false]);setErrors({});msg('');}
 function focusError(e:Record<string,string>){setErrors(e);msg('Reveja os campos indicados.');setTimeout(()=>document.getElementById(formId(Object.keys(e)[0]))?.focus(),0);}
 function proceed(){const all=cleanAnswers(a).errors;const matched=Object.fromEntries(Object.entries(all).filter(([key])=>model.fields.some(f=>f.section===step+1&&(f.key===key||f.key+'Outro'===key))));if(Object.keys(matched).length){focusError(matched);return;}next(step+1);}
 function saveDraft(){try{sessionStorage.setItem(draftKey,JSON.stringify(cleanDraft(a)));hasDraft(true);msg('Rascunho guardado neste separador.');}catch{msg('Não foi possível guardar o rascunho neste navegador.');}}
 function cleanDraft(raw:Answers){return Object.fromEntries(Object.entries(raw).filter(([k,value])=>model.fields.some(f=>!exempt(f.key,raw)&&(k===f.key||k===f.key+'Outro'&&isOther(raw[f.key])))&&(typeof value==='string'||Array.isArray(value)&&value.every(y=>typeof y==='string')))) as Answers;}
 function deleteDraft(){try{sessionStorage.removeItem(draftKey)}catch{}hasDraft(false);}
 async function send(){if(lock.current||preview)return;const val=cleanAnswers(a);
  if(Object.keys(val.errors).length){const first=Object.keys(val.errors)[0];next((model.fields.find(f=>first===f.key||first===f.key+'Outro')?.section||1)-1);focusError(val.errors);return;}
  if(!confirmed.every(Boolean)){msg('Confirme as duas declarações antes de submeter.');return;}
  lock.current=true;working(true);msg('');
  try{const response=await academyFetch('/api/registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId:course.id,answers:val.answers,confirmName:confirmed[0],confirmData:confirmed[1],notice})});
   const r=await response.json() as Partial<Receipt>&{error?:string};if(!response.ok||typeof r.reference!=='string'||typeof r.created!=='string'||typeof r.course!=='string')throw Error(r.error||'A inscrição não foi confirmada.');
   setReceipt({reference:r.reference,created:r.created,course:r.course});deleteDraft();onSaved();setTimeout(()=>heading.current?.focus(),0);
  }catch(e){msg(e instanceof TypeError?'Não foi possível confirmar a inscrição. Mantenha a ficha aberta e tente de novo.':e instanceof Error?e.message:'Não foi possível confirmar a inscrição.');}
  finally{lock.current=false;working(false);}
 }
 const summary=()=> <dl className="ins-resumo">{model.fields.filter(f=>!exempt(f.key,a)&&v(a[f.key])).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{v(a[f.key])}{isOther(a[f.key])?' — '+v(a[f.key+'Outro']):''}</dd></div>)}</dl>;
 function fileCopy(){if(!receipt)return;const lines=['Academia Digital do INS','Comprovativo de inscrição',receipt.course,receipt.reference,receipt.created,'',...model.fields.filter(f=>!exempt(f.key,a)&&v(a[f.key])).map(f=>f.label+': '+v(a[f.key])+(isOther(a[f.key])?' — '+v(a[f.key+'Outro']):'')),...model.declarations];const url=URL.createObjectURL(new Blob(['\uFEFF',lines.join('\r\n')],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=receipt.reference+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),2500);}
 return <Dialog open onOpenChange={open=>{if(!open&&!lock.current)close();}}><DialogContent className="ins-ficha" showCloseButton={!busy}><DialogTitle>Ficha de inscrição</DialogTitle><DialogDescription>{course.title} · Academia do Instituto Nacional de Saúde</DialogDescription>
 {receipt?<><h2 tabIndex={-1} ref={heading}>Inscrição registada</h2><p>Referência: <strong>{receipt.reference}</strong><br/>Data: {new Intl.DateTimeFormat('pt-PT',{dateStyle:'short',timeStyle:'short',timeZone:'Africa/Maputo'}).format(new Date(receipt.created))}</p>{summary()}<div className="ins-actions"><Button onClick={fileCopy}>Descarregar ficha</Button><Button variant="outline" onClick={()=>window.print()}>Imprimir</Button><Button variant="outline" onClick={close}>Fechar</Button></div></>:<>
 <div className="ins-step">Etapa {step+1} de 5</div><h2 tabIndex={-1} ref={heading}>{step===4?'Revisão e declaração':sections[step]}</h2>
 {step===0&&<><p>Preenchimento manual. Os campos com * são obrigatórios.</p><p className="ins-notice">{notice}</p></>}
 {step===1&&a.situacao==='Sem vínculo institucional'&&<p>Indique a província e o distrito de residência. Os dados institucionais são dispensados.</p>}
 <form noValidate onSubmit={e=>{e.preventDefault();if(step===4)void send();else proceed();}}>
 {step<4?model.fields.filter(f=>f.section===step+1&&!exempt(f.key,a)).map(f=>{
  const k=f.key,id=formId(k),opts=k==='provincia'?Object.keys(districts):k==='distrito'?(Object.hasOwn(districts,String(a.provincia))?districts[String(a.provincia)]:[]):f.options;
  const attrs={id,'aria-required':f.required,'aria-invalid':!!errors[k],'aria-describedby':errors[k]?id+'-erro':undefined};
  return <div className="ins-field" key={k}>{k==='dispositivos'?<fieldset {...attrs} tabIndex={-1}><legend>{f.label} * (até duas opções)</legend>{opts.map(o=><label key={o} className="ins-check"><input type="checkbox" checked={Array.isArray(a[k])&&a[k].includes(o)} onChange={e=>{const list=Array.isArray(a[k])?a[k] as string[]:[];const updated=e.target.checked?[...list,o]:list.filter(x=>x!==o);update(k,updated);}}/>{o}</label>)}</fieldset>:<>
  <label htmlFor={id}>{f.label}{f.required?' *':' (opcional)'}</label>
  {opts.length||k==='distrito'?<select {...attrs} disabled={k==='distrito'&&!a.provincia} value={v(a[k])} onChange={e=>update(k,e.target.value)}><option value="">Seleccione</option>{opts.map(o=><option key={o}>{o}</option>)}</select>:<input {...attrs} type={k==='email'?'email':k==='telefone'?'tel':'text'} maxLength={k==='email'?254:180} value={v(a[k])} onChange={e=>update(k,e.target.value)}/>}</>}
  {errors[k]&&<p className="ins-error" id={id+'-erro'}>{errors[k]}</p>}
  {isOther(a[k])&&<><label htmlFor={formId(k+'Outro')}>Especifique *</label><input id={formId(k+'Outro')} maxLength={180} value={v(a[k+'Outro'])} onChange={e=>update(k+'Outro',e.target.value)} aria-invalid={!!errors[k+'Outro']}/>{errors[k+'Outro']&&<p className="ins-error">{errors[k+'Outro']}</p>}</>}
  {k==='certificado'&&<><small>Use a grafia e os acentos que pretende no certificado, sem abreviaturas nem títulos.</small><label className="ins-check"><input type="checkbox" checked={copy} onChange={e=>{if(e.target.checked)update('certificado',v(a.nome));setCopy(e.target.checked);}}/>Usar o nome completo do participante no certificado.</label></>}
  </div>;
 }):<>{summary()}<p>Nome que constará no certificado: <strong>{v(a.certificado)}</strong></p>{[nameDeclaration,dataDeclaration].map((s,i)=><label key={s} className="ins-check"><input type="checkbox" checked={confirmed[i]} onChange={e=>setConfirmed(confirmed.map((b,j)=>j===i?e.target.checked:b))}/>{s}</label>)}</>}
 {preview&&step===4&&<p>A pré-visualização termina na revisão. Nenhuma inscrição é enviada.</p>}<p role="status" className={message?'ins-status':''}>{message}</p>
 <div className="ins-actions">{step>0&&<Button type="button" variant="outline" disabled={busy} onClick={()=>next(step-1)}>Anterior</Button>}<Button type="submit" disabled={busy||(step===4&&preview)}>{step===4?(busy?'A registar…':'Submeter inscrição'):(step===3?'Rever ficha':'Continuar')}</Button></div>
 </form>
 <details><summary>Rascunho neste separador</summary><p>Só é guardado se escolher esta opção.</p><div className="ins-actions"><Button variant="outline" disabled={busy} onClick={saveDraft}>Guardar rascunho</Button>{draft&&<><Button variant="outline" disabled={busy} onClick={()=>{try{set(cleanDraft(JSON.parse(sessionStorage.getItem(draftKey)||'{}')));setConfirmed([false,false]);setCopy(false);next(0);}catch{msg('Não foi possível abrir o rascunho.');}}}>Retomar rascunho</Button><Button variant="outline" disabled={busy} onClick={()=>{deleteDraft();msg('Rascunho eliminado.');}}>Eliminar rascunho</Button></>}</div></details>
 </>}</DialogContent></Dialog>;
}
