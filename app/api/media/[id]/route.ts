import {isAdmin} from '@/db/access';
import {env} from 'cloudflare:workers';
import {one} from '@/db/store';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){if(!isAdmin(req))return new Response('Acesso reservado',{status:403});const {id}=await params;const m=await one('SELECT * FROM media WHERE id=?',id);if(!m||!env.BUCKET)return new Response('Não encontrado',{status:404});const obj=await env.BUCKET.get(id);if(!obj)return new Response('Não encontrado',{status:404});return new Response(obj.body,{headers:{'Content-Type':m.type,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(m.name),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});}
