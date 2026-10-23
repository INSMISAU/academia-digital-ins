'use client';
import {useEffect,useRef,useState} from 'react';
export function useDraftAutosave(payload:any,save:((body:any)=>Promise<unknown>)|undefined,enabled:boolean){
 const serial=payload?JSON.stringify(payload):'',saved=useRef(serial),failed=useRef(''),pending=useRef(false),saveRef=useRef(save),[status,setStatus]=useState(''),[tick,setTick]=useState(0);saveRef.current=save;
 useEffect(()=>{if(!enabled||!saveRef.current||!serial||serial===saved.current||serial===failed.current)return;setStatus('Alterações por guardar…');const timer=setTimeout(async()=>{if(pending.current)return;pending.current=true;setStatus('A guardar automaticamente…');try{await saveRef.current!(JSON.parse(serial));saved.current=serial;failed.current='';setStatus('Rascunho guardado automaticamente.');}catch(e:any){failed.current=serial;setStatus('Não foi possível guardar automaticamente: '+e.message);}finally{pending.current=false;setTick(n=>n+1);}},1500);return()=>clearTimeout(timer);},[serial,enabled,tick]);
 return status;
}
