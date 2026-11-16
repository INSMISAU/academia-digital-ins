import {academyFetch,academyOrigin,academyRequestId,beginParticipant,setParticipantSession,hasExternalSession,participantScope} from './academy-client';
const pendingKey='ins-ficha-acesso-pendente';
export const methods={google:'Google',apple:'Apple / iCloud',microsoft:'Microsoft'} as const;
export type Method=keyof typeof methods;
export type Profile={name:string;email:string;verified:boolean};
export async function identity<T extends object={ok:boolean}>(input:Record<string,unknown>):Promise<T>{
 const res=await academyFetch('/api/registration/identity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
 const body=await res.json() as T&{error?:string};if(!res.ok)throw Error(body.error||'Não foi possível concluir o acesso.');return body;
}
export async function startAccess(course:string,provider:Method){
 if(!academyOrigin&&!participantScope())beginParticipant();
 const r=await identity<{url:string;ticket:string}>({action:'start',provider});const url=new URL(r.url);
 if(url.origin!==new URL(academyOrigin||location.origin).origin||url.pathname!=='/api/registration/identity/begin'||!/^([0-9a-f]{64})$/.test(r.ticket))throw Error('Não foi possível iniciar o acesso.');
 // Only the one-time ticket and course are kept across the redirect, never form answers.
 sessionStorage.setItem(pendingKey,JSON.stringify({ticket:r.ticket,course,expires:Date.now()+600000}));location.assign(url.href);
}
let completion:Promise<{course:string;profile?:Profile;error?:string}>|undefined;
export function finishAccess(){
 if(completion)return completion;
 if(!location.hash.startsWith('#ins-ficha-retorno='))return;
 const result=location.hash.slice('#ins-ficha-retorno='.length);history.replaceState(null,'',location.pathname+location.search+'#catalogo');
 completion=(async()=>{let course='';
 try{const p=JSON.parse(sessionStorage.getItem(pendingKey)||'null');sessionStorage.removeItem(pendingKey);
 if(!p?.ticket||p.expires<=Date.now())throw Error('O acesso expirou. Volte à ficha de inscrição.');
 course=p.course;if(!/^[0-9a-f]{64}$/.test(result))throw Error('O acesso não foi concluído.');
 const r=await identity<Profile&{session:string}>({action:'finish',ticket:p.ticket,result});setParticipantSession(r.session);
 return {course,profile:{name:r.name,email:r.email,verified:r.verified}};
 }catch(e){return {course,error:e instanceof Error?e.message:'Não foi possível concluir o acesso.'};}})();
 return completion;
}
export async function leaveParticipant(){
 try{if(hasExternalSession())await identity({action:'leave'});}finally{beginParticipant();}
}
export const candidate=()=>academyRequestId()+academyRequestId();
