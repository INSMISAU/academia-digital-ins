import {withTeam} from '@/lib/team-access';
import * as route from '@/app/api/completion/route';
export const GET=(req:Request)=>withTeam(req,()=>route.GET(req),true);
export const POST=(req:Request)=>withTeam(req,()=>route.POST(req),true);
export const OPTIONS=route.OPTIONS;
