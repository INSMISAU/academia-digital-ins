import {GET as read} from '@/app/api/resource/[id]/route';
import {withTeam} from '@/lib/team-access';
export const dynamic='force-dynamic';
export const GET=(req:Request, context:{params:Promise<{id:string}>})=>withTeam(req,()=>read(req,context),true);
export {pagesPreflight as OPTIONS} from '@/lib/academy-cors';
