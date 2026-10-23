import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('lib/academy-client.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;

function client(fetch) {
  const requests = [], timers = new Set();
  const context = {
    exports: {}, __ACADEMY_API_ORIGIN__: 'https://academy.test',
    Headers, AbortController, TypeError, crypto: webcrypto, URLSearchParams,
    location: {search: '?administracao=1'},
    localStorage: {getItem: () => null, setItem: () => {}},
    fetch: (url, init) => { requests.push({url, init}); return fetch(url, init); },
    setTimeout: (fn, ms) => { const id = setTimeout(fn, ms); timers.add(id); return id; },
    clearTimeout: id => { clearTimeout(id); timers.delete(id); },
  };
  vm.runInNewContext(code, context);
  return {...context.exports, requests, timers};
}

const good = client(async () => new Response('{"courses":[]}'));
assert.deepEqual(await good.academyReadJson('/api/academy'), {courses: []});
assert.equal(good.requests[0].url, 'https://academy.test/api/administration/academy');
assert.equal(good.requests[0].init.credentials, 'omit');
assert.match(good.requests[0].init.headers.get('Authorization'), /^Bearer [a-f0-9]{64}$/);
assert.equal(good.timers.size, 0, 'Successful reads release the deadline timer');

// A stalled connection or stalled response body must both finish with an error.
for (const fetch of [
  () => new Promise(() => {}),
  async () => ({ok: true, json: () => new Promise(() => {})}),
]) {
  const stalled = client(fetch);
  await assert.rejects(stalled.academyReadJson('/api/workspace', 15), /demorou a responder/);
  assert(stalled.requests[0].init.signal.aborted);
  assert.equal(stalled.requests.length, 1, 'No hidden automatic retry');
  assert.equal(stalled.timers.size, 0);
}

let available = false;
const recovery = client(async () => available ? new Response('{"ready":true}') : new Promise(() => {}));
await assert.rejects(recovery.academyReadJson('/api/academy', 15), /demorou/);
available = true;
assert.deepEqual(await recovery.academyReadJson('/api/academy'), {ready: true});
assert.equal(recovery.requests.length, 2, 'An explicit retry can recover');
assert(!recovery.requests[1].init.signal.aborted, 'Each read has an independent controller');

await assert.rejects(client(async () => {throw new TypeError('Network failed');}).academyReadJson('/api/academy'), /ligar ao servidor/);
await assert.rejects(client(async () => new Response('<html>Unavailable</html>')).academyReadJson('/api/academy'), /ler a resposta/);
await assert.rejects(client(async () => new Response('{"error":"Serviço indisponível"}', {status: 503})).academyReadJson('/api/academy'), /Serviço indisponível/);

const writes = client(async () => new Response('{}'));
await writes.academyFetch('/api/academy', {method: 'POST', body: '{"action":"course"}'});
assert.equal(writes.requests.length, 1);
assert.equal(writes.requests[0].init.method, 'POST');
assert.equal(writes.requests[0].init.body, '{"action":"course"}');
assert.equal(writes.requests[0].init.signal, undefined, 'Existing writes receive no new timeout');
console.log('Loading: response and body deadlines, timer cleanup, recovery, errors, existing credentials and write behaviour passed.');
