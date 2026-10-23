import {GET as read} from '@/app/api/resource/[id]/route';
import {runAdministration} from '@/db/administration';
export const dynamic='force-dynamic';
export const GET=(req:Request,context:{params:Promise<{id:string}>})=>runAdministration(()=>read(req,context));
