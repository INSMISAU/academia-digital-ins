import {runValidation} from '@/db/validation';
import {GET as serve} from '@/app/api/package-content/[token]/[...path]/route';
export const GET=(req:Request,context:{params:Promise<{token:string,path:string[]}>})=>runValidation(()=>serve(req,context),false);
