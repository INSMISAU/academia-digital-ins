import {postAdministrationSession} from '@/lib/administration-session';
import {withPagesCors,pagesPreflight} from '@/lib/academy-cors';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>withPagesCors(req,()=>postAdministrationSession(req));
export const OPTIONS=pagesPreflight;
