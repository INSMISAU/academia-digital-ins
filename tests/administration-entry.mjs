import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/server/index.js'},...fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js').map(p=>({type:'ESModule',path:'dist/server/'+p}))],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
try{
 for(const headers of [{},{'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'perciliamuianga@gmail.com'}]){
  const response=await mf.dispatchFetch('https://academy.test/',{headers});
  assert.equal(response.status,200);
  const html=await response.text();
  const link=html.match(/<a\b[^>]*class="academy-admin-entry"[^>]*>/)?.[0];
  assert(link,'The Administration entry must be present in the rendered page');
  const href=link.match(/href="([^"]+)"/)?.[1];
  assert.equal(href,'https://insmisau.github.io/academia-digital-ins/?administracao=1#gestao','Hosted Administration must use the public Pages entry, without a ChatGPT sign-in route');
 }
 console.log('Administration entry: compiled Worker renders the public Pages link both anonymously and with an owner identity.');
}finally{await mf.dispose();}
