'use client';
import {useRef,useState} from 'react';
import {tr} from './complete/language';
import {tableRows,galleryItems,insertFormatting,type ContentBlock} from '@/lib/academy-content';

export function AdvancedBlockFields({block,onChange}:{block:ContentBlock;onChange:(block:ContentBlock)=>void}) {
 const field=useRef<HTMLTextAreaElement>(null),selection=useRef({start:0,end:0});
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 const text=(text:string)=>onChange({...block,text});
 const input=(label:string,value:string,change:(value:string)=>void,type='text')=><label>{tr(label)}<input type={type} value={value} onChange={e=>change(e.target.value)}/></label>;
 if(block.type==='divider')return null;
 if(block.type==='table'){
  const rows=block.text?tableRows(block.text):[['',''],['','']];
  const write=(rows:string[][])=>text(rows.map(row=>row.join('\t')).join('\n'));
  return <div className="advanced-block-fields">{input('Título da tabela',block.title,title=>onChange({...block,title}))}<div className="editor-table-scroll" tabIndex={0} role="region" aria-label={tr(block.title||'Tabela')}><table><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}><input aria-label={tr(i===0?'Cabeçalho':'Célula')+' '+(i+1)+', '+(j+1)} value={cell} onChange={e=>write(rows.map((r,ri)=>ri===i?r.map((v,ci)=>ci===j?e.target.value.replace(/[\t\r\n]/g,' '):v):r))}/></td>)}<td><button type="button" disabled={i===0||rows.length<=2} onClick={()=>write(rows.filter((_,n)=>n!==i))}>{tr('Remover linha')}</button></td></tr>)}</tbody></table></div><div className="row wrap"><button type="button" disabled={rows.length>=20} onClick={()=>write([...rows,rows[0].map(()=>'')])}>{tr('Adicionar linha')}</button><button type="button" disabled={rows[0].length>=8} onClick={()=>write(rows.map(row=>[...row,'']))}>{tr('Adicionar coluna')}</button>{rows[0].map((_,j)=><button type="button" key={j} disabled={rows[0].length<=1} onClick={()=>write(rows.map(row=>row.filter((_,n)=>n!==j)))}>{tr('Remover coluna')} {j+1}</button>)}</div></div>;
 }
 if(block.type==='gallery'){
  const items=galleryItems(block.text),write=(next:typeof items)=>text(next.map(item=>[item.url,item.alt,item.source,item.caption].map(v=>v.replace(/[\t\r\n]/g,' ')).join('\t')).join('\n'));
  return <div className="advanced-block-fields">{input('Título da galeria',block.title,title=>onChange({...block,title}))}{items.map((item,i)=><fieldset className="panel" key={i}><legend>{tr('Imagem')} {i+1}</legend>{(['url','alt','source','caption'] as const).map(key=><div key={key}>{input(({url:'Ligação pública HTTPS',alt:'Descrição da imagem (acessibilidade)',source:'Fonte / autoria (obrigatória)',caption:'Legenda'} as const)[key],item[key],value=>write(items.map((v,n)=>n===i?{...v,[key]:value}:v)),key==='url'?'url':'text')}</div>)}<div className="row wrap"><button type="button" disabled={i===0} onClick={()=>{const next=[...items];[next[i-1],next[i]]=[next[i],next[i-1]];write(next);}}>{tr('Subir')}</button><button type="button" disabled={i===items.length-1} onClick={()=>{const next=[...items];[next[i+1],next[i]]=[next[i],next[i+1]];write(next);}}>{tr('Descer')}</button><button type="button" onClick={()=>write(items.filter((_,n)=>n!==i))}>{tr('Remover imagem')}</button></div></fieldset>)}<button type="button" disabled={items.length>=12} onClick={()=>write([...items,{url:'',alt:'',source:'',caption:''}])}>{tr('Adicionar imagem')}</button></div>;
 }
 function format(kind:'bold'|'italic'|'link'){
  try{const result=insertFormatting(block.text,selection.current.start,selection.current.end,kind,url);text(result.text);setError('');requestAnimationFrame(()=>{field.current?.focus();field.current?.setSelectionRange(result.start,result.end);selection.current={start:result.start,end:result.end};});}catch(e){setError((e as Error).message);}
 }
 return <div className="advanced-block-fields">{block.type==='formatted'&&<><div className="row wrap"><button type="button" onClick={()=>format('bold')}>{tr('Negrito')}</button><button type="button" onClick={()=>format('italic')}>{tr('Itálico')}</button></div>{input('Ligação HTTPS',url,setUrl,'url')}<button type="button" onClick={()=>format('link')}>{tr('Inserir ligação')}</button></>}<label>{tr(block.type==='orderedlist'?'Itens (um por linha)':block.type==='heading2'||block.type==='heading3'||block.type==='heading4'?'Título de secção':'Texto')}<textarea ref={field} value={block.text} onSelect={e=>{const v=e.currentTarget;selection.current={start:v.selectionStart,end:v.selectionEnd};}} onChange={e=>text(e.target.value)}/></label>{block.type==='quote'&&input('Autoria da citação',block.source,source=>onChange({...block,source}))}{error&&<p role="alert">{tr(error)}</p>}</div>;
}
