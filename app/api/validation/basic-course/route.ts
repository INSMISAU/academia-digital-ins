import {handleBasic} from '@/lib/basic-course/service';
import {withTeam} from '@/lib/team-access';
import {pagesPreflight} from '@/lib/academy-cors';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>withTeam(req,()=>handleBasic(req),true);
export const POST=GET;
export const OPTIONS=pagesPreflight;
