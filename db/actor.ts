import {AsyncLocalStorage} from 'node:async_hooks';
const actor=new AsyncLocalStorage<{id:string;institution:string}>();
export const auditActor=()=>actor.getStore()||{id:'',institution:''};
export const runActor=<T>(id:string,institution:string,fn:()=>T)=>actor.run({id,institution},fn);
