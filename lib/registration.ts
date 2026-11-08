import model from './registration-model.json';
export {model};
export type Answers=Record<string,string|string[]>;
export const sections=['Acesso e identificação','Instituição e localização','Perfil profissional','Curso e condições de participação'];
export const districts:Record<string,string[]> = model.districts;
export const exempt=(key:string,a:Answers)=>a.situacao==='Sem vínculo institucional'&&['sector','instituicao','tipo','servico'].includes(key);
export const isOther=(s:unknown)=>s==='Outro'||s==='Outra';
export function cleanAnswers(raw:unknown):{answers:Answers;errors:Record<string,string>} {
 const a=(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}) as Record<string,unknown>;
 const answers:Answers={}, errors:Record<string,string>={};
 for(const f of model.fields){
  const k=f.key;if(exempt(k,a as Answers))continue;
  if(k==='dispositivos'){
   const val=a[k];const v=Array.isArray(val)?val:[];
   if(v.length<1||v.length>2||v.some(x=>typeof x!=='string'||!f.options.includes(x))||new Set(v).size!==v.length||(v.includes('Sem acesso a dispositivo')&&v.length>1))errors[k]='Seleccione um ou dois dispositivos. «Sem acesso a dispositivo» é uma opção exclusiva.';
   else answers[k]=v;continue;
  }
  const val=typeof a[k]==='string'?(a[k] as string).trim():'';
  if(!val){if(f.required)errors[k]='Preencha este campo.';continue;}
  if(val.length>(k==='email'?254:180)||/[\u0000-\u001f]/.test(val))errors[k]='Reveja o valor indicado.';
  if(f.options.length&&!f.options.includes(val))errors[k]='Seleccione uma das opções.';
  if(k==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))errors[k]='Indique um endereço de email válido.';
  if(k==='telefone'&&(!/^\+?[\d ()-]+$/.test(val)||!/^\d{7,15}$/.test(val.replace(/\D/g,''))))errors[k]='Indique um número de telefone válido.';
  if(k==='provincia'&&!Object.hasOwn(districts,val))errors[k]='Seleccione a província.';
  if(k==='distrito'&&!(Object.hasOwn(districts,String(a.provincia))&&districts[String(a.provincia)].includes(val)))errors[k]='Seleccione um distrito da província indicada.';
  answers[k]=val;
  if(isOther(val)){const id=k+'Outro',extra=typeof a[id]==='string'?(a[id] as string).trim():'';if(!extra||extra.length>180)errors[id]='Especifique a opção seleccionada.';else answers[id]=extra;}
 }
 return {answers,errors};
}
