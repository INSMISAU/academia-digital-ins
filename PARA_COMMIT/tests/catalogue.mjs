import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('lib/academy-catalogue.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
const context = {exports: {}, URLSearchParams};
vm.runInNewContext(code, context);
const {defaultCatalogue: defaults, filterCatalogue: filter, courseCategories: categories, catalogueHash, readCatalogueHash, lessonPercent, latestEnrollment} = context.exports;
// Fixtures are test inputs only; they are never loaded into the catalogue or database.
const courses = [
  {id:'a',title:'Água e saúde',category:'Saúde pública',summary:'Prevenção',status:'publicado',hours:2,updated:'2026-10-01',external:null},
  {id:'b',title:'Zoonoses',category:'Vigilância',summary:'Resposta',status:'publicado',hours:0,updated:'2026-10-03',external:'https://example.test/curso'},
  {id:'c',title:'Curso em preparação',category:'Área reservada',summary:'Rascunho',status:'rascunho',hours:1,updated:'2026-10-04',external:null},
];
const ids = rows => Array.from(rows, row => row.id).join(',');
assert.equal(ids(filter(courses, defaults)), 'b,a', 'Public catalogue excludes drafts even with an administrative response');
assert.equal(ids(filter(courses, {...defaults,search:'  agua  '})), 'a', 'Search accepts unaccented input and surrounding spaces');
assert.equal(ids(filter(courses, {...defaults,search:'PREVENCAO'})), 'a', 'Summary search is accent and case insensitive');
assert.equal(ids(filter(courses, {...defaults,category:'Vigilância',mode:'externo'})), 'b');
assert.equal(ids(filter(courses, {...defaults,category:'Saúde pública',mode:'externo'})), '');
assert.equal(ids(filter(courses, {...defaults,mode:'academia'})), 'a');
assert.equal(ids(filter(courses, {...defaults,order:'duracao'})), 'a,b', 'Unknown duration sorts after known duration');
assert.equal(ids(filter(courses, defaults, true, 'rascunho')), 'c', 'Editorial filters retain access to drafts for management');
assert.equal(ids(courses), 'a,b,c', 'Sorting does not mutate the API response');
assert.equal(categories(courses).length, 2, 'Draft-only areas stay out of the public categories');
assert.equal(categories(courses).reduce((total, area) => total + area.count, 0), 2);
const filters = {search:'água & saúde?',category:'Saúde pública',mode:'academia',order:'titulo'};
const route = readCatalogueHash(catalogueHash(filters));
assert.equal(route.view, 'catalogo');
assert.equal(JSON.stringify(route.filters), JSON.stringify(filters), 'Shareable links preserve all filters and reserved characters');
assert.equal(readCatalogueHash('').view, 'inicio');
assert.equal(readCatalogueHash('#catalogo?tipo=invalido&ordem=invalida').filters.mode, 'todos');
assert.equal(readCatalogueHash('#catalogo?tipo=invalido&ordem=invalida').filters.order, 'recentes');
assert.equal(lessonPercent({done:1,total:3}), 33);
assert.equal(lessonPercent({done:0,total:0}), 0);
assert.equal(lessonPercent({done:4,total:3}), 100);
assert.equal(latestEnrollment([]), undefined);
assert.equal(latestEnrollment([
  {id:'older',eligible:false,created:'2026-10-01',progress:[{completed:'2026-10-15'}]},
  {id:'newer',eligible:false,created:'2026-10-02',attempts:[{created:'2026-10-16'}]},
  {id:'complete',eligible:true,created:'2026-10-17'},
]).id, 'newer', 'Resume uses the most recent activity of an incomplete course');
console.log('Catalogue: published courses, combined filters, accented search, ordering, URL round-trip, progress and resume passed.');
