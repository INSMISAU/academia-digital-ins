import {db} from '@/db/store';
import {visitorToken} from '@/db/access';
import {digest} from './registration-session';
export async function accountProfile(req:Request){const token=visitorToken(req);if(!token)return null;return db().prepare('SELECT account,name,email,trusted FROM registration_sessions WHERE token=? AND expires>?').bind(await digest(token),Date.now()).first<{account:string;name:string;email:string;trusted:number}>();}
