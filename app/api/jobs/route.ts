import {
  boards,
  normalizeLever,
  normalizeRemotive,
  type Job,
  type SourceStatus,
} from '@/lib/jobs';
const cache = new Map<string, { jobs: Job[]; time: number }>();
const pending = new Map<string, Promise<Job[]>>();
async function source(
  key: string,
  url: string,
  normalize: (raw: never) => Job | null,
): Promise<Job[]> {
  const previous = cache.get(key);
  if (previous && Date.now() - previous.time < 21600000) return previous.jobs;
  const active = pending.get(key);
  if (active) return active;
  const task = (async () => {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      ...{ cf: { cacheTtl: 21600, cacheEverything: true } },
    });
    if (!r.ok) throw Error('Source unavailable');
    const data = (await r.json()) as unknown;
    const list =
      key === 'remotive' ? (data as { jobs: unknown[] })?.jobs : data;
    if (!Array.isArray(list)) throw Error('Invalid source');
    const jobs = list
      .map((raw) => normalize(raw as never))
      .filter((j): j is Job => Boolean(j));
    cache.set(key, { jobs, time: Date.now() });
    return jobs;
  })();
  pending.set(key, task);
  try {
    return await task;
  } finally {
    pending.delete(key);
  }
}
export async function GET() {
  const feeds = [
    ...boards.map((board) => ({
      key: board.id,
      name: board.name + ' kariyer',
      url: `https://api.lever.co/v0/postings/${board.id}?mode=json`,
      normalize: (raw: never) => normalizeLever(raw, board),
    })),
    {
      key: 'remotive',
      name: 'Remotive',
      url: 'https://remotive.com/api/remote-jobs',
      normalize: normalizeRemotive,
    },
  ];
  const results = await Promise.allSettled(
    feeds.map((f) => source(f.key, f.url, f.normalize)),
  );
  const jobs: Job[] = [];
  const sources: SourceStatus[] = results.map((r, i) => {
    if (r.status === 'fulfilled') {
      jobs.push(...r.value);
      return { name: feeds[i].name, status: 'ok', count: r.value.length };
    }
    return { name: feeds[i].name, status: 'error', count: 0 };
  });
  const allFailed = sources.every((s) => s.status === 'error');
  return Response.json(
    {
      jobs,
      sources,
      time: Date.now(),
      ...(allFailed ? { error: 'İlan kaynaklarına ulaşılamadı.' } : {}),
    },
    {
      status: allFailed ? 502 : 200,
      headers: {
        'Cache-Control': sources.some((s) => s.status === 'error')
          ? 'no-store'
          : 'public, max-age=900',
      },
    },
  );
}
