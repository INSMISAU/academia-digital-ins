import {withPagesCors,pagesPreflight,permittedOrigin} from '@/lib/academy-cors';
import {mediaObjectKey} from '@/db/validation';
import {isAdmin} from '@/db/access';
import {env} from 'cloudflare:workers';
import {db,uid,now,log} from '@/db/store';
async function postMedia(req:Request){try{if(!isAdmin(req))return Response.json({error:'Operação reservada à administração.'},{status:403});if(!permittedOrigin(req))return Response.json({error:'Origem inválida.'},{status:403});if(!env.BUCKET)throw Error('Armazenamento indisponível.');const form=await req.formData();const file=form.get('file');if(!(file instanceof File))throw Error('Seleccione um ficheiro.');const types=['application/pdf','image/png','image/jpeg','image/webp','audio/mpeg','video/mp4','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];if(!types.includes(file.type)||file.size>20*1024*1024||file.size===0)throw Error('Use PDF, imagem, MP3, MP4, Word ou PowerPoint, até 20 MB.');const id=uid();await env.BUCKET.put(mediaObjectKey(id),await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});try{await db().batch([db().prepare('INSERT INTO media (id,name,type,size,created) VALUES (?,?,?,?,?)').bind(id,file.name.slice(0,200),file.type,file.size,now()),log('Carregar material',id,file.name)]);}catch(e){await env.BUCKET.delete(mediaObjectKey(id));throw e;}return Response.json({id});}catch(e:any){return Response.json({error:e.message},{status:400});}}

export function POST(req:Request){return withPagesCors(req,()=>postMedia(req));}
export function OPTIONS(req:Request){return pagesPreflight(req);}
