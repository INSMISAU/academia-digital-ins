import {GET as read, POST as write} from '@/app/api/account/route';
import {withTeam} from '@/lib/team-access';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>withTeam(req,()=>read(req),true);
export const POST=(req:Request)=>withTeam(req,()=>write(req),true);
export {pagesPreflight as OPTIONS} from '@/lib/academy-cors';
