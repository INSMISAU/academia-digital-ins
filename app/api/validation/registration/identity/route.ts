import {POST as write} from '@/app/api/registration/identity/route';
import {withTeam} from '@/lib/team-access';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>withTeam(req,()=>write(req),true);
export {pagesPreflight as OPTIONS} from '@/lib/academy-cors';
