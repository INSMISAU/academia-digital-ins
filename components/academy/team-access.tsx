'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {academyAdministration,academyValidation,academyReadJson,academyFetch,setTeamAccess,clearTeamAccess,beginParticipant,participantScope,hasExternalSession} from '@/lib/academy-client';

export function TeamGate({children}:{children:ReactNode}){
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;
  async function open(){
   try{
    if(location.hash.startsWith('#ologakey=')){
     const key=location.hash.slice(10);
     history.replaceState(null,'',location.pathname+location.search+'#gestao');
     setTeamAccess(key);
    }
    if(academyAdministration()||academyValidation()){
     await academyReadJson('/api/team-access');
     if(academyValidation()){
      const response=await academyFetch('/api/team-access',{method:'POST'});
      if(!response.ok)throw Error(((await response.json()) as {error?:string}).error||'Não foi possível abrir os testes internos.');
      // Test identities never resume a real participant's external account.
      if(!participantScope()||hasExternalSession())beginParticipant();
     }
    }
    if(active)setReady(true);
   }catch(e){if(active)setError(e instanceof Error?e.message:'Não foi possível abrir a Academia.');}
  }
  void open();return()=>{active=false;};
 },[]);
 if(ready)return children;
 return <main className="ins-team-access"><h1>Academia Digital do INS</h1>{error?<><p role="alert">{error}</p><a href="?">Voltar à Academia</a></>:<p role="status">A abrir a Academia…</p>}</main>;
}

export function TeamBar(){
 if(!academyAdministration()&&!academyValidation())return null;
 return <aside className="ins-team-bar" aria-label="Acesso interno da Ologa"><strong>{academyValidation()?'Validação interna · dados fictícios':'Administração da Academia'}</strong><nav><a href="?administracao=1#gestao">Administrar Academia</a><a href="?validacao=1#gestao">Testar gestão</a><a href="?validacao=1&perfil=participante#catalogo">Testar inscrição</a><button onClick={clearTeamAccess}>Terminar acesso</button></nav></aside>;
}
