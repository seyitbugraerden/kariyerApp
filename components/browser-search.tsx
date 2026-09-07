'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { browserJobs } from '@/lib/browser-jobs';
import type { Job } from '@/lib/jobs';
import { platforms, type PlatformId, type PlatformResult } from '@/lib/platforms';

export default function BrowserSearch({ query, city, selected, onResults }: {
  query: string; city: string; selected: PlatformId[]; onResults: (jobs: Job[]) => void;
}) {
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [statuses, setStatuses] = useState<PlatformResult[]>([]);
  const current = useRef('');
  const resultsRef = useRef(onResults);
  resultsRef.current = onResults;
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const post = (data: object) => window.postMessage({ channel: 'pusula-app', ...data }, window.location.origin);
  useEffect(() => {
    function receive(event: MessageEvent) {
      const d = event.data;
      if (event.source !== window || event.origin !== window.location.origin || d?.channel !== 'pusula-extension') return;
      if (d.type === 'READY') { setConnected(true); return; }
      if (!current.current || d.requestId !== current.current) return;
      if (d.type === 'ERROR') { setBusy(false); setMessage(typeof d.message === 'string' ? d.message.slice(0, 240) : 'Arama tamamlanamadı.'); }
      if (d.type === 'RESULTS') {
        const jobs = browserJobs(d.jobs);
        if (jobs.length) resultsRef.current(jobs);
        if (Array.isArray(d.sources)) setStatuses(d.sources.filter((s: PlatformResult) => platforms.some(p => p.id === s?.id)).slice(0, 6));
        setMessage(jobs.length ? `${jobs.length} ilan aktarıldı. Seçili filtrelere uyanlar aşağıda görünür; CV uyumuna göre sıralayabilirsin.` : 'Henüz ilan aktarılamadı; önceki sonuçlar korunuyor. Açılan sekmeleri kontrol et; ardından eklentiden yeniden aktar.');
        if (d.finished) { setBusy(false); clearTimeout(timeout.current); }
      }
    }
    window.addEventListener('message', receive);
    post({ action: 'PING' });
    const ping = setInterval(() => post({ action: 'PING' }), 5000);
    return () => { clearInterval(ping); clearTimeout(timeout.current); window.removeEventListener('message', receive); };
  }, []);
  function start() {
    if (query.trim().length < 2 || !selected.length) { setMessage('Bir pozisyon veya CV becerisi ve en az bir platform seç.'); return; }
    current.current = crypto.randomUUID();
    setStatuses([]); setBusy(true);
    setMessage('Seçtiğin siteler yeni sekmelerde açılıyor. İlanlar okundukça burada görünecek.');
    post({ action: 'START', requestId: current.current, query: query.trim(), city, sources: selected });
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      setBusy(false);
      setMessage('Bekleme süresi doldu. Açılan sekmeleri kontrol et; eklenti düğmesinden ilanları yeniden aktarabilirsin. Gelen sonuçlar korunur.');
    }, 45000);
  }
  return <section className="browser-search">
    <div className="browser-search-heading"><div><strong>Kendi tarayıcında ara</strong><p>Mevcut oturumlarınla arama yap. CV dosyan tarayıcında kalır; arama kelimelerin iş sitelerine gönderilir.</p></div><span>{connected ? 'Eklenti bağlı' : 'Eklenti kurulumu gerekli'}</span></div>
    <div className="browser-search-actions">
      <Button onClick={start} disabled={!connected || busy}>{busy ? 'Sekmeler okunuyor…' : 'Tarayıcımda ara'}</Button>
      {busy && <Button variant="outline" onClick={() => { post({ action: 'CANCEL', requestId: current.current }); current.current = ''; setBusy(false); clearTimeout(timeout.current); setMessage('Arama durduruldu. Açılan sekmeler ve gelen ilanlar korunuyor.'); }}>Durdur</Button>}
      <a href="/pusula-extension.zip" download>Eklentiyi indir (.zip)</a>
    </div>
    <details open={!connected}><summary>Chrome / Edge için bir kerelik kurulum</summary>
      <ol><li>Eklentiyi indir ve ZIP dosyasını bir klasöre çıkar.</li><li>Chrome’da <code>chrome://extensions</code>, Edge’de <code>edge://extensions</code> adresini aç.</li><li>“Geliştirici modu”nu aç → “Paketlenmemiş öğe yükle” → çıkardığın, manifest.json dosyasının bulunduğu klasörü seç.</li><li>Pusula sayfasını yenile. Pozisyonunu ve platformları seçip “Tarayıcımda ara”ya bas.</li></ol>
      <p>Giriş veya doğrulama istenirse ilgili sekmede tamamla; tarayıcının eklentiler menüsünden Pusula’yı açıp “Bu sayfadaki ilanları aktar”a bas. Yenibiriş’te arama kelimeni sitedeki arama kutusuna kendin gir.</p>
      <p>Yalnızca açık sonuç sayfalarındaki ilanlar okunur. Başvuru geçmişi incelenmez. Sekmeler otomatik kapatılmaz; tarama bitince kapatabilirsin. Eklenti masaüstü Chrome ve Edge içindir.</p>
    </details>
    {message && <p role="status" className="platform-message">{message}</p>}
    {statuses.length > 0 && <ul className="browser-source-list">{statuses.map(s => <li key={s.id}><strong>{platforms.find(p => p.id === s.id)?.name}</strong><span>{s.count > 0 ? `${s.count} ilan aktarıldı` : 'Sekmeyi kontrol et; gerekirse yeniden aktar'}</span></li>)}</ul>}
  </section>;
}
