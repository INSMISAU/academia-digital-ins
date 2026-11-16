import {withPagesCors,pagesPreflight} from '@/lib/academy-cors';
import {teamAccess,prepareValidation} from '@/lib/team-access';
import {isAdmin} from '@/db/access';
export const dynamic='force-dynamic';
export function GET(req:Request){return withPagesCors(req,async()=>{
 const access=await teamAccess(req);
 if(!access&&!isAdmin(req))return Response.json({error:'A ligação privada é inválida ou expirou.'},{status:401,headers:{'Cache-Control':'no-store'}});
 return Response.json({label:access?.label||'Administração',expires:access?.expires||null},{headers:{'Cache-Control':'no-store'}});
});}
export function POST(req:Request){return withPagesCors(req,async()=>{
 if(!await teamAccess(req)&&!isAdmin(req))return Response.json({error:'Acesso reservado.'},{status:401});
 try{await prepareValidation();return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({error:'Não foi possível preparar a validação interna.'},{status:503});}
});}
export const OPTIONS=pagesPreflight;
