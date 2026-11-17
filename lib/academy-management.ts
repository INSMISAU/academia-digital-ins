import * as completion from '@/app/api/completion/route';
import * as exports from '@/app/api/export/route';
import * as academy from '@/app/api/academy/route';
import * as workspace from '@/app/api/workspace/route';
import * as media from '@/app/api/media/route';
import * as file from '@/app/api/media/[id]/route';
import * as resource from '@/app/api/resource/[id]/route';
import * as certificate from '@/app/api/certificate/[id]/route';
import * as settings from '@/app/api/registration/settings/route';
import {withRoles} from './academy-roles';
export async function management(req:Request,path:string[]){
 const route=path.join('/');
 const modules:Record<string,any>={academy,workspace,completion,media,export:exports,'registration/settings':settings};
 const module=modules[route];
 const handler=module?.[req.method];
 if(handler)return withRoles(req,route,()=>handler(req));
 if(req.method==='GET'&&path.length===2&&['media','resource','certificate'].includes(path[0])){
  const m={media:file,resource,certificate}[path[0] as 'media'|'resource'|'certificate'];
  return withRoles(req,route,()=>m.GET(req,{params:Promise.resolve({id:path[1]})}));
 }
 return Response.json({error:'Operação indisponível.'},{status:404});
}
