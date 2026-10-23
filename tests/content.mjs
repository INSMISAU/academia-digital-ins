import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
// Test fixtures only. These values are never seeded into the live catalogue.
const context = {exports: {}, URL};
vm.runInNewContext(ts.transpileModule(readFileSync('lib/academy-content.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, context);
const c = context.exports;
const legacy = 'Primeiro parágrafo.\n\nSegundo parágrafo.\nUma linha.';
assert.equal(c.courseOverview(legacy).summary, legacy);
assert.equal(c.lessonContent(legacy).blocks[0].text, legacy);
assert.equal(c.encodeOverview(c.courseOverview(legacy)), legacy, 'No forced conversion of legacy course descriptions');
const overview = {summary: 'Resumo de teste', objectives: 'Primeiro objectivo\nSegundo objectivo', audience: 'Equipa de teste', prerequisites: '', modality: 'Online'};
assert.equal(JSON.stringify(c.courseOverview(c.encodeOverview(overview))), JSON.stringify(overview));
assert.throws(() => c.encodeOverview({...overview, summary: 'x'.repeat(30000)}), /30000/);
assert.throws(() => c.encodeOverview({...overview, modality: 'Inventada'}));
const allTypes = Object.keys(c.blockLabels).map((type, i) => ({...c.newBlock(type, String(i)), text: 'Texto de teste', title: 'Material de teste', url: 'https://example.test/material', alt: 'Descrição de teste', source: 'Fonte de teste'}));
const encoded = c.encodeLesson({align: 'justify', blocks: allTypes});
assert.equal(JSON.stringify(c.lessonContent(encoded)), JSON.stringify({align: 'justify', blocks: allTypes}));
assert(!c.lessonExcerpt(encoded).includes(c.LESSON_FORMAT));
for (const url of ['javascript:alert(1)', 'data:text/html,x', 'http://example.test', '//example.test', 'https://user:pass@example.test', 'https://example.test/api/media/private', 'https://example.test/a b', 'https://example.test/\nmal']) assert.equal(c.safeResourceUrl(url), null, url);
assert.equal(c.safeResourceUrl('https://example.test/manual.pdf'), 'https://example.test/manual.pdf');
assert.equal(c.videoEmbed('https://www.youtube.com/watch?v=abcdefghijk'), 'https://www.youtube-nocookie.com/embed/abcdefghijk');
assert.equal(c.videoEmbed('https://www.youtube.com.evil.test/watch?v=abcdefghijk'), null);
assert.equal(c.videoEmbed('https://youtu.be/abcdefghijk'), 'https://www.youtube-nocookie.com/embed/abcdefghijk');
assert.equal(c.videoEmbed('https://vimeo.com/123456'), 'https://player.vimeo.com/video/123456?dnt=1');
assert.throws(() => c.encodeLesson({align:'left', blocks: []}));
assert.throws(() => c.encodeLesson({align:'left', blocks: [{...allTypes.find(b => b.type === 'image'), source:''}]}), /fonte/);
assert.throws(() => c.encodeLesson({align:'left', blocks: [{...allTypes[0], text:'x'.repeat(20000)}]}), /20000/);
const reordered = c.moveBlock(allTypes, 0, 2);
assert.equal(reordered[2].id, '0'); assert.equal(allTypes[0].id, '0', 'Order changes do not mutate original');
assert.equal(c.lessonContent(c.encodeLesson({align:'left', blocks:reordered})).blocks[2].id, '0');
const groups = c.moduleGroups([{module:'A',id:1},{module:'A',id:2},{module:'B',id:3},{module:'A',id:4}]);
assert.equal(groups.map(g=>g.lessons.map(l=>l.id).join(',')).join('|'), '1,2|3|4', 'Grouping must not silently reorder the established lesson sequence');
assert.equal(c.lessonContent(c.LESSON_FORMAT+'{broken').blocks[0].text,c.LESSON_FORMAT+'{broken');
console.log('Content: legacy text, versioned round trip, all 12 block types, safe links, video hosts, validation, ordering and module sequence passed.');
