import {env} from 'cloudflare:workers';
const settings=()=>env as unknown as Record<string,any>;
export function mailAvailable(){const e=settings();return typeof e.INS_EMAIL_FROM==='string'&&!!e.INS_EMAIL_FROM&&(typeof e.INS_EMAIL?.send==='function'||typeof e.INS_EMAIL_API_URL==='string'&&e.INS_EMAIL_API_URL.startsWith('https://')&&!!e.INS_EMAIL_API_TOKEN);}
// The endpoint is configured by the service operator, never supplied by a visitor.
// It must accept {from,to,subject,text} and acknowledge only after accepting delivery.
export async function sendAcademyMail(to:string,subject:string,text:string){
 if(!mailAvailable())throw Error('O envio de email não está disponível.');
 const e=settings(),body={from:e.INS_EMAIL_FROM,to,subject,text};
 if(typeof e.INS_EMAIL?.send==='function'){await e.INS_EMAIL.send(body);return;}
 const response=await fetch(e.INS_EMAIL_API_URL,{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),headers:{Authorization:'Bearer '+e.INS_EMAIL_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok)throw Error('Não foi possível enviar o email.');
}
