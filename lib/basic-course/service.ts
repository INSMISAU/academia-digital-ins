import {admin,body,db,now,actor,fail,response,AcademyError} from '@/lib/academy/core';
import {approved,validateCourse,nextState} from './model';
import {coursePackage} from './package';
const initial=()=>({revision:0,state:'rascunho',course:approved,updated:'',author:''});
export async function handleBasic(req:Request){try{
 admin(req);const row=await db().prepare('SELECT * FROM basic_course_editions WHERE id=1').first<any>();
 const current=row?{...row,course:JSON.parse(row.payload)}:initial();delete current.payload;
 if(req.method==='GET')return response(current);
 const input=await body(req,600000);
 if(input.revision!==current.revision)fail('Existe uma versão mais recente. Reabra o editor antes de continuar.',409);
 if(input.action==='export'){
  if(current.state!=='aprovado')fail('A versão deve ser aprovada antes de gerar o ficheiro.',409);
  const remote=await fetch('https://raw.githubusercontent.com/INSMISAU/demo-modulo-surtos/main/formacao-dados.js',{headers:{'Accept':'text/plain'},cache:'no-store'});
  if(!remote.ok)fail('Não foi possível conferir a versão publicada. Tente novamente.',503);
  const source=await remote.text();let live:unknown;
  try{live=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1));}catch{fail('O conteúdo publicado exige conferência antes da exportação.',409);}
  const history=await db().prepare("SELECT payload FROM basic_course_history WHERE state='aprovado'").all<{payload:string}>();
  const canonical=(v:unknown)=>JSON.stringify(v);
  if(![approved,current.course,...history.results.map(h=>JSON.parse(h.payload))].some(v=>canonical(v)===canonical(live)))fail('O curso publicado mudou fora deste editor. Compare as versões antes de publicar.',409);
  const offline=await fetch('https://raw.githubusercontent.com/INSMISAU/demo-modulo-surtos/main/sw.js',{cache:'no-store'});
  if(!offline.ok)fail('Não foi possível conferir a versão offline publicada.',503);
  const bytes=await coursePackage(current.course,current.revision,await offline.text());
  return new Response(bytes as BodyInit,{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="curso-basico-conteudos-r'+current.revision+'.zip"','Cache-Control':'no-store'}});
 }
 const next=nextState(current.state,input.action),course=input.action==='save'?validateCourse(input.course):current.course;
 const payload=JSON.stringify(course),updated=now(),author=actor();
 if(row){
  const result=await db().batch([
   db().prepare('INSERT INTO basic_course_history(revision,state,payload,updated,author) SELECT revision,state,payload,updated,author FROM basic_course_editions WHERE id=1 AND revision=?').bind(current.revision),
   db().prepare('UPDATE basic_course_editions SET revision=revision+1,state=?,payload=?,updated=?,author=? WHERE id=1 AND revision=?').bind(next,payload,updated,author,current.revision)
  ]);if(!result[1].meta.changes)fail('Outra alteração foi guardada. Reabra o editor.',409);
 }else{
  if(input.action!=='save')fail('Guarde o rascunho primeiro.',409);
  await db().prepare('INSERT INTO basic_course_editions VALUES(1,1,?,?,?,?)').bind(next,payload,updated,author).run();
 }
 return response({revision:current.revision+1,state:next,course,updated,author});
 }catch(e){return response({error:e instanceof Error?e.message:'Não foi possível concluir.'},e instanceof AcademyError?e.status:400);}}
