'use client';
import {useEffect,useState} from 'react';
import {academyReadJson,academyFetch} from '@/lib/academy-client';
import {Button} from '@/components/ui/button';
const labels={purpose:'Finalidade da recolha',controller:'Responsáveis pelo tratamento',access:'Quem pode aceder aos dados',retention:'Prazo de conservação',corrections:'Contacto para correcções'};
export function RegistrationSettings(){
 const [settings,set]=useState({enabled:false,notice:'',privacy:Object.fromEntries(Object.keys(labels).map(k=>[k,'']))}),[loaded,ready]=useState(false),[busy,wait]=useState(false),[message,msg]=useState('');
 useEffect(()=>{let active=true;academyReadJson('/api/registration/settings').then(r=>{if(active){set({...r,privacy:{...Object.fromEntries(Object.keys(labels).map(k=>[k,''])),...r.privacy}});ready(true);}}).catch(e=>{if(active)msg(e.message);});return()=>{active=false;};},[]);
 async function save(){wait(true);msg('');try{
  const response=await academyFetch('/api/registration/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)}),data=await response.json() as {error?:string};
  if(!response.ok)throw Error(data.error||'Não foi possível guardar.');msg('Configuração da ficha guardada.');
 }catch(e){msg(e instanceof Error?e.message:'Não foi possível guardar.');}finally{wait(false);}}
 return <section className="panel form"><h2>Ficha de inscrição</h2><p>Informação de protecção de dados apresentada aos participantes.</p>{message&&<p role="status">{message}</p>}{loaded&&<form className="form" onSubmit={e=>{e.preventDefault();void save();}}>{Object.entries(labels).map(([key,label])=><label className="field" key={key}><span>{label}</span><textarea rows={2} value={settings.privacy[key]} onChange={e=>set({...settings,privacy:{...settings.privacy,[key]:e.target.value}})}/></label>)}<label className="field"><span>Informação adicional, se aplicável</span><textarea value={settings.notice} onChange={e=>set({...settings,notice:e.target.value})}/></label><label><input type="checkbox" checked={settings.enabled} onChange={e=>set({...settings,enabled:e.target.checked})}/> Inscrições abertas</label><Button type="submit" disabled={busy}>{busy?'A guardar…':'Guardar configuração da ficha'}</Button></form>}</section>;
}
