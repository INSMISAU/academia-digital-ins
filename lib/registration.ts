import {isPossiblePhoneNumber} from 'libphonenumber-js/min';
import model from './registration-model.json';
export {model};
export type Answers=Record<string,string|string[]>;
export const sections=['Acesso e identificação','Instituição e localização','Perfil profissional','Curso e condições de participação'];
export const districts:Record<string,string[]> = model.districts;
export const exempt=(key:string,a:Answers)=>a.situacao==='Sem vínculo institucional'&&['sector','instituicao','tipo','servico'].includes(key);
export const isOther=(f:{options:string[]},s:unknown)=>(s==='Outro'||s==='Outra')&&f.options.includes(s);
export function cleanAnswers(raw:unknown):{answers:Answers;errors:Record<string,string>} {
 const a=(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}) as Record<string,unknown>;
 const answers:Answers={}, errors:Record<string,string>={};
 for(const f of model.fields){
  const k=f.key;if(exempt(k,a as Answers))continue;
  if(k==='dispositivos'){
   const val=a[k];const v=Array.isArray(val)?val:[];
   if(v.length<1||v.length>2||v.some(x=>typeof x!=='string'||!f.options.includes(x))||new Set(v).size!==v.length)errors[k]='Seleccione uma ou duas opções.';
   else answers[k]=v;continue;
  }
  const val=typeof a[k]==='string'?(a[k] as string).trim():'';
  if(!val){if(f.required)errors[k]='Preencha este campo.';continue;}
  if(/[\u0000-\u001f]/.test(val))errors[k]='Reveja o valor indicado.';
  if(f.options.length&&!f.options.includes(val))errors[k]='Seleccione uma das opções.';
  if(k==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))errors[k]='Indique um endereço de email válido.';
  if(k==='telefone'&&(!/^\+?[\d ()-]+$/.test(val)||!isPossiblePhoneNumber(val.replace(/^00/,'+'),'MZ')))errors[k]='Indique um número de telefone válido.';
  if(k==='provincia'&&!Object.hasOwn(districts,val))errors[k]='Seleccione a província.';
  if(k==='distrito'&&!(Object.hasOwn(districts,String(a.provincia))&&districts[String(a.provincia)].includes(val)))errors[k]='Seleccione um distrito da província indicada.';
  answers[k]=val;
  if(isOther(f,val)){const id=k+'Outro',extra=typeof a[id]==='string'?(a[id] as string).trim():'';if(!extra||/[\u0000-\u001f]/.test(extra))errors[id]='Especifique a opção seleccionada.';else answers[id]=extra;}
 }
 return {answers,errors};
}
