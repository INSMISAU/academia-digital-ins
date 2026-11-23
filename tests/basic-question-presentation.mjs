import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {BasicQuestionFields} from './components/academy/basic-question-fields';import data from './lib/basic-course/approved.json';import {setLanguage} from './components/academy/complete/language';export {data,setLanguage};export const render=(q,n,disabled=false)=>renderToStaticMarkup(React.createElement(BasicQuestionFields,{question:q,number:n,disabled,onText(){},onOption(){},onExplanation(){}}));`,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',external:['react','react-dom/server'],tsconfig:'tsconfig.json'});
await fs.writeFile('.sites-runtime/question-presentation.mjs',result.outputFiles[0].text);
const {render,data,setLanguage}=await import(pathToFileURL(path.resolve('.sites-runtime/question-presentation.mjs')).href);
const {parseHTML}=await import(pathToFileURL(path.resolve('../../avaliacao-modulo-surtos/qa-percurso/node_modules/linkedom/esm/index.js')).href);
const before=JSON.stringify(data);let checks=0;
for(const m of data.modules)for(const [i,q]of m.questions.entries()){
 const {document}=parseHTML(render(q,i+1));assert.equal(document.querySelectorAll('legend').length,0);assert.equal(document.querySelector('fieldset>h3').textContent,'Pergunta '+(i+1));
 const fields=[...document.querySelectorAll('textarea')];assert.deepEqual(fields.map(x=>parseHTML("<p>"+x.textContent+"</p>").document.querySelector("p").textContent),[q.text,...q.options.map(o=>o.text),q.explanation]);assert.equal(document.querySelector('.basic-answer-key').textContent,'Resposta correcta aprovada: '+q.correct.join(', '));assert.equal(document.querySelectorAll('.is-correct').length,q.correct.length);checks+=5;
}
assert.equal(JSON.stringify(data),before);checks++;
const locked=parseHTML(render(data.modules[0].questions[0],1,true)).document;assert.ok(locked.querySelector('fieldset').hasAttribute('disabled'));checks++;
setLanguage('en',false);assert.match(render(data.modules[0].questions[0],1),/Approved correct answer/);checks++;
console.log(checks+' verificações de apresentação passaram; conteúdo aprovado preservado.');

