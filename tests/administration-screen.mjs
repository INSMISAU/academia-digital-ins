import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync('components/academy/team-access.tsx','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
}).outputText;

async function screen({key=false,status=401,message='A ligação privada é inválida ou expirou.'}={}){
 const state=[],effects=[];let index=0,first=true;
 const react={...React,useState(initial){const slot=index++;if(first)state[slot]=initial;return [state[slot],value=>{state[slot]=typeof value==='function'?value(state[slot]):value;}];},useEffect(effect){if(first)effects.push(effect);}};
 const client={academyAdministration:()=>true,academyValidation:()=>false,hasTeamAccess:()=>key,
  academyReadJson:async()=>{if(status!==200)throw Object.assign(new Error(message),{status});return {};}};
 const context={exports:{},Error,require:id=>id==='react'?react:id==='@/lib/academy-client'?client:require(id),location:{hash:'',search:'?administracao=1'}};
 vm.runInNewContext(code,context);
 const render=()=>{index=0;return renderToStaticMarkup(context.exports.TeamGate({children:React.createElement('p',null,'Painel autorizado')}));};
 render();first=false;effects.forEach(effect=>effect());await new Promise(setImmediate);return render();
}

const initial=await screen();
assert.match(initial,/Administração da Academia/);assert.match(initial,/Email/);assert.match(initial,/Palavra-passe/);assert.match(initial,/>Entrar</);
assert.doesNotMatch(initial,/role="alert"|inválid|expir|perfis do INS|equipa|validação|Tentar novamente|Código de acesso|Ligação privada|Ologa/);
const invalid=await screen({key:true});assert.match(invalid,/role="alert"/);assert.match(invalid,/Acesso inválido ou expirado/);
assert.match(await screen({key:true,status:200}),/Painel autorizado/);
assert.match(await screen({status:503,message:'Serviço temporariamente indisponível.'}),/Serviço temporariamente indisponível/);
console.log('Administration screen: clean first visit, explicit invalid-access error, authorised entry and visible service failure passed.');
