import {withPagesCors,pagesPreflight,permittedOrigin} from '@/lib/academy-cors';
import {isAdmin} from '@/db/access';
import {log} from '@/db/store';
import {limitedText} from '@/lib/registration-identity';
export const OPTIONS=pagesPreflight;
export const POST=(req:Request)=>withPagesCors(req,async()=>{
 if(!isAdmin(req)||!permittedOrigin(req))return Response.json({error:'Sem permissão para exportar.'},{status:403});
 try{const b=JSON.parse(await limitedText(req,250000));if(!['csv','xlsx','pdf'].includes(b.format)||!Array.isArray(b.ids)||b.ids.length>10000||b.ids.some((id:unknown)=>typeof id!=='string'||id.length>100))return Response.json({error:'Selecção inválida.'},{status:422});await log('Exportar relatório','inscricoes',JSON.stringify({format:b.format,ids:[...new Set(b.ids)]})).run();return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Não foi possível registar a exportação.'},{status:503});}
});
