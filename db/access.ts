import {one} from './store';

// These identity headers are set by Sites dispatch, never by the app's client.
// Standalone hosting must supply an equivalent trusted authentication boundary.
export function isAdmin(req:Request){
 return !!req.headers.get('oai-authenticated-user-id') && req.headers.get('oai-authenticated-user-email')?.toLowerCase()==='perciliamuianga@gmail.com';
}
const cookieName='__Host-academy-demo';
export function visitorToken(req:Request){
 const token=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 return token&&/^[a-f0-9]{64}$/.test(token)?token:null;
}
export function newVisitorToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function visitorKey(token:string|null){if(!token)return '';return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');}
export function visitorCookie(token:string){return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`;}
export async function ownsEnrollment(req:Request,id:string){
 if(isAdmin(req))return true;
 const key=await visitorKey(visitorToken(req));
 return !!key&&!!await one('SELECT id FROM enrollments WHERE id=? AND visitorKey=?',id,key);
}
