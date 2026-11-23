import {withTeam} from '@/lib/team-access';
import {pagesPreflight} from '@/lib/academy-cors';
import {handleBasic} from '@/lib/basic-course/service';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>withTeam(req,()=>handleBasic(req));
export const POST=GET;
export const OPTIONS=pagesPreflight;
