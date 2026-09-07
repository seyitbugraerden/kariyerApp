import { canonicalJobUrl } from './turkey';
export const platforms = [
  { id: 'linkedin', name: 'LinkedIn', host: 'linkedin.com' },
  { id: 'indeed', name: 'Indeed', host: 'indeed.com' },
  { id: 'kariyer', name: 'Kariyer.net', host: 'kariyer.net' },
  { id: 'isinolsun', name: 'İşin Olsun', host: 'isinolsun.com' },
  { id: 'yenibiris', name: 'Yenibiriş', host: 'yenibiris.com' },
  { id: 'eleman', name: 'Eleman.net', host: 'eleman.net' },
] as const;
export type PlatformId = (typeof platforms)[number]['id'];
export type PlatformResult = {
  id: PlatformId;
  name: string;
  status: 'ok' | 'blocked' | 'error' | 'empty' | 'index';
  count: number;
  message: string;
  searchUrl: string;
};
export function searchUrl(id: PlatformId, q: string, city: string) {
  let u: URL;
  switch (id) {
    case 'linkedin':
      u = new URL('https://www.linkedin.com/jobs/search/');
      u.searchParams.set('keywords', q);
      u.searchParams.set(
        'location',
        city === 'TR' || !city ? 'Türkiye' : city + ', Türkiye',
      );
      break;
    case 'indeed':
      u = new URL('https://tr.indeed.com/jobs');
      u.searchParams.set('q', q);
      u.searchParams.set('l', city === 'TR' ? 'Türkiye' : city);
      break;
    case 'kariyer':
      u = new URL('https://www.kariyer.net/is-ilanlari');
      u.searchParams.set('kw', q);
      break;
    case 'isinolsun':
      u = new URL('https://isinolsun.com/is-ilanlari');
      u.searchParams.set('kw', q);
      break;
    case 'eleman':
      u = new URL('https://www.eleman.net/is-ilanlari');
      u.searchParams.set('aranan', q);
      u.searchParams.set('arandi', 'e');
      break;
    case 'yenibiris':
      u = new URL('https://www.yenibiris.com/is-ilanlari');
      break;
  }
  return u.href;
}
export function platformForUrl(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port)
      return null;
    return (
      platforms.find(
        (p) => u.hostname === p.host || u.hostname.endsWith('.' + p.host),
      ) || null
    );
  } catch {
    return null;
  }
}
export function isJobUrl(value: string) {
  const p = platformForUrl(value);
  if (!p) return false;
  const u = new URL(value);
  return p.id === 'linkedin'
    ? /\/jobs\/view\/[^/]+/.test(u.pathname)
    : p.id === 'indeed'
      ? /\/(?:viewjob|rc\/clk)/.test(u.pathname) && u.searchParams.has('jk')
      : /\/is-ilani\/[^/]+/.test(u.pathname);
}
export function platformJobKey(value: string) {
  const p = platformForUrl(value);
  const u = new URL(value);
  let id: string | undefined;
  if (p?.id === 'linkedin')
    id = u.pathname.match(/\/jobs\/view\/(?:.*-)?(\d+)\/?$/)?.[1];
  if (p?.id === 'indeed') id = u.searchParams.get('jk') || undefined;
  if (p?.id === 'kariyer') id = u.pathname.match(/-(\d+)\/?$/)?.[1];
  if (p?.id === 'isinolsun')
    id = u.pathname.match(/-0ioj([a-z0-9]+)\/?$/i)?.[1]?.toUpperCase();
  if (p?.id === 'eleman') id = u.pathname.match(/-i(\d+)\/?$/)?.[1];
  return id ? `platform:${p!.id}:${id}` : 'platform:' + canonicalJobUrl(value);
}
