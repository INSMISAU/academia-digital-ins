import {scrypt,randomBytes,timingSafeEqual} from 'node:crypto';

// OWASP's scrypt configuration for a 16 MiB memory budget; native Workers crypto.
const options={N:16384,r:8,p:5,maxmem:32*1024*1024};
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,32,options,(error,key)=>error?reject(error):resolve(key)));
export function validPassword(value:unknown):value is string{return typeof value==='string'&&Array.from(value).length>=15&&value.length<=256;}
export async function passwordHash(password:string){
 const salt=randomBytes(16).toString('hex');return 'scrypt:16384:8:5:'+salt+':'+(await derive(password,salt)).toString('hex');
}
export async function passwordMatches(password:string,stored:string){
 const parts=stored.split(':');if(parts.length!==6||parts.slice(0,4).join(':')!=='scrypt:16384:8:5'||! /^[a-f0-9]{32}$/.test(parts[4])||! /^[a-f0-9]{64}$/.test(parts[5]))return false;
 return timingSafeEqual(await derive(password,parts[4]),Buffer.from(parts[5],'hex'));
}
