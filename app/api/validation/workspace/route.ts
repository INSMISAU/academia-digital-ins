import {GET as read} from '@/app/api/workspace/route';
import {withTeam} from '@/lib/team-access';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>withTeam(req,()=>read(req),true);
export {pagesPreflight as OPTIONS} from '@/lib/academy-cors';
