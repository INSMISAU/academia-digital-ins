import {GET as read,POST as write,OPTIONS as preflight} from '@/app/api/workspace/route';
import {withTeam} from '@/lib/team-access';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>withTeam(req,()=>read(req));
export const POST=(req:Request)=>withTeam(req,()=>write(req));
export const OPTIONS=preflight;
