import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/server/index.js'},...fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js').map(p=>({type:'ESModule',path:'dist/server/'+p})),...fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.wasm')).map(p=>({type:'CompiledWasm',path:'dist/server/'+p}))],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
try{
 for(const headers of [{},{'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'perciliamuianga@gmail.com'}]){
  const response=await mf.dispatchFetch('https://academy.test/',{headers});
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/Administração da Academia/,'The compiled shell must render the existing access gate');
  assert.match(html,/A abrir a Academia/,'The access gate must expose its pending state');
  assert(!html.includes('scrypt:'),'Password material never appears in the page');
 }
 console.log('Administration entry: compiled shell renders the access gate and pending state without credentials; navigation URL is covered by pages-client.');
}finally{await mf.dispose();}
