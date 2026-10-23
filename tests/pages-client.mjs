import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('lib/academy-client.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
const store = new Map();
const localStorage = {getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value)};
let clock = Date.now();
const requests = [];
function client(origin, storage = localStorage, search = '') {
  const context = {exports: {}, __ACADEMY_API_ORIGIN__: origin, Headers, crypto: webcrypto,
    Date: {now: () => clock}, localStorage: storage, location: {search}, URLSearchParams,
    fetch: (url, init) => { requests.push({url, init}); return Promise.resolve(new Response('{}')); },
  };
  vm.runInNewContext(code, context);
  return context.exports;
}
const origin = 'https://ins-academia-digital.perciliamuianga.chatgpt.site';
assert.equal(client(origin).academyAdministrationUrl(false),'?validacao=1#gestao');
assert.equal(client('').academyAdministrationUrl(false),'?validacao=1#gestao');
assert.equal(client('').academyAdministrationUrl(true),'?validacao=1#gestao');
assert.equal(client(origin).academyPublicUrl,'https://insmisau.github.io/academia-digital-ins/');
const ids=Array.from({length:100},()=>client('').academyRequestId());assert(ids.every(id=>/^[a-f0-9]{32}$/.test(id)));assert.equal(new Set(ids).size,100);
await client(origin).academyFetch('/api/academy');
const first = requests.at(-1);
assert.equal(first.url, origin + '/api/academy');
assert.equal(first.init.credentials, 'omit');
const token = first.init.headers.get('Authorization');
assert.match(token, /^Bearer [a-f0-9]{64}$/);
await client(origin).academyFetch('/api/academy');
assert.equal(requests.at(-1).init.headers.get('Authorization'), token, 'Reload retains the anonymous session');
await client(origin).academyFetch('/api/academy', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}'});
assert.equal(requests.at(-1).init.headers.get('Content-Type'), 'application/json');
clock += 31 * 24 * 60 * 60 * 1000;
await client(origin).academyFetch('/api/academy');
assert.notEqual(requests.at(-1).init.headers.get('Authorization'), token, 'Expired sessions rotate');
const blockedStorage = {getItem: () => {throw Error('Storage disabled');}, setItem: () => {throw Error('Storage disabled');}};
const temporary = client(origin, blockedStorage);
await temporary.academyFetch('/api/academy');
const temporaryToken = requests.at(-1).init.headers.get('Authorization');
await temporary.academyFetch('/api/academy');
assert.equal(requests.at(-1).init.headers.get('Authorization'), temporaryToken, 'Testing still works with storage disabled');
await client('').academyFetch('/api/academy');
assert.equal(requests.at(-1).url, '/api/academy');
assert.equal(requests.at(-1).init.credentials, 'same-origin');
assert.equal(requests.at(-1).init.headers.has('Authorization'), false, 'The existing Site retains cookie sessions');
const testClient=client(origin,localStorage,'?validacao=1');
assert.equal(testClient.academyValidation(),true);
await testClient.academyFetch('/api/academy?course=orientacao');
assert.equal(requests.at(-1).url,origin+'/api/validation/academy?course=orientacao');
assert.equal(testClient.academyUrl('/api/media/test-file'),origin+'/api/validation/media/test-file');
assert.equal(testClient.academyUrl('/verify/TEST'),origin+'/validation/verify/TEST');
assert.equal(client(origin).academyUrl('/api/media/test-file'),origin+'/api/media/test-file');
const html = readFileSync('index.html', 'utf8');
assert.match(html, /lang="pt-MZ"/);
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert(match[1].startsWith('/academia-digital-ins/'), match[1]);
  readFileSync(match[1].replace('/academia-digital-ins/', ''));
}
assert(readdirSync('assets').some(name => name.endsWith('.js')));
console.log('Pages client: sessions, reload, expiry, storage fallback, cookies, administrative entry, return path and asset paths passed.');
