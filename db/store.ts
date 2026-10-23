import { env } from 'cloudflare:workers';
import {inValidation,validationSql} from './validation';
export function db(){
 if(!env.DB)throw new Error('Base de dados temporariamente indisponível. Tente novamente.');
 const raw=env.DB;
 return inValidation()?{
  prepare:(sql:string)=>raw.prepare(validationSql(sql)),
  batch:(statements:D1PreparedStatement[])=>raw.batch(statements),
 }:raw;
}
export const now=()=>new Date().toISOString();
export const uid=()=>crypto.randomUUID();
export function log(action:string,entity:string,detail:string){return db().prepare('INSERT INTO audit (id,action,entity,detail,created) VALUES (?,?,?,?,?)').bind(uid(),action,entity,detail,now());}
export async function all(sql:string,...args:any[]){return (await db().prepare(sql).bind(...args).all()).results as any[];}
export async function one(sql:string,...args:any[]){return await db().prepare(sql).bind(...args).first() as any;}
