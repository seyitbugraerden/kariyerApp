import { cities, normalizeText, inferLevel } from './turkey';
import { extractSkills } from './matching';
export type JobId = number | string;
export type Job = {
  id: JobId;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  candidate_required_location: string;
  salary: string;
  publication_date: string;
  url: string;
  description: string;
  job_type: string;
  source: string;
  country: string;
  workplace: string;
  level: string;
  manual?: boolean;
};
export const boards = [
  { id: 'trendyol', name: 'Trendyol' },
  { id: 'insiderone', name: 'Insider One' },
  { id: 'dreamgames', name: 'Dream Games' },
];
export type SourceStatus = {
  name: string;
  status: 'ok' | 'error';
  count: number;
};
export function plainText(value: unknown) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24000);
}
export function department(text: string) {
  const t = normalizeText(text);
  const pairs = [
    ['İnsan Kaynakları', 'people|human resources|recruit|talent'],
    ['Finans ve Muhasebe', 'financ|accounting|muhasebe'],
    [
      'Lojistik ve Operasyon',
      'logistic|operat|warehouse|supply|fulfil|express|depo|dagitim',
    ],
    [
      'Satış ve İş Geliştirme',
      'sales|business development|satis|commercial|category',
    ],
    ['Pazarlama', 'marketing|pazarlama|growth|brand'],
    ['Tasarım', 'art|design|tasarim|animation'],
    ['Ürün Yönetimi', 'product|urun'],
    ['Müşteri Hizmetleri', 'customer|support|musteri'],
    [
      'Yazılım ve Veri',
      'engineering|software|data|technology|security|yazilim|bilgi|^it$',
    ],
  ];
  return (
    pairs.find(([, pattern]) => new RegExp(pattern).test(t))?.[0] || 'Diğer'
  );
}
function safeUrl(value: unknown, host: string) {
  try {
    const u = new URL(String(value));
    return u.protocol === 'https:' &&
      u.hostname === host &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
type Posting = {
  id?: unknown;
  text?: unknown;
  country?: string;
  workplaceType?: string;
  createdAt?: number;
  hostedUrl?: string;
  descriptionBodyPlain?: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  categories?: {
    location?: string;
    allLocations?: string[];
    commitment?: string;
    team?: string;
    department?: string;
  };
  lists?: { text?: string; content?: string }[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  };
};
export function normalizeLever(
  raw: Posting,
  board: (typeof boards)[number],
): Job | null {
  if (typeof raw.id !== 'string' || typeof raw.text !== 'string') return null;
  const url = safeUrl(raw.hostedUrl, 'jobs.lever.co');
  if (!url || !new URL(url).pathname.startsWith('/' + board.id + '/'))
    return null;
  const c = raw.categories || {};
  const locations = Array.isArray(c.allLocations)
    ? c.allLocations.filter((v) => typeof v === 'string')
    : [];
  const location = [
    ...new Set([c.location || '', ...locations].filter(Boolean)),
  ].join(' / ');
  const n = normalizeText(location);
  const inTurkey =
    raw.country?.toUpperCase() === 'TR' ||
    (!raw.country &&
      (cities.some((city) =>
        n.split(/[,/]/).some((part) => part.trim() === normalizeText(city)),
      ) ||
        /\b(turkey|turkiye)\b/.test(n)));
  if (!inTurkey) return null;
  const description = plainText(
    [
      raw.descriptionBodyPlain || raw.descriptionPlain,
      ...(raw.lists || []).map((l) => (l.text || '') + ' ' + (l.content || '')),
      raw.additionalPlain,
    ].join('\n'),
  );
  const commitment = normalizeText(c.commitment || '');
  const job_type = commitment.includes('intern')
    ? 'internship'
    : commitment.includes('part')
      ? 'part_time'
      : commitment.includes('full')
        ? 'full_time'
        : commitment.includes('contract')
          ? 'contract'
          : 'unknown';
  const salary = raw.salaryRange;
  const amount = (v: number) =>
    new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v);
  const interval: Record<string, string> = {
    year: 'yıl',
    month: 'ay',
    hour: 'saat',
  };
  return {
    id: `lever:${board.id}:${raw.id}`,
    title: raw.text,
    company_name: board.name,
    source: board.name + ' kariyer',
    country: 'TR',
    category: department(c.team || c.department || ''),
    candidate_required_location: location
      .replace(/\bIstanbul\b/g, 'İstanbul')
      .replace(/\bIzmir\b/g, 'İzmir'),
    description,
    tags: extractSkills(raw.text + ' ' + description).slice(0, 12),
    url,
    workplace: ['onsite', 'remote', 'hybrid'].includes(raw.workplaceType || '')
      ? raw.workplaceType!
      : 'unknown',
    level: inferLevel(raw.text),
    job_type,
    publication_date:
      typeof raw.createdAt === 'number' &&
      Number.isFinite(raw.createdAt) &&
      !Number.isNaN(new Date(raw.createdAt).getTime())
        ? new Date(raw.createdAt).toISOString()
        : '',
    salary:
      salary &&
      typeof salary.min === 'number' &&
      typeof salary.currency === 'string'
        ? `${amount(salary.min)}${typeof salary.max === 'number' ? ' – ' + amount(salary.max) : ''} ${salary.currency} / ${interval[salary.interval || ''] || salary.interval || 'dönem belirtilmemiş'}`
        : '',
  };
}
export function normalizeRemotive(raw: Record<string, unknown>): Job | null {
  const url = safeUrl(raw.url, 'remotive.com');
  if (!url || typeof raw.id !== 'number' || typeof raw.title !== 'string')
    return null;
  return {
    id: raw.id,
    title: raw.title,
    company_name: String(raw.company_name || ''),
    category: department(String(raw.category || '')),
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((v): v is string => typeof v === 'string')
      : [],
    candidate_required_location: String(raw.candidate_required_location || ''),
    salary: String(raw.salary || ''),
    publication_date: String(raw.publication_date || ''),
    url,
    description: plainText(raw.description),
    job_type: String(raw.job_type || 'unknown'),
    workplace: 'remote',
    country: '',
    level: inferLevel(raw.title),
    source: 'Remotive',
  };
}
export function matchesLocation(j: Job, location: string) {
  if (!location) return true;
  if (location === 'TR') return j.country === 'TR';
  if (location === 'worldwide')
    return /worldwide|anywhere/i.test(j.candidate_required_location);
  return (
    j.country === 'TR' &&
    normalizeText(j.candidate_required_location).includes(
      normalizeText(location),
    )
  );
}
