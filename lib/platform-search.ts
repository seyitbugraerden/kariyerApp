import { load } from 'cheerio/slim';
import {
  platforms,
  searchUrl,
  platformForUrl,
  isJobUrl,
  platformJobKey,
  type PlatformId,
  type PlatformResult,
} from './platforms';
import { normalizeText, inferLevel, canonicalJobUrl, cities } from './turkey';
import { extractSkills } from './matching';
import { department, type Job } from './jobs';
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
function work(value: string) {
  const s = normalizeText(value);
  return /hibrit|hybrid/.test(s)
    ? 'hybrid'
    : /uzaktan|remote/.test(s)
      ? 'remote'
      : /is yerinde|isyerinde|on.site/.test(s)
        ? 'onsite'
        : 'unknown';
}
function employment(value: string) {
  const s = normalizeText(value);
  return /tam zaman|full.time/.test(s)
    ? 'full_time'
    : /part.time|yari zaman/.test(s)
      ? 'part_time'
      : /staj|intern/.test(s)
        ? 'internship'
        : 'unknown';
}
export function parsePlatform(html: string, id: PlatformId): Job[] {
  const $ = load(html);
  const p = platforms.find((p) => p.id === id)!;
  const jobs: Job[] = [];
  function add(raw: {
    url: string;
    title: string;
    company?: string;
    location?: string;
    description?: string;
    date?: string;
    workplace?: string;
    job_type?: string;
  }) {
    let url: string;
    try {
      url = new URL(raw.url, 'https://' + p.host).href;
    } catch {
      return;
    }
    if (platformForUrl(url)?.id !== id || !isJobUrl(url) || !raw.title.trim())
      return;
    const location = clean(raw.location || '');
    const text = clean(raw.description || '');
    jobs.push({
      id: platformJobKey(url),
      url: canonicalJobUrl(url),
      title: clean(raw.title).slice(0, 220),
      company_name: clean(raw.company || 'Şirket belirtilmemiş'),
      candidate_required_location: location,
      country:
        id === 'linkedin' &&
        !/turk|türk|turki|türki/i.test(location) &&
        !cities.some((c) => normalizeText(location).includes(normalizeText(c)))
          ? ''
          : 'TR',
      description: text.slice(0, 1600),
      category: department(raw.title),
      source: p.name,
      tags: extractSkills(raw.title + ' ' + text),
      salary: '',
      publication_date:
        raw.date && !Number.isNaN(Date.parse(raw.date))
          ? new Date(raw.date).toISOString()
          : '',
      job_type: raw.job_type || 'unknown',
      workplace: raw.workplace || 'unknown',
      level: inferLevel(raw.title),
      summaryOnly: true,
    });
  }
  if (id === 'kariyer') {
    $('[data-test="ad-card-item"]').each((_, e) => {
      const c = $(e);
      add({
        url: c.attr('href') || '',
        title: c.find('[data-test="ad-card-title"]').text(),
        company: c.find('[data-test="subtitle"]').text(),
        location: c.find('[data-test="location"]').text(),
        workplace: work(c.find('[data-test="work-model"]').text()),
        job_type: employment(c.find('.footer-badges').text()),
      });
    });
  }
  if (id === 'linkedin') {
    $('.base-search-card').each((_, e) => {
      const c = $(e);
      add({
        url: c.find('a.base-card__full-link').attr('href') || '',
        title: c.find('.base-search-card__title').text(),
        company: c.find('.base-search-card__subtitle').text(),
        location: c.find('.job-search-card__location').text(),
        date: c.find('time').attr('datetime'),
      });
    });
  }
  if (id === 'isinolsun') {
    try {
      const data = JSON.parse($('#__NEXT_DATA__').text());
      const list = data?.props?.pageProps?.jobs;
      if (Array.isArray(list))
        for (const j of list) {
          if (j.isHiddenJob) continue;
          add({
            url: String(j.shareUrl || ''),
            title: String(j.positionName || ''),
            company: String(j.companyName || ''),
            location: String(
              j.shortAddress ||
                [j.townName, j.cityName].filter(Boolean).join(', '),
            ),
          });
        }
    } catch {}
  }
  if (id === 'eleman') {
    $('a[href*="/is-ilani/"]').each((_, e) => {
      const c = $(e);
      const heading = c.find('h3').first().clone();
      heading.children().remove();
      const subtitle = c.find('.c-showcase-box__subtitle').first();
      const company = subtitle.clone();
      company.children().remove();
      add({
        url: c.attr('href') || '',
        title: heading.text(),
        company: company.text().replace(/-\s*$/, ''),
        location: subtitle.find('.notranslate').text(),
        description: c.find('.c-showcase-box__text').last().text(),
      });
    });
  }
  // Structured postings, when a platform serves public JSON-LD instead of a challenge page.
  if (id === 'indeed' || id === 'yenibiris') {
    $('script[type="application/ld+json"]').each((_, e) => {
      try {
        const raw = JSON.parse($(e).text());
        const list = Array.isArray(raw) ? raw : raw['@graph'] || [raw];
        for (const j of list) {
          if (j['@type'] !== 'JobPosting') continue;
          const address = j.jobLocation?.address || {};
          add({
            url: j.url || j.mainEntityOfPage || '',
            title: j.title || '',
            company: j.hiringOrganization?.name,
            location: [address.addressLocality, address.addressRegion]
              .filter(Boolean)
              .join(', '),
            description: load(j.description || '').text(),
            date: j.datePosted,
            job_type: employment(j.employmentType || ''),
          });
        }
      } catch {}
    });
  }
  return [...new Map(jobs.map((j) => [j.id, j])).values()].slice(0, 40);
}
export async function fetchPublicPage(url: string, host: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    let current = url;
    for (let redirects = 0; redirects < 3; redirects++) {
      const r = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { Accept: 'text/html' },
      });
      if (r.status >= 300 && r.status < 400) {
        const next = new URL(r.headers.get('location') || '', current);
        if (
          next.protocol !== 'https:' ||
          !(next.hostname === host || next.hostname.endsWith('.' + host)) ||
          next.username ||
          next.password
        )
          throw Error('redirect');
        current = next.href;
        continue;
      }
      if ([401, 403, 429, 999].includes(r.status)) throw Error('blocked');
      if (!r.ok) throw Error('unavailable');
      if (!r.body) throw Error('unavailable');
      const reader = r.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 3_000_000) {
          await reader.cancel();
          throw Error('oversize');
        }
        chunks.push(value);
      }
      const b = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        b.set(chunk, offset);
        offset += chunk.length;
      }
      const html = new TextDecoder().decode(b);
      if (
        /<title[^>]*>[^<]*(?:security check|attention required|just a moment|captcha)/i.test(
          html,
        )
      )
        throw Error('blocked');
      return html;
    }
    throw Error('redirect');
  } finally {
    clearTimeout(timer);
  }
}
export function parseIndexResults(data: unknown, id: PlatformId): Job[] {
  const p = platforms.find((p) => p.id === id)!;
  const results =
    (
      data as {
        web?: {
          results?: {
            url: string;
            title: string;
            description?: string;
            extra_snippets?: string[];
          }[];
        };
      }
    )?.web?.results || [];
  return results
    .filter(
      (r) =>
        typeof r.url === 'string' &&
        platformForUrl(r.url)?.id === id &&
        isJobUrl(r.url),
    )
    .map((r) => {
      const description = clean(
        load(
          [r.description, ...(r.extra_snippets || [])]
            .filter(Boolean)
            .join(' '),
        ).text(),
      ).slice(0, 1600);
      return {
        id: platformJobKey(r.url),
        url: canonicalJobUrl(r.url),
        title: clean(load(r.title || 'İş ilanı').text()),
        company_name: 'Şirketi kaynakta kontrol et',
        description,
        source: p.name,
        category: 'Diğer',
        tags: extractSkills(description),
        salary: '',
        publication_date: '',
        candidate_required_location: 'Konum doğrulanmadı',
        country: '',
        workplace: 'unknown',
        job_type: 'unknown',
        level: inferLevel(r.title || ''),
        summaryOnly: true,
        indexResult: true,
      };
    });
}
async function indexed(id: PlatformId, q: string, city: string, key: string) {
  const p = platforms.find((p) => p.id === id)!;
  const u = new URL('https://api.search.brave.com/res/v1/web/search');
  u.searchParams.set(
    'q',
    `site:${p.host} ${q} ${city === 'TR' || !city ? 'Türkiye' : city} iş ilanı`,
  );
  u.searchParams.set('country', 'TR');
  u.searchParams.set('count', '20');
  u.searchParams.set('extra_snippets', 'true');
  const r = await fetch(u, {
    headers: { 'X-Subscription-Token': key, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw Error('index_unavailable');
  return parseIndexResults(await r.json(), id);
}
type SearchOutput = { jobs: Job[]; source: PlatformResult };
const cache = new Map<string, { at: number; value: SearchOutput }>();
const pending = new Map<string, Promise<SearchOutput>>();
export async function searchPlatform(
  id: PlatformId,
  q: string,
  city: string,
  key?: string,
): Promise<SearchOutput> {
  const cacheKey = JSON.stringify([id, q, city, Boolean(key)]);
  const cached = cache.get(cacheKey);
  if (
    cached &&
    Date.now() - cached.at <
      (['blocked', 'error'].includes(cached.value.source.status)
        ? 60000
        : 900000)
  )
    return cached.value;
  if (pending.has(cacheKey)) return pending.get(cacheKey)!;
  const p = platforms.find((p) => p.id === id)!;
  const url = searchUrl(id, q, city);
  const result = (async () => {
    let status: PlatformResult['status'] = 'error',
      message = 'Kaynak şu anda okunamıyor.';
    try {
      const html = await fetchPublicPage(url, p.host);
      const jobs = parsePlatform(html, id).filter(
        (j) =>
          id !== 'yenibiris' ||
          normalizeText(j.title + ' ' + j.description).includes(
            normalizeText(q),
          ),
      );
      if (jobs.length)
        return {
          jobs,
          source: {
            id,
            name: p.name,
            status: 'ok' as const,
            count: jobs.length,
            message: 'İlk sonuç sayfası okundu; tam ilan metni kaynaktadır.',
            searchUrl: url,
          },
        };
      const text = normalizeText(load(html).text());
      if (
        /sonuc bulunamadi|ilan bulunamadi|no matching jobs|no results/.test(
          text,
        )
      ) {
        status = 'empty';
        message = 'Bu arama için sonuç bulunamadı.';
      } else {
        status = 'blocked';
        message =
          'İlan listesi okunamadı; giriş veya ek arama bağlantısı gerekebilir.';
      }
    } catch (e) {
      status =
        e instanceof Error && e.message === 'blocked' ? 'blocked' : 'error';
      message =
        status === 'blocked'
          ? 'Kaynak otomatik erişimi engelledi.'
          : 'Kaynağa ulaşılamadı; daha sonra yeniden dene.';
    }
    if (key && status !== 'empty') {
      try {
        const jobs = await indexed(id, q, city, key);
        return {
          jobs,
          source: {
            id,
            name: p.name,
            status: jobs.length ? ('index' as const) : ('empty' as const),
            count: jobs.length,
            message:
              'Arama dizini özeti; ilan güncelliği ve konumu doğrulanmadı.',
            searchUrl: url,
          },
        };
      } catch {
        message += ' Ek arama servisi de yanıt vermedi.';
      }
    }
    return {
      jobs: [],
      source: { id, name: p.name, status, count: 0, message, searchUrl: url },
    };
  })();
  pending.set(cacheKey, result);
  try {
    const value = await result;
    if (cache.size >= 48) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { at: Date.now(), value });
    return value;
  } finally {
    pending.delete(cacheKey);
  }
}
