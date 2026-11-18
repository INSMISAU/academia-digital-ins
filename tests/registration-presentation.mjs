import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
await fs.mkdir('.sites-runtime',{recursive:true});const output=path.resolve('.sites-runtime/registration-presentation.cjs');
await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {Registration} from './components/academy/registration';import {setLanguage} from './components/academy/complete/language';export function render(language,unavailable){setLanguage(language,false);return renderToStaticMarkup(React.createElement(Registration,{course:{id:'qa-only',title:'Curso Básico em Investigação de Surtos'},notice:'',close(){},onSaved(){},unavailable}));}`,resolveDir:process.cwd(),loader:'tsx'},outfile:output,bundle:true,platform:'node',format:'cjs',tsconfig:'tsconfig.json',loader:{'.css':'empty'},plugins:[{name:'dialog-server-fixture',setup(b){b.onResolve({filter:/^@\/components\/ui\/dialog$/},()=>({path:'dialog',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import React from 'react';export const Dialog=({children})=>children;export const DialogContent=({children})=>React.createElement('section',{role:'dialog'},children);export const DialogTitle=({children})=>React.createElement('h2',null,children);export const DialogDescription=({children})=>React.createElement('p',null,children);`,loader:'jsx',resolveDir:process.cwd()}));}}],logLevel:'silent'});
const {render}=require(output);
for(const lang of ['pt','en'])for(const unavailable of [true,false]){
 const html=render(lang,unavailable);
 for(const id of ['nome','certificado','alternativo','sexo'])assert(html.includes('ins-ficha-'+id));
 assert.match(html,/type="email"/);assert.match(html,/type="tel"/);assert.match(html,/type="checkbox"/);
 assert.doesNotMatch(html,/temporariamente indisponível|temporarily unavailable|sessão terminou|session has ended|Os dois idiomas partilham/);
 assert(html.includes(lang==='pt'?'Nome completo do participante':"Participant&#x27;s full name"));
 assert(html.includes(lang==='pt'?'Use a grafia e os acentos':'Use the spelling and accents'));
}
console.log('Registration presentation: approved fields, certificate-name guidance and controls preserved; internal availability/session notes absent in PT/EN.');
