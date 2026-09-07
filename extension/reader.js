import { platformForUrl, isJobUrl } from '../lib/platforms';
import { browserJobs } from '../lib/browser-jobs';
let running = false;
function collect(id) {
  const parsed = [];
  if (id === 'isinolsun') {
    try {
      const list = JSON.parse(document.querySelector('#__NEXT_DATA__')?.textContent || '{}')?.props?.pageProps?.jobs;
      if (Array.isArray(list)) for (const j of list.slice(0, 100)) {
        if (!j.isHiddenJob) parsed.push({ url: j.shareUrl, title: j.positionName, company_name: j.companyName,
          candidate_required_location: j.shortAddress || [j.townName, j.cityName].filter(Boolean).join(', '), country: 'TR' });
      }
    } catch {}
  }
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent);
      const list = Array.isArray(data) ? data : data['@graph'] || [data];
      for (const j of list) {
        if (j['@type'] !== 'JobPosting') continue;
        const address = j.jobLocation?.address || {};
        parsed.push({ url: j.url, title: j.title, company_name: j.hiringOrganization?.name,
          candidate_required_location: [address.addressLocality, address.addressRegion].filter(Boolean).join(', '),
          country: address.addressCountry === 'TR' ? 'TR' : '' });
      }
    } catch {}
  }
  // Signed-in layouts differ from public pages. Read only listing cards, never the full page text.
  const selectors = {
    linkedin: '.base-search-card, .job-card-container, .jobs-search-results__list-item',
    indeed: '.job_seen_beacon, .slider_container .slider_item',
    kariyer: '[data-test="ad-card-item"]',
    isinolsun: 'a[href*="/is-ilani/"]',
    yenibiris: '.job-list-item, .listViewItem, a[href*="/is-ilani/"]',
    eleman: 'a[href*="/is-ilani/"]'
  };
  const extra = [];
  for (const card of document.querySelectorAll(selectors[id])) {
    const link = [...(card.matches('a') ? [card] : []), ...card.querySelectorAll('a[href]')].find(a => platformForUrl(a.href)?.id === id && isJobUrl(a.href));
    if (!link) continue;
    const heading = card.querySelector('.base-search-card__title, .job-card-list__title, .jobTitle, h2, h3, [data-test="ad-card-title"]');
    const title = heading?.textContent || link.getAttribute('aria-label') || link.textContent;
    let company = card.querySelector('.base-search-card__subtitle, [data-testid="company-name"], .artdeco-entity-lockup__subtitle, .job-card-container__primary-description, [data-test="subtitle"], .c-showcase-box__subtitle')?.textContent;
    if (id === 'eleman') {
      const copy = card.querySelector('.c-showcase-box__subtitle')?.cloneNode(true);
      if (copy) { for (const child of [...copy.children]) child.remove(); company = copy.textContent?.replace(/-\s*$/, ''); }
    }
    extra.push({ url: link.href, title: title?.trim(),
      company_name: company,
      candidate_required_location: card.querySelector('.job-search-card__location, [data-testid="text-location"], .job-card-container__metadata-wrapper, [data-test="location"], .notranslate')?.textContent,
      description: card.querySelector('.job-snippet, [data-testid="jobsnippet_footer"]')?.textContent || '',
      country: id === 'linkedin' ? '' : 'TR' });
  }
  return browserJobs([...extra, ...parsed], id).slice(0, 40);
}
async function scan(manual = false) {
  if (running) return { message: 'Sayfa okunuyor…' };
  const task = await chrome.runtime.sendMessage({ action: 'TASK' });
  if (!task?.id) return { message: 'Önce Pusula’dan tarayıcı araması başlat.' };
  running = true;
  try {
    let jobs = [];
    for (let i = 0; i < (manual ? 1 : 5); i++) {
      if (!manual) await new Promise(r => setTimeout(r, 2000));
      jobs = collect(task.id);
      if (jobs.length) break;
    }
    await chrome.runtime.sendMessage({ action: 'CAPTURE', requestId: task.requestId, jobs });
    return { message: jobs.length ? `${jobs.length} ilan Pusula’ya aktarıldı.` : 'İlan okunamadı. Giriş/doğrulamayı tamamla veya ilan listesini açıp yeniden dene.' };
  } finally { running = false; }
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.action !== 'RESCAN') return;
  scan(true).then(reply, () => reply({ message: 'Sayfa okunamadı; yenileyip tekrar dene.' }));
  return true;
});
scan().catch(() => {});
