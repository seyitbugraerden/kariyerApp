import { platforms, platformForUrl, searchUrl } from '../lib/platforms';
import { browserJobs } from '../lib/browser-jobs';
const APP = 'https://pusula-is-arama.zeynepaktaserden.chatgpt.site';
const get = async () => (await chrome.storage.session.get('search')).search;
const put = search => chrome.storage.session.set({ search });
const isApp = sender => { try { return new URL(sender.url).origin === APP && sender.tab?.id != null; } catch { return false; } };
async function publish(s) {
  const jobs = Object.values(s.results).flatMap(r => r.jobs);
  const finished = Object.keys(s.results).length === s.sources.length;
  await chrome.tabs.sendMessage(s.appTab, { type: 'RESULTS', requestId: s.requestId, jobs,
    sources: Object.values(s.results).map(r => r.source), finished }).catch(() => {});
}
// Serialize mutations so simultaneous tab loads cannot overwrite each other's results.
let queue = Promise.resolve();
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  queue = queue.catch(() => {}).then(async () => {
    if (m.action === 'PING' && isApp(sender)) return { type: 'READY', version: '1.0.0' };
    if (m.action === 'START' && isApp(sender)) {
      if (typeof m.requestId !== 'string' || m.requestId.length > 80 || typeof m.query !== 'string' || m.query.length < 2 || m.query.length > 120 || typeof m.city !== 'string' || m.city.length > 80 || !Array.isArray(m.sources) || !m.sources.length || m.sources.length > 6 || m.sources.some(id => !platforms.some(p => p.id === id))) throw Error('Geçersiz arama.');
      const s = { requestId: m.requestId, appTab: sender.tab.id, query: m.query, city: m.city, sources: [...new Set(m.sources)], tabs: {}, results: {}, at: Date.now() };
      await put(s);
      for (const id of s.sources) {
        const tab = await chrome.tabs.create({ url: searchUrl(id, s.query, s.city), active: false });
        s.tabs[tab.id] = id;
      }
      await put(s);
      return { type: 'STARTED', requestId: s.requestId };
    }
    const s = await get();
    if (m.action === 'CANCEL' && isApp(sender) && s?.appTab === sender.tab.id && s.requestId === m.requestId) {
      await chrome.storage.session.remove('search');
      return { type: 'CANCELLED', requestId: m.requestId };
    }
    if (!s || Date.now() - s.at > 3600000) return {};
    const id = s.tabs[sender.tab?.id];
    if (!id || platformForUrl(sender.url)?.id !== id) return {};
    if (m.action === 'TASK') return { requestId: s.requestId, id, query: s.query };
    if (m.action === 'CAPTURE' && m.requestId === s.requestId) {
      const jobs = browserJobs(m.jobs, id).slice(0, 40);
      const p = platforms.find(p => p.id === id);
      s.results[id] = { jobs, source: { id, name: p.name, count: jobs.length, status: jobs.length ? 'ok' : 'error',
        searchUrl: searchUrl(id, s.query, s.city), message: jobs.length ? 'Tarayıcındaki sayfadan aktarıldı; tam metin kaynaktadır.' : 'İlan okunamadı. Sekmede giriş veya doğrulamayı tamamla; eklentiden yeniden aktar.' } };
      await put(s); await publish(s);
      return { count: jobs.length };
    }
    return {};
  });
  queue.then(reply, e => reply({ type: 'ERROR', requestId: m.requestId, message: e.message || 'Eklenti işlemi tamamlanamadı.' }));
  return true;
});
chrome.tabs.onRemoved.addListener(tabId => {
  queue = queue.catch(() => {}).then(async () => {
    const s = await get();
    if (!s) return;
    if (s.appTab === tabId) { await chrome.storage.session.remove('search'); return; }
    const id = s.tabs[tabId];
    if (id && !s.results[id]) {
      s.results[id] = { jobs: [], source: { id, name: platforms.find(p => p.id === id).name, count: 0, status: 'error', message: 'Arama sekmesi kapatıldı.', searchUrl: searchUrl(id, s.query, s.city) } };
      await put(s); await publish(s);
    }
  });
});
