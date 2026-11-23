'use client';
import {useEffect,useState} from 'react';
import {academyFetch,academyValidation} from '@/lib/academy-client';
import {tr} from './complete/language';
import {BasicQuestionFields} from './basic-question-fields';
export function PlatformManagement({navigate}:{navigate:(id:string)=>void}){
 return <section className="panel"><h1>{tr('Gestão de conteúdos')}</h1><p>{tr('Seleccione a plataforma que pretende alterar.')}</p><div className="platform-grid">
 <button className="panel platform-card" onClick={()=>navigate('painel')}><strong>{tr('Academia Digital')}</strong><span>{tr('Páginas, cursos da Academia, biblioteca, notícias e eventos.')}</span></button>
 <a className="panel platform-card" href={academyValidation()?'https://insmisau.github.io/manual-surtos-teste/ensaio-editor/cms.html':'https://insmisau.github.io/manual-surtos/cms.html'} target="_blank" rel="noopener noreferrer"><strong>{tr('Manual de Surtos')}</strong><span>{tr('Fichas de doenças, síndromes e secções do e-book.')}</span></a>
 <button className="panel platform-card" onClick={()=>navigate('curso-basico-editor')}><strong>{tr('Curso Básico')}</strong><span>{tr('Módulos, conteúdos das secções e questões de avaliação.')}</span></button>
 </div></section>;
}
export function BasicCourseEditor(){
 const [edition,setEdition]=useState<any>(null),[moduleIndex,setModuleIndex]=useState(0),[sectionIndex,setSectionIndex]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 async function read(){const r=await academyFetch('/api/basic-course',{cache:'no-store'}),d:any=await r.json();if(!r.ok)throw Error(d.error);setEdition(d);setDirty(false);}
 useEffect(()=>{read().catch(e=>setMessage(e.message));},[]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 function change(fn:(c:any)=>void){setEdition((old:any)=>{const next=structuredClone(old);fn(next.course);return next;});setDirty(true);}
 async function act(action:string){setBusy(true);setMessage('');try{const r=await academyFetch('/api/basic-course',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,revision:edition.revision,...(action==='save'?{course:edition.course}:{})})});if(!r.ok){const d:any=await r.json();throw Error(d.error);}
 if(action==='export'){const u=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=u;a.download='curso-basico-conteudos-r'+edition.revision+'.zip';a.click();setTimeout(()=>URL.revokeObjectURL(u),10000);setMessage('Versão aprovada descarregada.');}else{setEdition(await r.json());setDirty(false);setMessage('Operação concluída.');}}catch(e){setMessage(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy(false);}}
 if(!edition)return <section className="panel"><h1>{tr('Curso Básico')}</h1><p role="status">{tr(message||'A carregar…')}</p></section>;
 const course=edition.course,m=course.modules[moduleIndex],s=m.sections[sectionIndex],editable=edition.state==='rascunho'&&!busy;
 return <section className="panel basic-editor"><h1>{tr('Curso Básico em Investigação de Surtos')}</h1><p>{tr('Estado')}: {tr(({rascunho:'Rascunho',em_revisao:'Em revisão',aprovado:'Aprovado'} as any)[edition.state])} · {tr('Versão')} {edition.revision}{dirty?' · '+tr('Alterações por guardar'):''}</p><p role="status" aria-live="polite">{tr(message)}</p>
 <div className="row wrap"><button disabled={!editable||!dirty} onClick={()=>act('save')}>{tr('Guardar rascunho')}</button>{edition.state==='rascunho'&&<button disabled={busy||dirty||!edition.revision} onClick={()=>act('submit')}>{tr('Submeter a revisão')}</button>}{edition.state==='em_revisao'&&<><button disabled={busy} onClick={()=>act('return')}>{tr('Devolver para correcção')}</button><button disabled={busy} onClick={()=>act('approve')}>{tr('Aprovar conteúdo')}</button></>}{edition.state==='aprovado'&&<><button disabled={busy} onClick={()=>act('export')}>{tr('Descarregar versão aprovada')}</button><button disabled={busy} onClick={()=>act('reopen')}>{tr('Criar rascunho a partir desta versão')}</button></>}</div>
 {edition.state==='aprovado'&&<p>{tr('Carregue formacao-dados.js e sw.js na raiz do repositório demo-modulo-surtos para publicar esta versão.')}</p>}
 <label className="field">{tr('Módulo')}<select value={moduleIndex} onChange={e=>{setModuleIndex(Number(e.target.value));setSectionIndex(0);}}>{course.modules.map((x:any,i:number)=><option key={x.id} value={i}>{x.title}</option>)}</select></label>
 <fieldset disabled={!editable}><label className="field">{tr('Título do módulo')}<input value={m.title} onChange={e=>change(c=>{c.modules[moduleIndex].title=e.target.value;})}/></label><label className="field">{tr('Objectivos de aprendizagem')}<textarea rows={5} value={m.objectives.join('\n')} onChange={e=>change(c=>{c.modules[moduleIndex].objectives=e.target.value.split('\n');})}/></label></fieldset>
 <label className="field">{tr('Secção')}<select value={sectionIndex} onChange={e=>setSectionIndex(Number(e.target.value))}>{m.sections.map((x:any,i:number)=><option key={x.id} value={i}>{x.title}</option>)}</select></label>
 <fieldset disabled={!editable}><label className="field">{tr('Título da secção')}<input value={s.title} onChange={e=>change(c=>{c.modules[moduleIndex].sections[sectionIndex].title=e.target.value;})}/></label><label className="field">{tr('Resumo')}<textarea rows={4} value={s.summary} onChange={e=>change(c=>{c.modules[moduleIndex].sections[sectionIndex].summary=e.target.value;})}/></label></fieldset>
 <h2>{tr('Conteúdo da secção')}</h2><div key={moduleIndex+'-'+sectionIndex+'-'+edition.revision} className="basic-rich-text" role="textbox" aria-label={tr('Conteúdo da secção')} aria-multiline="true" contentEditable={editable} suppressContentEditableWarning onClick={e=>{if((e.target as HTMLElement).closest('a'))e.preventDefault();}} onBlur={e=>{if(editable){const html=e.currentTarget.innerHTML.replaceAll('https://insmisau.github.io/demo-modulo-surtos/','');if(html!==s.html)change(c=>{c.modules[moduleIndex].sections[sectionIndex].html=html;});}}} dangerouslySetInnerHTML={{__html:s.html.replace(/(src|href)="(?!https?:|#|\/)([^"]+)"/g,'$1="https://insmisau.github.io/demo-modulo-surtos/$2"')}}/>
 <h2>{tr('Questões de avaliação')}</h2>{(m.questions||[]).map((q:any,i:number)=><BasicQuestionFields key={q.id} question={q} number={i+1} disabled={!editable} onText={value=>change(c=>{c.modules[moduleIndex].questions[i].text=value;})} onOption={(j,value)=>change(c=>{c.modules[moduleIndex].questions[i].options[j].text=value;})} onExplanation={value=>change(c=>{c.modules[moduleIndex].questions[i].explanation=value;})}/>)}
 </section>;
}


