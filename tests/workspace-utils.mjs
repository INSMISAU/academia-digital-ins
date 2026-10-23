import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
function module(path,extra={}){const context={exports:{},TextEncoder,Uint8Array,DataView,Set,...extra};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);return context.exports;}
const w=module('lib/academy-workspace.ts');
let rows=w.parseCSV('\ufeffNome;Província;Instituição\r\n"QA, A";Gaza;"Instituição; QA"\r\n"QA ""B""";Sofala;INS\r\n');assert.equal(rows.length,2);assert.equal(rows[0].instituicao,'Instituição; QA');assert.equal(rows[1].nome,'QA "B"');assert.throws(()=>w.parseCSV('Nome,Provincia\n"sem fecho,Gaza'));assert.throws(()=>w.parseCSV('Outro,Provincia\nA,Gaza'));
assert.equal(w.gradeQuestions([{id:'x',type:'curta',prompt:'QA',options:[],answer:'ação|accao',explanation:''}],{x:'AÇÃO'}).score,100);
assert.equal(w.gradeQuestions([{id:'x',type:'multipla',prompt:'QA',options:['A','B','C'],answer:[0,2],explanation:''}],{x:[2,0,0]}).score,100);
const e=module('lib/academy-export.ts');const data=e.spreadsheet([['Nome','Nota'],['João & QA',87],['=1+1',null]]);fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/export-qa.xlsx',data);assert.equal(data[0],0x50);assert.equal(data[1],0x4b);
console.log('Workspace utilities: CSV quoting and delimiters, accented headers, malformed files, grading, and XLSX generation passed.');
