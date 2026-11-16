import {MFA,MFA_OPTIONS} from '@/lib/academy-mfa';
import {withTeam} from '@/lib/team-access';
export const GET=(req:Request)=>withTeam(req,()=>MFA(req),true);
export const POST=GET;
export const OPTIONS=MFA_OPTIONS;
