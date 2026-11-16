import {db} from '@/db/store';
export const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export const externalPrefix='a0ce5510ade0';
export const externalToken=(s:string|null)=>!!s&&s.startsWith(externalPrefix);
export const keyFor=async(token:string|null)=>{
 if(!token)return '';
 const key=await digest(token);
 if(!externalToken(token))return key;
 return (await db().prepare('SELECT account FROM registration_sessions WHERE token=? AND expires>?').bind(key,Date.now()).first<{account:string}>())?.account||'';
};
