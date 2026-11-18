import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const context={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/academy-responsive-image.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const image=context.exports.responsiveImage,url='/api/completion?image=fixture';
const variants=[{width:480,height:480},{width:96,height:96},{width:240,height:240}],before=JSON.stringify(variants);
const props=image(url,variants,'240px',240);assert.equal(props.src,url+'&width=240');assert.equal(props.srcSet,url+'&width=96 96w, '+url+'&width=240 240w, '+url+'&width=480 480w');assert.equal(props.sizes,'240px');assert.equal(props.width,240);assert.equal(JSON.stringify(variants),before);
assert.equal(image(url,[{width:120,height:80}],'100vw').src,url+'&width=120');
assert.equal(image(url,undefined,'100vw').src,url);assert.equal(image(url,undefined,'100vw').srcSet,undefined,'Do not invent missing variants for older records');
assert.equal(image(url,[{width:-1,height:1},{width:240,height:240},{width:240,height:240},{width:999999,height:1}],'100vw').srcSet,url+'&width=240 240w');
console.log('Responsive images: only generated variants, correct dimensions, no enlargement assumptions, legacy fallback and input preservation passed.');
