import {one} from './store';
import {keyFor} from '@/lib/registration-session';
import {inValidation,validationAdmin} from './validation';
import {inAdministration} from './administration';

// These identity headers are set by Sites dispatch, never by the app's client.
// Standalone hosting must supply an equivalent trusted authentication boundary.
export function isAdmin(req:Request){
 if(inAdministration())return true;
 if(inValidation())return validationAdmin();
 if(req.headers.has('Authorization') || (req.headers.has('Origin') && req.headers.get('Origin')!==new URL(req.url).origin))return false;
 return !!req.headers.get('oai-authenticated-user-id') && req.headers.get('oai-authenticated-user-email')?.toLowerCase()==='perciliamuianga@gmail.com';
}
const cookieName='__Host-academy-demo';
export function visitorToken(req:Request){
 const bearer=req.headers.get('Authorization');
 if(bearer!==null)return /^Bearer [a-f0-9]{64}$/.test(bearer)?bearer.slice(7):null;
 if(req.headers.has('Origin')&&req.headers.get('Origin')!==new URL(req.url).origin)return null;
 const token=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 return token&&/^[a-f0-9]{64}$/.test(token)?token:null;
}
export function newVisitorToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
export const visitorKey=keyFor;
export function visitorCookie(token:string){return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`;}
export async function ownsEnrollment(req:Request,id:string){
 if(isAdmin(req))return true;
 const key=await visitorKey(visitorToken(req));
 return !!key&&!!await one('SELECT id FROM enrollments WHERE id=? AND visitorKey=?',id,key);
}
