import {withPagesCors,pagesPreflight} from '@/lib/academy-cors';
import {handleBasic} from '@/lib/basic-course/service';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>withPagesCors(req,()=>handleBasic(req));
export const POST=GET;
export const OPTIONS=pagesPreflight;
