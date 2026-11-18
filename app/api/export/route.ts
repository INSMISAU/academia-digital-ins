import {withPagesCors,pagesPreflight,permittedOrigin} from '@/lib/academy-cors';
import {isAdmin} from '@/db/access';
import {log,one} from '@/db/store';
import {limitedText} from '@/lib/registration-identity';
export const OPTIONS=pagesPreflight;
export const POST=(req:Request)=>withPagesCors(req,async()=>{
 if(!isAdmin(req)||!permittedOrigin(req))return Response.json({error:'Sem permissão para exportar.'},{status:403});
 try{const b=JSON.parse(await limitedText(req,250000));if(!['csv','xlsx','pdf'].includes(b.format)||!Array.isArray(b.ids)||b.ids.length>10000||b.ids.some((id:unknown)=>typeof id!=='string'||id.length>100))return Response.json({error:'Selecção inválida.'},{status:422});if(b.format==='pdf'&&b.paginated===true){
 const ids=[...new Set<string>(b.ids)];if(ids.length>2000)return Response.json({error:'O PDF aceita até 2000 inscrições. Reduza a selecção.'},{status:422});
 if(!['pt','en'].includes(b.language)||!Number.isInteger(b.inactiveDays)||b.inactiveDays<1||b.inactiveDays>3650||!Array.isArray(b.filters)||b.filters.length>8||b.filters.some((v:unknown)=>typeof v!=='string'||v.length>500))return Response.json({error:'Selecção inválida.'},{status:422});
 if(b.criteria!==undefined&&(!b.criteria||typeof b.criteria!=='object'||Array.isArray(b.criteria)||Object.keys(b.criteria).some(key=>!['course','program','teacher','cohort','province','institution','from','to'].includes(key))||Object.values(b.criteria).some(value=>typeof value!=='string'||value.length>200)))return Response.json({error:'Selecção inválida.'},{status:422});
 const {reportData}=await import('@/lib/academy-report-data'),{reportPdf}=await import('@/lib/academy-report-pdf');const rows=await reportData(ids,b.criteria||{}),config=await one("SELECT payload FROM academy_entries WHERE id='institucional' AND kind='configuracao'"),institution=config?JSON.parse(config.payload).name||'Academia Digital do INS':'Academia Digital do INS';
 const bytes=await reportPdf(rows,{language:b.language,generated:new Date().toISOString(),inactiveDays:b.inactiveDays,filters:b.filters,institution});
 await log('Exportar relatório','inscricoes',JSON.stringify({format:'pdf',ids,paginated:true,language:b.language,inactiveDays:b.inactiveDays})).run();return new Response(bytes as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="academia-relatorio.pdf"','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
 }await log('Exportar relatório','inscricoes',JSON.stringify({format:b.format,ids:[...new Set(b.ids)]})).run();return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch(e){const message=e instanceof Error?e.message:'';if(['A selecção mudou. Actualize os dados antes de exportar.','O PDF não suporta alguns caracteres. Os dados originais não foram alterados.'].includes(message))return Response.json({error:message},{status:422,headers:{'Cache-Control':'no-store'}});return Response.json({error:'Não foi possível registar a exportação.'},{status:503});}
});
