import Verify from '../../[code]/page';
import {one} from '@/db/store';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const c=await one('SELECT code FROM certificates WHERE id=? OR code=?',id,id);return Verify({params:Promise.resolve({code:c?.code||id})});}
