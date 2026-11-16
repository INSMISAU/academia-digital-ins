import {identityAction} from '@/lib/registration-identity';
import {withPagesCors,pagesPreflight} from '@/lib/academy-cors';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>withPagesCors(req,()=>identityAction(req));
export const OPTIONS=(req:Request)=>pagesPreflight(req);
