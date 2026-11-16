import {POST as exportReport,OPTIONS} from '@/app/api/export/route';
import {withTeam} from '@/lib/team-access';
export {OPTIONS};
export const POST=(req:Request)=>withTeam(req,()=>exportReport(req),true);
