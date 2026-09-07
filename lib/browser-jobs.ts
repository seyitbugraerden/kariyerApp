import { isJobUrl, platformForUrl, platformJobKey, type PlatformId } from './platforms';
import { canonicalJobUrl, inferLevel, cities, normalizeText } from './turkey';
import { extractSkills } from './matching';
import { department, type Job } from './jobs';

// Treat extension messages as untrusted input; never accept arbitrary links or markup.
export function browserJobs(value: unknown, source?: PlatformId): Job[] {
  if (!Array.isArray(value)) return [];
  const text = (v: unknown, max: number) => typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim().slice(0, max) : '';
  const rows: Job[] = [];
  for (const raw of value.slice(0, 240)) {
    if (!raw || typeof raw !== 'object') continue;
    const p = platformForUrl(raw.url);
    if (!p || (source && p.id !== source) || !isJobUrl(raw.url)) continue;
    const title = text(raw.title, 220);
    if (!title) continue;
    const description = text(raw.description, 1600);
    const location = text(raw.candidate_required_location, 220);
    const tr = /türkiye|turkiye|turkey/i.test(location) || cities.some(c => normalizeText(location).split(/[,·()]/).some(part => part.trim() === normalizeText(c)));
    rows.push({ id: platformJobKey(raw.url), url: canonicalJobUrl(raw.url), title,
      company_name: text(raw.company_name, 220) || 'Şirket belirtilmemiş',
      candidate_required_location: location,
      country: raw.country === 'TR' || tr ? 'TR' : '', description,
      category: department(title), tags: extractSkills(title + ' ' + description),
      source: p.name, salary: '', publication_date: '',
      workplace: ['onsite', 'remote', 'hybrid'].includes(raw.workplace) ? raw.workplace : 'unknown',
      job_type: ['full_time', 'part_time', 'internship'].includes(raw.job_type) ? raw.job_type : 'unknown',
      level: inferLevel(title), summaryOnly: true });
  }
  return [...new Map(rows.map(j => [j.id, j])).values()];
}
