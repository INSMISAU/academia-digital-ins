import {one} from '@/db/store';
import {isAdmin} from '@/db/access';
import {env} from 'cloudflare:workers';
import {mediaObjectKey} from '@/db/validation';
import {safeResourceUrl} from '@/lib/academy-content';
export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const record=await one("SELECT * FROM academy_entries WHERE id=? AND kind='recurso'",id);if(!record||record.status!=='publicado'&&!isAdmin(req))return new Response('Material indisponível',{status:404});const body=JSON.parse(record.payload);
  if(!body.fileId){const url=safeResourceUrl(body.url);return url?Response.redirect(url,302):new Response('Ligação indisponível',{status:404});}
  const media=await one('SELECT * FROM media WHERE id=?',body.fileId),file=media&&env.BUCKET?await env.BUCKET.get(mediaObjectKey(media.id)):null;if(!file)return new Response('Ficheiro indisponível',{status:404});
  return new Response(file.body,{headers:{'Content-Type':media.type,'Content-Disposition':(/^(image|audio|video)\//.test(media.type)||media.type==='application/pdf'?'inline':'attachment')+'; filename="'+media.name.replace(/[^A-Za-z0-9._-]/g,'_')+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Não foi possível abrir o material',{status:503});}
}
