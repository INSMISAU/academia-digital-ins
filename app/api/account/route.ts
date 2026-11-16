import {getAccount,postAccount} from '@/lib/academy-account';
import {withPagesCors,pagesPreflight} from '@/lib/academy-cors';
export const dynamic='force-dynamic';
export function GET(req:Request){return withPagesCors(req,()=>getAccount(req));}
export function POST(req:Request){return withPagesCors(req,()=>postAccount(req));}
export function OPTIONS(req:Request){return pagesPreflight(req);}
