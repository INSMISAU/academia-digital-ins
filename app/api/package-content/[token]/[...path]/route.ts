import {packageContent} from '@/lib/academy/packages';
import {AcademyError} from '@/lib/academy/core';
export async function GET(req:Request,{params}:{params:Promise<{token:string,path:string[]}>}){try{const p=await params;return await packageContent(req,p.token,p.path.join('/'));}catch(e:any){return new Response(e instanceof AcademyError?e.message:'Pacote indisponível',{status:e instanceof AcademyError?e.status:503});}}
