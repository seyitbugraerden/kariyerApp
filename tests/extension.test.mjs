import './platforms.test.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const { browserJobs } = await import('../lib/browser-jobs.ts');
const sample = { url: 'https://www.linkedin.com/jobs/view/1234', title: 'Muhasebe Uzmanı', candidate_required_location: 'İstanbul, Türkiye', description: 'Excel' };
assert.equal(browserJobs([sample])[0].country, 'TR');
assert.equal(browserJobs([sample, sample]).length, 1);
assert.equal(browserJobs([sample], 'indeed').length, 0);
assert.equal(browserJobs([{ ...sample, url: 'javascript:alert(1)' }]).length, 0);
assert.equal(browserJobs([{ ...sample, url: 'https://linkedin.com.evil.example/jobs/view/1234' }]).length, 0);
assert.equal(browserJobs([{ ...sample, title: '<script>x</script>' }])[0].title, 'x');
let handler, removed, saved = {}, tabNumber = 10;
const opened = [], delivered = [];
const chrome = {
  storage: { session: { get: async () => structuredClone(saved), set: async s => { saved = structuredClone(s); }, remove: async () => { saved = {}; } } },
  tabs: { create: async t => { opened.push(t); return { id: ++tabNumber }; }, sendMessage: async (id, m) => delivered.push({ id, m }), onRemoved: { addListener: fn => { removed = fn; } } },
  runtime: { onMessage: { addListener: fn => { handler = fn; } } }
};
vm.runInNewContext(await readFile('outputs/pusula-extension/background.js', 'utf8'), { chrome, URL, console, setTimeout, clearTimeout, TextDecoder, AbortController, AbortSignal });
const send = (m, sender) => new Promise(resolve => handler(m, sender, resolve));
const app = { url: 'https://pusula-is-arama.zeynepaktaserden.chatgpt.site/', tab: { id: 1 } };
const start = { action: 'START', requestId: 'test', query: 'muhasebe', city: 'TR', sources: ['linkedin', 'indeed'] };
assert.equal((await send(start, { url: 'https://evil.example', tab: { id: 2 } })).type, undefined);
assert.equal(opened.length, 0);
assert.equal((await send(start, app)).type, 'STARTED');
assert.equal(opened.length, 2);
assert.equal(new URL(opened[0].url).searchParams.get('keywords'), 'muhasebe');
const li = { url: opened[0].url, tab: { id: 11 } };
assert.equal((await send({ action: 'TASK' }, li)).requestId, 'test');
assert.equal((await send({ action: 'TASK' }, { ...li, tab: { id: 999 } })).requestId, undefined);
await send({ action: 'CAPTURE', requestId: 'stale', jobs: [sample] }, li);
assert.equal(delivered.length, 0);
await Promise.all([
  send({ action: 'CAPTURE', requestId: 'test', jobs: [sample] }, li),
  send({ action: 'CAPTURE', requestId: 'test', jobs: [{ ...sample, url: 'https://tr.indeed.com/viewjob?jk=abc' }] }, { url: opened[1].url, tab: { id: 12 } })
]);
assert.equal(delivered.at(-1).m.jobs.length, 2);
assert.equal(delivered.at(-1).m.finished, true);
await send({ action: 'CANCEL', requestId: 'test' }, app);
assert.equal(saved.search, undefined);
await send({ action: 'CAPTURE', requestId: 'test', jobs: [sample] }, li);
assert.equal(delivered.length, 2);
const manifest = JSON.parse(await readFile('outputs/pusula-extension/manifest.json', 'utf8'));
assert.deepEqual(manifest.permissions, ['storage']);
assert.equal(manifest.content_scripts.some(s => s.matches.includes('<all_urls>')), false);
console.log('PASS: extension URL/input validation, exact app origin, tab ownership, stale request rejection, concurrent results, cancellation, limited permissions.');
// Execute the actual browser bundle without Node globals against a representative source page.
let capture;
const captured = new Promise(resolve => { capture = resolve; });
vm.runInNewContext(await readFile('outputs/pusula-extension/reader.js', 'utf8'), {
  URL, console, TextDecoder, setTimeout: fn => { fn(); }, clearTimeout,
  document: { querySelector: () => ({ textContent: JSON.stringify({ props: { pageProps: { jobs: [
    { shareUrl: 'https://isinolsun.com/is-ilani/test-0iojABC123', positionName: 'Muhasebe Uzmanı', companyName: 'Test Şirketi', shortAddress: 'İstanbul' },
    { shareUrl: 'https://isinolsun.com/is-ilani/test-0iojDEF456', positionName: 'Gizli', isHiddenJob: true }
  ] } } }) }), querySelectorAll: () => [] },
  chrome: { runtime: { onMessage: { addListener: () => {} }, sendMessage: async m => {
    if (m.action === 'TASK') return { requestId: 'reader-test', id: 'isinolsun' };
    if (m.action === 'CAPTURE') { capture(m); return {}; }
  } } }
});
const readerResult = await Promise.race([captured, new Promise((_, reject) => setTimeout(() => reject(Error('Reader bundle did not return jobs')), 3000))]);
assert.equal(readerResult.jobs.length, 1);
assert.equal(readerResult.jobs[0].title, 'Muhasebe Uzmanı');
assert.equal(readerResult.jobs[0].country, 'TR');
assert.equal('html' in readerResult, false);
console.log('PASS: real bundled reader runs without Node globals and transfers only parsed job data.');
