import baseline from './approved.json';
export const approved=baseline;
const editable=new Set(['title','summary','html','explanation','prompt','text','objectives']);
export function validateCourse(value:unknown){
 function visit(a:any,b:any,key=''){
  if(typeof a==='string'&&editable.has(key)){
   if(typeof b!=='string'||b.length>100000)throw Error('Texto inválido.');
   if(key==='html'){
    if(/<\s*(script|iframe|object|embed|form|input|style|link|base|svg|math|video|audio)\b|\bon\w+\s*=|javascript\s*:|data\s*:/i.test(b))throw Error('Conteúdo não permitido na secção.');
    const images=(s:string)=>[...s.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]);
    if(JSON.stringify(images(a))!==JSON.stringify(images(b)))throw Error('As fotografias aprovadas devem ser preservadas.');
   }
   return;
  }
  if(Array.isArray(a)){
   if(!Array.isArray(b)||a.length!==b.length)throw Error('A estrutura aprovada deve ser preservada.');
   a.forEach((v,i)=>visit(v,b[i],key));return;
  }
  if(a&&typeof a==='object'){
   if(!b||typeof b!=='object'||Array.isArray(b)||JSON.stringify(Object.keys(a).sort())!==JSON.stringify(Object.keys(b).sort()))throw Error('Estrutura de conteúdo inválida.');
   for(const k of Object.keys(a))visit(a[k],b[k],k);return;
  }
  if(a!==b)throw Error('Este campo faz parte da configuração aprovada.');
 }
 visit(approved,value);return value as typeof approved;
}
export const nextState=(state:string,action:string)=>{
 const changes:Record<string,Record<string,string>>={rascunho:{save:'rascunho',submit:'em_revisao'},em_revisao:{return:'rascunho',approve:'aprovado'},aprovado:{reopen:'rascunho'}};
 const next=changes[state]?.[action];if(!next)throw Error('Operação não permitida neste estado.');return next;
};
