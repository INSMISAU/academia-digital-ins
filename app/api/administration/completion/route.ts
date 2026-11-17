import {withTeam} from '@/lib/team-access';
import * as route from '@/app/api/completion/route';
export const GET=(req:Request)=>withTeam(req,()=>route.GET(req));
export const POST=(req:Request)=>withTeam(req,()=>route.POST(req));
export const OPTIONS=route.OPTIONS;
