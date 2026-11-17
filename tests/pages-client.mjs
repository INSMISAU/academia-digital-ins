import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('lib/academy-client.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
const store = new Map();
const localStorage = {getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value),removeItem:key=>store.delete(key)};
let clock = Date.now();
const requests = [];
let responseStatus = 200;
function client(origin, storage = localStorage, search = '') {
  const context = {exports: {}, __ACADEMY_API_ORIGIN__: origin, Headers, crypto: webcrypto,
    Date: {now: () => clock}, localStorage: storage, sessionStorage: storage, location: {search}, URLSearchParams, AbortController, setTimeout, clearTimeout,
    fetch: (url, init) => { requests.push({url, init}); return Promise.resolve(new Response('{}',{status:responseStatus})); },
  };
  vm.runInNewContext(code, context);
  return context.exports;
}
const origin = 'https://ins-academia-digital.perciliamuianga.chatgpt.site';
assert.equal(client(origin).academyAdministrationUrl(false),'?administracao=1#painel');
assert.equal(client('').academyAdministrationUrl(false),'?administracao=1#painel');
assert.equal(client('').academyAdministrationUrl(true),'?administracao=1#painel');
// Keep the private capability on its original origin; no email collection or sign-in redirect.
const hostedAdministration = new URL(client('').academyAdministrationUrl(false),origin);
assert.equal(hostedAdministration.origin, origin);
assert.equal(hostedAdministration.searchParams.get('administracao'), '1');
assert.equal(hostedAdministration.hash, '#painel');
assert(!/signin/.test(hostedAdministration.href));
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
assert.equal(testClient.academyAdministration(),false);
assert.equal(client(origin,localStorage,'?administracao=1').academyAdministration(),true);
await testClient.academyFetch('/api/academy?course=orientacao');
assert.equal(requests.at(-1).url,origin+'/api/validation/academy?course=orientacao');
assert.equal(testClient.academyUrl('/api/media/test-file'),origin+'/api/validation/media/test-file');
assert.equal(testClient.academyUrl('/verify/TEST'),origin+'/verify/TEST');
assert.equal(client(origin).academyUrl('/api/media/test-file'),origin+'/api/media/test-file');
const priv=client(origin,localStorage,'?validacao=1&perfil=participante');
priv.setTeamAccess('f'.repeat(64));
await priv.academyFetch('/api/registration');
assert.equal(requests.at(-1).init.headers.get('X-Academy-Team'),'f'.repeat(64));
assert.equal(requests.at(-1).init.headers.get('X-Academy-Mode'),'participant');
assert.equal(priv.hasTeamAccess(),true);
responseStatus=401;
await assert.rejects(priv.academyReadJson('/api/team-access'),error=>error.status===401,'The access screen must distinguish missing credentials from service failures');
responseStatus=503;
await assert.rejects(priv.academyReadJson('/api/team-access'),error=>error.status===503);
responseStatus=200;
priv.setTeamAccess('  https://insmisau.github.io/academia-digital-ins/?administracao=1#ologakey='+ 'e'.repeat(64)+'  ');
await priv.academyFetch('/api/registration');
assert.equal(requests.at(-1).init.headers.get('X-Academy-Team'),'e'.repeat(64),'Existing private links can reopen the technical session');
assert.throws(()=>priv.setTeamAccess('invalid'));
assert.equal(priv.academyAdministrationUrl(),'?validacao=1#painel','Validation navigation stays on validation data');
assert.equal(client(origin,localStorage,'?gestao=1').academyAdministrationUrl(),'?gestao=1#gestao');
assert.equal(client(origin,localStorage,'?validacao=1&perfil=participante&gestao=1').academyAdministrationUrl(),'?validacao=1&perfil=participante&gestao=1#gestao');
const savedBrowserSession=store.get('ins-academia-demo-session-v1');
priv.beginParticipant();assert.equal(store.get('ins-academia-demo-session-v1'),savedBrowserSession);
await client(origin).academyFetch('/api/academy');
assert.equal(requests.at(-1).init.headers.has('X-Academy-Team'),false);
const administrator=client(origin,localStorage,'?administracao=1');
administrator.setAdministrationSession('a0ce5510ade0'+'1'.repeat(52),clock+8*3600000);
assert.equal(store.has('ins-ologatecnica-access-v1'),false);
await administrator.academyFetch('/api/academy');
assert.equal(requests.at(-1).url,origin+'/api/administration/academy');
assert.equal(requests.at(-1).init.headers.get('X-Academy-Team'),'a0ce5510ade0'+'1'.repeat(52));
assert.equal(administrator.academyUrl('/api/administration-session'),origin+'/api/administration-session');
administrator.setParticipantSession('a0ce5510ade0'+'1'.repeat(52));
await administrator.academyFetch('/api/account');
assert.equal(requests.at(-1).init.headers.get('Authorization'),'Bearer '+'a0ce5510ade0'+'1'.repeat(52),'The administrator can see the profile of their own account');
clock+=9*3600000;await administrator.academyFetch('/api/academy');
assert.equal(requests.at(-1).init.headers.has('X-Academy-Team'),false,'Expired administrator sessions do not reopen old private capabilities');
const html = readFileSync('index.html', 'utf8');
assert.match(html, /lang="pt-MZ"/);
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert(match[1].startsWith('/academia-digital-ins/'), match[1]);
  readFileSync(match[1].replace('/academia-digital-ins/', ''));
}
assert(readdirSync('assets').some(name => name.endsWith('.js')));
console.log('Pages client: sessions, reload, expiry, storage fallback, cookies, administrative entry, return path and asset paths passed.');
