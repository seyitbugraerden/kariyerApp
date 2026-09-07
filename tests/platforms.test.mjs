import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({
  resolve(s, c, next) {
    if (s.startsWith('@/'))
      return next(new URL('../' + s.slice(2) + '.ts', import.meta.url).href, c);
    try {
      return next(s, c);
    } catch (e) {
      if (e.code === 'ERR_MODULE_NOT_FOUND' && s.startsWith('.'))
        return next(s + '.ts', c);
      throw e;
    }
  },
});
const { parsePlatform, parseIndexResults, searchPlatform, fetchPublicPage } =
  await import('../lib/platform-search.ts');
const { platformJobKey, isJobUrl, platformForUrl, searchUrl } =
  await import('../lib/platforms.ts');
const k =
  '<a href="/is-ilani/test-muhasebe-123" data-test="ad-card-item"><span data-test="ad-card-title">Muhasebe Uzmanı</span><span data-test="subtitle">Test Şirketi</span><span data-test="location">İstanbul</span><span data-test="work-model">Hibrit</span><div class="footer-badges">Tam zamanlı</div></a>';
const jobs = parsePlatform(k + k, 'kariyer');
assert.equal(jobs.length, 1);
assert.equal(jobs[0].id, 'platform:kariyer:123');
assert.equal(jobs[0].workplace, 'hybrid');
assert.equal(jobs[0].job_type, 'full_time');
assert.equal(jobs[0].summaryOnly, true);
assert.equal(jobs[0].publication_date, '');
const i =
  '<script id="__NEXT_DATA__" type="application/json">' +
  JSON.stringify({
    props: {
      pageProps: {
        jobs: [
          {
            shareUrl: 'https://isinolsun.com/is-ilani/test-0iojABC123',
            positionName: 'Muhasebe',
            companyName: 'Test',
            shortAddress: 'İzmir',
          },
          { shareUrl: 'https://evil.example/job', positionName: 'Reject' },
        ],
      },
    },
  }) +
  '</script>';
assert.equal(parsePlatform(i, 'isinolsun').length, 1);
assert.equal(parsePlatform('<script>alert(1)</script>', 'isinolsun').length, 0);
const l =
  '<div class="base-search-card"><a class="base-card__full-link" href="https://tr.linkedin.com/jobs/view/test-1234?trackingId=a"></a><h3 class="base-search-card__title">Developer</h3><h4 class="base-search-card__subtitle">Test</h4><span class="job-search-card__location">Istanbul, Türkiye</span><time datetime="2026-09-01"></time></div>';
assert.equal(parsePlatform(l, 'linkedin')[0].country, 'TR');
assert.equal(
  platformJobKey('https://www.linkedin.com/jobs/view/1234'),
  'platform:linkedin:1234',
);
assert.equal(
  platformJobKey('https://tr.linkedin.com/jobs/view/test-1234?trackingId=a'),
  'platform:linkedin:1234',
);
assert.equal(platformForUrl('https://kariyer.net.evil.example/job'), null);
assert.equal(isJobUrl('https://www.kariyer.net/is-ilanlari'), false);
assert.equal(isJobUrl('https://tr.indeed.com/viewjob?jk=abcd'), true);
assert.equal(isJobUrl('https://www.linkedin.com/in/person'), false);
assert.equal(
  new URL(searchUrl('eleman', 'C++ & SQL', 'TR')).searchParams.get('aranan'),
  'C++ & SQL',
);
assert.equal(
  parseIndexResults(
    {
      web: {
        results: [
          {
            url: 'https://tr.indeed.com/viewjob?jk=test',
            title: 'Muhasebe',
            description: '<b>Excel</b>',
          },
          { url: 'https://evil.example/jobs', title: 'bad' },
        ],
      },
    },
    'indeed',
  ).length,
  1,
);
let requests = 0;
globalThis.fetch = async () => {
  requests++;
  return new Response('', { status: 403 });
};
const blocked = await searchPlatform('indeed', 'unique-test', 'TR');
assert.equal(blocked.source.status, 'blocked');
assert.equal(blocked.jobs.length, 0);
await searchPlatform('indeed', 'unique-test', 'TR');
assert.equal(requests, 1);
globalThis.fetch = async (url) =>
  String(url).includes('api.search.brave.com')
    ? Response.json({
        web: {
          results: [
            {
              url: 'https://tr.indeed.com/viewjob?jk=test',
              title: 'Muhasebe',
              description: 'Excel',
            },
          ],
        },
      })
    : new Response('', { status: 403 });
const fallback = await searchPlatform('indeed', 'index-test', 'TR', 'test-key');
assert.equal(fallback.source.status, 'index');
assert.equal(fallback.jobs[0].indexResult, true);
assert.equal(fallback.jobs[0].country, '');
globalThis.fetch = async () =>
  new Response('', {
    status: 302,
    headers: { location: 'http://127.0.0.1/private' },
  });
await assert.rejects(
  fetchPublicPage('https://www.kariyer.net/is-ilanlari', 'kariyer.net'),
  /redirect/,
);
const { POST } = await import('../app/api/platform-search/route.ts');
const invalid = await POST(
  new Request('https://example.test/api/platform-search', {
    method: 'POST',
    body: JSON.stringify({ query: 'test', city: 'TR', sources: ['evil'] }),
  }),
);
assert.equal(invalid.status, 400);
const crossOrigin = await POST(
  new Request('https://example.test/api/platform-search', {
    method: 'POST',
    headers: { Origin: 'https://evil.example' },
    body: '{}',
  }),
);
assert.equal(crossOrigin.status, 403);
console.log(
  'PASS: platform card parsing, source IDs/deduplication, safe URLs, summary metadata, blocked-source status/cache, optional search-index fallback and endpoint validation.',
);
