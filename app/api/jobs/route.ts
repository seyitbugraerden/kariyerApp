let memory: { jobs: unknown[]; time: number } | null = null;
export async function GET() {
  try {
    if (memory && Date.now() - memory.time < 21600000)
      return Response.json(memory, {
        headers: { 'Cache-Control': 'public, max-age=21600' },
      });
    const r = await fetch('https://remotive.com/api/remote-jobs', {
      signal: AbortSignal.timeout(20000),
      ...{ cf: { cacheTtl: 21600, cacheEverything: true } },
    });
    if (!r.ok) throw Error('Source unavailable');
    const d = (await r.json()) as { jobs: Record<string, unknown>[] };
    if (!Array.isArray(d.jobs)) throw Error('Invalid response');
    const jobs = d.jobs
      .filter(
        (j) =>
          typeof j.id === 'number' &&
          typeof j.url === 'string' &&
          j.url.startsWith('https://remotive.com/'),
      )
      .map((j) => ({
        ...j,
        tags: Array.isArray(j.tags)
          ? j.tags.filter((t) => typeof t === 'string')
          : [],
        description: String(j.description || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .slice(0, 30000),
      }));
    memory = { jobs, time: Date.now() };
    return Response.json(memory, {
      headers: { 'Cache-Control': 'public, max-age=21600' },
    });
  } catch {
    return Response.json(
      { error: 'İlan kaynağına ulaşılamadı.' },
      { status: 502 },
    );
  }
}
