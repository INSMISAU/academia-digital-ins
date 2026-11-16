import {management} from '@/lib/academy-management';
import {pagesPreflight} from '@/lib/academy-cors';
export async function GET(req:Request,{params}:{params:Promise<{path:string[]}>}){const {path}=await params;return management(req,path);}
export const POST=GET;
export const OPTIONS=pagesPreflight;
