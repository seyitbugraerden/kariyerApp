import { platforms, type PlatformId } from '@/lib/platforms';
import { searchPlatform } from '@/lib/platform-search';
import { cities } from '@/lib/turkey';
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length')) > 4096)
    return Response.json({ error: 'Arama isteği çok uzun.' }, { status: 413 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 4096)
      return Response.json(
        { error: 'Arama isteği çok uzun.' },
        { status: 413 },
      );
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: 'Geçersiz arama isteği.' }, { status: 400 });
  }
  const b = body as { query?: unknown; city?: unknown; sources?: unknown };
  if (
    !b ||
    typeof b.query !== 'string' ||
    b.query.trim().length < 2 ||
    b.query.length > 120 ||
    typeof b.city !== 'string' ||
    (!['', 'TR', 'worldwide'].includes(b.city) && !cities.includes(b.city)) ||
    !Array.isArray(b.sources) ||
    !b.sources.length ||
    b.sources.length > 6 ||
    b.sources.some((id) => !platforms.some((p) => p.id === id))
  )
    return Response.json(
      { error: 'Pozisyonu, ili ve en az bir platformu seç.' },
      { status: 400 },
    );
  const ids = [...new Set(b.sources)] as PlatformId[];
  const key = process.env.BRAVE_SEARCH_API_KEY;
  const results = await Promise.all(
    ids.map((id) =>
      searchPlatform(id, b.query as string, b.city as string, key),
    ),
  );
  return Response.json(
    {
      jobs: results.flatMap((r) => r.jobs),
      sources: results.map((r) => r.source),
      query: b.query,
      city: b.city,
      indexConnected: Boolean(key),
      searchedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
