import {PDFDocument,rgb,type PDFFont,type PDFPage} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {reportFontBase64} from './academy-report-font';
import {reportMetrics} from './academy-report-indicators';
import {translate,type AcademyLanguage} from './academy-i18n';
export type ReportPdfOptions={language:AcademyLanguage;generated:string;inactiveDays:number;filters:string[];institution:string};
export async function reportPdf(rows:any[],options:ReportPdfOptions){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(Uint8Array.from(atob(reportFontBase64),c=>c.charCodeAt(0)),{subset:true});
 const supported=new Set(font.getCharacterSet()),tr=(s:string)=>translate(s,options.language),W=842,H=595,M=28,ink=rgb(.08,.22,.28),muted=rgb(.32,.38,.42),line=rgb(.79,.83,.85),light=rgb(.95,.97,.98);
 function wrap(value:unknown,width:number,size:number){const text=String(value??'—');for(const char of text)if(!['\n','\r','\t'].includes(char)&&!supported.has(char.codePointAt(0)!))throw Error('O PDF não suporta alguns caracteres. Os dados originais não foram alterados.');
  const result:string[]=[];for(const paragraph of text.replace(/\r/g,'').split('\n')){let current='';for(const word of paragraph.split(/\s+/)){const candidate=current?current+' '+word:word;if(font.widthOfTextAtSize(candidate,size)<=width){current=candidate;continue;}if(current)result.push(current);current='';for(const char of word){if(current&&font.widthOfTextAtSize(current+char,size)>width){result.push(current);current='';}current+=char;}}result.push(current);}return result.length?result:[''];
 }
 let page!:PDFPage,y=0;
 const draw=(text:string,x:number,y:number,size=9,color=ink)=>page.drawText(text,{x,y,size,font,color});
 function newPage(){page=pdf.addPage([W,H]);y=H-M;for(const text of wrap(options.institution,W-2*M,13)){draw(text,M,y,13);y-=17;}draw(tr('Relatório de formação'),M,y-5,11);y-=30;page.drawLine({start:{x:M,y},end:{x:W-M,y},thickness:.7,color:line});y-=20;}
 function paragraph(text:string,size=9){for(const v of wrap(text,W-2*M,size)){if(y<60)newPage();draw(v,M,y,size);y-=size+5;}}
 newPage();paragraph(tr('Gerado em')+': '+new Date(options.generated).toLocaleString(options.language==='en'?'en-GB':'pt-MZ',{timeZone:'Africa/Maputo'})+' · Maputo (UTC+2)');
 paragraph(tr('Filtros aplicados'),11);for(const text of options.filters.length?options.filters:[tr('Todos os registos seleccionados')])paragraph(text);
 paragraph(tr('Dias sem actividade')+': '+options.inactiveDays);y-=8;paragraph(tr('Resumo dos indicadores'),11);
 const metrics=reportMetrics(rows,options.inactiveDays,Date.parse(options.generated));
 for(let i=0;i<metrics.length;i+=2){if(y<110)newPage();const height=49,width=(W-2*M-14)/2;for(let j=0;j<2&&i+j<metrics.length;j++){const [label,value]=metrics[i+j],x=M+j*(width+14);page.drawRectangle({x,y:y-height+10,width,height,color:light});for(const [n,text]of wrap(tr(label),width-18,8).entries())draw(text,x+9,y-3-n*11,8,muted);draw(String(value),x+9,y-29,13);}y-=height+8;}
 y-=3;paragraph(tr('A taxa de aprovação considera apenas inscrições com avaliação. A inactividade considera inscrições por concluir.'),8);
 if(!rows.length)paragraph(tr('Sem registos neste filtro.'),10);
 const widths=[112,155,65,130,66,55,48,65,90],headers=['Participante','Curso','Província','Instituição','Inscrição','Aulas','Melhor nota','Estudo (h)','Conclusão'],size=7.3,leading=10;
 function tablePage(){newPage();const lines=headers.map((h,i)=>wrap(tr(h),widths[i]-10,8)),height=Math.max(...lines.map(v=>v.length))*11+12;let x=M;for(let i=0;i<headers.length;i++){page.drawRectangle({x,y:y-height,width:widths[i],height,color:ink});lines[i].forEach((text,n)=>draw(text,x+5,y-12-n*11,8,rgb(1,1,1)));x+=widths[i];}y-=height;}
 if(rows.length)tablePage();
 for(const [index,e]of rows.entries()){
  const values=[e.participant,e.c.title,e.province,e.institution,e.created.slice(0,10),e.done+'/'+e.total,e.best===null?'—':e.best+'%',(e.studySeconds/3600).toFixed(2),tr(e.eligible?'Concluído':'Em curso')],cells=values.map((v,i)=>wrap(v,widths[i]-10,size)),count=Math.max(...cells.map(v=>v.length));let offset=0;
  while(offset<count){let available=Math.floor((y-48-12)/leading);if(available<1){tablePage();available=Math.floor((y-48-12)/leading);}const take=Math.min(count-offset,available),height=take*leading+12;let x=M;
   for(let i=0;i<cells.length;i++){page.drawRectangle({x,y:y-height,width:widths[i],height,color:index%2?light:rgb(1,1,1),borderColor:line,borderWidth:.35});cells[i].slice(offset,offset+take).forEach((text,n)=>draw(text,x+5,y-11-n*leading,size));x+=widths[i];}y-=height;offset+=take;if(offset<count)tablePage();
  }
 }
 const pages=pdf.getPages();for(const [i,p]of pages.entries()){p.drawLine({start:{x:M,y:37},end:{x:W-M,y:37},thickness:.5,color:line});p.drawText(tr('Página')+' '+(i+1)+' / '+pages.length,{x:W-130,y:22,size:8,font,color:muted});}
 pdf.setTitle(tr('Relatório de formação'));pdf.setLanguage(options.language==='en'?'en-GB':'pt-MZ');return pdf.save();
}
