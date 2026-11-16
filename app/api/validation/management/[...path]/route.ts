import {management} from '@/lib/academy-management';
import {pagesPreflight} from '@/lib/academy-cors';
import {withTeam} from '@/lib/team-access';
export async function GET(req:Request,{params}:{params:Promise<{path:string[]}>}){const {path}=await params;return withTeam(req,()=>management(req,path),true);}
export const POST=GET;
export const OPTIONS=pagesPreflight;
