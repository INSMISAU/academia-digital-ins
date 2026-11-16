import {ACCESS,ACCESS_OPTIONS} from '@/lib/academy-access-settings';
import {withTeam} from '@/lib/team-access';
export const GET=(req:Request)=>withTeam(req,()=>ACCESS(req),true);
export const POST=GET;
export const OPTIONS=ACCESS_OPTIONS;
