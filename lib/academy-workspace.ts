export const entryKinds = ['programa','formador','categoria','recurso','noticia','evento','anuncio','configuracao','curso','modulo','avaliacao'] as const;
export type EntryKind = typeof entryKinds[number];
export type Entry = {id:string;kind:EntryKind;title:string;status:'rascunho'|'publicado'|'arquivado';body:any;revision:number;created:string;updated:string};
export type Workspace = {entries:Entry[];members:any[];attendance:any[]};
export const emptyWorkspace:Workspace = {entries:[],members:[],attendance:[]};
export const kindNames:Record<EntryKind,string> = {programa:'Programa',formador:'Formador',categoria:'Categoria',recurso:'Material da biblioteca',noticia:'Notícia',evento:'Evento',anuncio:'Anúncio',configuracao:'Configuração',curso:'Configuração de curso',modulo:'Módulo',avaliacao:'Avaliação'};
export const provinces=['Maputo Cidade','Maputo Província','Gaza','Inhambane','Sofala','Manica','Tete','Zambézia','Nampula','Niassa','Cabo Delgado'];
export function entriesOf(work:Workspace,kind:EntryKind){return work.entries.filter(e=>e.kind===kind&&e.status!=='arquivado');}
export function courseSetup(work:Workspace,id:string){return work.entries.find(e=>e.kind==='curso'&&e.id===id)?.body||{};}
export function courseModules(work:Workspace,id:string){return entriesOf(work,'modulo').filter(e=>e.body.courseId===id).sort((a,b)=>(a.body.position||0)-(b.body.position||0)||a.title.localeCompare(b.title,'pt'));}
export function courseAssessments(work:Workspace,id:string){return entriesOf(work,'avaliacao').filter(e=>e.body.courseId===id);}
export function normalise(value:unknown){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt').trim();}
export function parseCSV(text:string):Record<string,string>[] {
 const first=text.replace(/^\uFEFF/,'').split(/\r?\n/)[0]||'';
 const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
 const rows:string[][]=[];let row:string[]=[],cell='',quote=false;
 const source=text.replace(/^\uFEFF/,'');
 for(let i=0;i<source.length;i++){
  const c=source[i];if(c==='"'){if(quote&&source[i+1]==='"'){cell+='"';i++;}else if(quote||!cell)quote=!quote;else cell+=c;}
  else if(c===sep&&!quote){row.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quote)throw Error('O CSV contém aspas por fechar.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 if(!rows.length)return[];const headers=rows.shift()!.map(h=>normalise(h).replace(/[^a-z0-9]/g,''));
 if(!headers.includes('nome'))throw Error('O CSV deve ter a coluna Nome. Pode incluir Provincia e Instituicao.');
 if(rows.length>500)throw Error('Importe até 500 participantes por operação.');
 return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}
export type Question={id:string;type:'unica'|'multipla'|'verdadeiro'|'curta';prompt:string;options:string[];answer:number|number[]|string;explanation:string};
export function normaliseAnswer(value:unknown){return normalise(value).replace(/\s+/g,' ');}
export function gradeQuestions(questions:Question[],answers:Record<string,unknown>){
 const review=questions.map(q=>{const selected=answers[q.id];let correct=false;
  if(q.type==='curta')correct=String(q.answer).split('|').some(a=>normaliseAnswer(a)===normaliseAnswer(selected))&&!!normaliseAnswer(selected);
  else if(q.type==='multipla'){const expected=(q.answer as number[]).slice().sort((a,b)=>a-b);const chosen=Array.isArray(selected)?[...new Set(selected)].sort((a:any,b:any)=>a-b):[];correct=JSON.stringify(expected)===JSON.stringify(chosen);}
  else correct=Number.isInteger(selected)&&selected===q.answer;
  return {id:q.id,type:q.type,prompt:q.prompt,options:q.options,selected:selected??null,answer:q.answer,correct,explanation:q.explanation};
 });
 return {score:questions.length?Math.round(review.filter(q=>q.correct).length/questions.length*100):0,review};
}
