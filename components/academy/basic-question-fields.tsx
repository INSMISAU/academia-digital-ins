'use client';
import {tr} from './complete/language';
type Question={id:string;text:string;options:{id:string;text:string}[];correct:string[];explanation:string};
export function BasicQuestionFields({question:q,number,disabled,onText,onOption,onExplanation}:{question:Question;number:number;disabled:boolean;onText:(value:string)=>void;onOption:(index:number,value:string)=>void;onExplanation:(value:string)=>void}){
 const heading='basic-question-'+q.id;
 return <fieldset className="basic-question" disabled={disabled} aria-labelledby={heading}>
  <h3 id={heading}>{tr('Pergunta')} {number}</h3>
  <label className="field"><span>{tr('Enunciado')}</span><textarea rows={3} value={q.text} onChange={e=>onText(e.target.value)}/></label>
  <div className="basic-question-options">{q.options.map((option,index)=><label className={'field basic-question-option'+(q.correct.includes(option.id)?' is-correct':'')} key={option.id}><span className="basic-option-label"><strong>{option.id}</strong>{q.correct.includes(option.id)&&<span className="basic-correct-label">{tr('Resposta correcta aprovada')}</span>}</span><textarea rows={2} value={option.text} onChange={e=>onOption(index,e.target.value)}/></label>)}</div>
  <p className="basic-answer-key"><strong>{tr('Resposta correcta aprovada')}:</strong> {q.correct.join(', ')}</p>
  <label className="field"><span>{tr('Explicação')}</span><textarea rows={3} value={q.explanation} onChange={e=>onExplanation(e.target.value)}/></label>
 </fieldset>;
}
