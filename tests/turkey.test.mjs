import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/'))
      return next(
        new URL('../' + specifier.slice(2) + '.ts', import.meta.url).href,
        context,
      );
    try {
      return next(specifier, context);
    } catch (e) {
      if (e.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.'))
        return next(specifier + '.ts', context);
      throw e;
    }
  },
});
const { cities, normalizeText, portalForUrl, canonicalJobUrl, inferLevel } =
  await import('../lib/turkey.ts');
const { containsSkill, extractSkills } = await import('../lib/matching.ts');
const { normalizeLever, normalizeRemotive, matchesLocation, boards } =
  await import('../lib/jobs.ts');
assert.equal(cities.length, 81);
assert.equal(new Set(cities).size, 81);
assert.equal(
  normalizeText('İSTANBUL IĞDIR ŞANLIURFA'),
  'istanbul igdir sanliurfa',
);
assert(containsSkill('Accounting and data analysis experience', 'Muhasebe'));
assert(containsSkill('SATIŞ VE İNSAN KAYNAKLARI', 'Sales'));
assert(containsSkill('SATIŞ VE İNSAN KAYNAKLARI', 'Human Resources'));
assert(!containsSkill('Building JavaScript applications', 'UI'));
assert(!containsSkill('JavaScript', 'Java'));
assert(containsSkill('C++ and NodeJS', 'Node.js'));
assert.deepEqual(extractSkills('Muhasebe, accounting, Excel, MS Excel'), [
  'Muhasebe',
  'Excel',
]);
assert.equal(inferLevel('Software Engineer (New Grad)'), 'junior');
assert.equal(inferLevel('Senior Software Engineer'), 'senior');
assert.equal(inferLevel('International Sales Specialist'), 'unknown');
assert.equal(
  portalForUrl('https://www.kariyer.net/is-ilani/test').name,
  'Kariyer.net',
);
assert.equal(portalForUrl('https://kariyer.net.evil.example/job'), null);
assert.equal(portalForUrl('javascript:alert(1)'), null);
assert.equal(portalForUrl('https://user:password@kariyer.net/job'), null);
assert.equal(
  canonicalJobUrl('https://esube.iskur.gov.tr/job?id=123&utm_source=abc#top'),
  'https://esube.iskur.gov.tr/job?id=123',
);
const raw = {
  id: 'test',
  text: 'Software Engineer (New Grad)',
  hostedUrl: 'https://jobs.lever.co/dreamgames/test',
  country: 'TR',
  categories: {
    location: 'Istanbul',
    team: 'Engineering',
    commitment: 'Full-time',
  },
  workplaceType: 'onsite',
  descriptionPlain: 'Software development',
  lists: [{ text: 'Requirements', content: '<li>SQL and Python</li>' }],
  createdAt: 1760000000000,
};
const job = normalizeLever(raw, boards[2]);
assert(job);
assert.equal(job.country, 'TR');
assert.equal(job.workplace, 'onsite');
assert.equal(job.level, 'junior');
assert(job.description.includes('SQL and Python'));
assert(matchesLocation(job, 'İstanbul'));
assert(!matchesLocation(job, 'Ankara'));
assert.equal(job.salary, '');
assert.equal(
  normalizeLever(
    { ...raw, country: 'GB', categories: { location: 'London' } },
    boards[2],
  ),
  null,
);
assert.equal(
  normalizeLever(
    { ...raw, country: undefined, categories: { location: 'Vancouver' } },
    boards[2],
  ),
  null,
);
assert.equal(
  normalizeLever(
    { ...raw, hostedUrl: 'https://jobs.lever.co.evil.example/x' },
    boards[2],
  ),
  null,
);
const remote = normalizeRemotive({
  id: 12,
  title: 'Developer',
  url: 'https://remotive.com/remote-jobs/test',
  candidate_required_location: 'Worldwide',
});
assert(remote);
assert.equal(remote.id, 12);
assert(!matchesLocation(remote, 'TR'));
assert(matchesLocation(remote, 'worldwide'));
const calls = new Map();
globalThis.fetch = async (url) => {
  calls.set(url, (calls.get(url) || 0) + 1);
  if (url.includes('insiderone')) return new Response('', { status: 503 });
  if (url.includes('dreamgames')) return Response.json([raw]);
  if (url.includes('trendyol')) return Response.json([]);
  return Response.json({
    jobs: [
      {
        id: 12,
        title: 'Developer',
        url: 'https://remotive.com/remote-jobs/test',
      },
    ],
  });
};
const { GET } = await import('../app/api/jobs/route.ts');
const response = await GET();
assert.equal(response.status, 200);
assert.equal(response.headers.get('Cache-Control'), 'no-store');
const result = await response.json();
assert.equal(result.jobs.length, 2);
assert.equal(
  result.sources.find((s) => s.name === 'Insider One kariyer').status,
  'error',
);
assert.equal(
  result.sources.find((s) => s.name === 'Dream Games kariyer').count,
  1,
);
await GET();
assert.equal(calls.get('https://remotive.com/api/remote-jobs'), 1);
assert.equal(
  calls.get('https://api.lever.co/v0/postings/insiderone?mode=json'),
  2,
);
console.log(
  'PASS: 81 cities, Turkish normalization, bilingual CV matching, word boundaries, source normalization, location/level filters, safe portal URLs, legacy numeric IDs, partial failure and source caching.',
);
