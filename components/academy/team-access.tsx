'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {academyAdministration,academyValidation,academyReadJson,academyFetch,setTeamAccess,clearTeamAccess,beginParticipant,participantScope,hasExternalSession,academyManagement,hasTeamAccess} from '@/lib/academy-client';

export function TeamGate({children}:{children:ReactNode}){
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[access,setAccess]=useState(''),[attempt,setAttempt]=useState(0),[checking,setChecking]=useState(true);
 useEffect(()=>{let active=true;
  async function open(){
   setChecking(true);setError('');
   try{
    if(location.hash.startsWith('#ologakey=')){
     const key=location.hash.slice(10);
     history.replaceState(null,'',location.pathname+location.search+'#gestao');
     setTeamAccess(key);
     if(!academyAdministration()&&!academyValidation()){
      location.replace('?administracao=1#painel');return;
     }
    }
    if(academyAdministration()||academyValidation()){
     await academyReadJson('/api/team-access');
     if(academyValidation()){
      const response=await academyFetch('/api/team-access',{method:'POST'});
      if(!response.ok)throw Error(((await response.json()) as {error?:string}).error||'Não foi possível abrir os testes internos.');
      // Test identities never resume a real participant's external account.
      if(!participantScope()||hasExternalSession()&&!academyManagement()&&new URLSearchParams(location.search).get('perfil')!=='participante')beginParticipant();
     }
    }
    if(active)setReady(true);
   }catch(e){if(active)setError(e instanceof Error?e.message:'Não foi possível abrir a Academia.');}
   finally{if(active)setChecking(false);}
  }
  void open();return()=>{active=false;};
 },[attempt]);
 if(ready)return children;
 return <main className="ins-team-access"><h1>Administração da Academia</h1>{checking?<p role="status">A abrir a Academia…</p>:<>
 <p>Entre com o acesso técnico da equipa para abrir todas as áreas de gestão. Não é necessário definir os perfis do INS para efectuar a validação.</p>
 {error&&<p role="alert">{error}</p>}
 <form className="form" onSubmit={e=>{e.preventDefault();try{setTeamAccess(access);setAccess('');setAttempt(n=>n+1);}catch(e){setError((e as Error).message);}}}>
 <label className="field"><span>Ligação privada ou código de acesso da equipa</span><input className="ins-team-key" type="password" autoComplete="off" spellCheck={false} required value={access} onChange={e=>setAccess(e.target.value)}/></label>
 <button className="button-link" type="submit">Abrir Administração</button>
 </form><p><button className="text-button" onClick={()=>setAttempt(n=>n+1)}>Tentar novamente com o acesso já aberto</button></p><a href="?">Voltar à Academia</a>
 </>}</main>;
}

export function TeamBar(){
 if(!academyAdministration()&&!academyValidation()&&!hasTeamAccess())return null;
 return <aside className="ins-team-bar" aria-label="Acesso interno da Ologa"><strong>{academyValidation()?'Validação interna · dados fictícios':'Administração da Academia'}</strong><nav><a href="?administracao=1#painel">Administrar Academia</a><a href="?validacao=1#painel">Testar todas as áreas</a><a href="?validacao=1&perfil=participante#catalogo">Testar inscrição e aprendizagem</a><button onClick={clearTeamAccess}>Terminar acesso</button></nav></aside>;
}
