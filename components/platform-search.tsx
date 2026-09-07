'use client';
import { useRef, useState } from 'react';
import { Search, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  platforms,
  searchUrl,
  type PlatformId,
  type PlatformResult,
} from '@/lib/platforms';
import type { Job } from '@/lib/jobs';
import BrowserSearch from '@/components/browser-search';
export default function PlatformSearch({
  query,
  onQuery,
  city,
  skills,
  onResults,
}: {
  query: string;
  onQuery: (q: string) => void;
  city: string;
  skills: string[];
  onResults: (jobs: Job[]) => void;
}) {
  const [selected, setSelected] = useState<PlatformId[]>(
      platforms.map((p) => p.id),
    ),
    [busy, setBusy] = useState(false),
    [statuses, setStatuses] = useState<PlatformResult[]>([]),
    [message, setMessage] = useState(''),
    [last, setLast] = useState(''),
    [indexConnected, setIndexConnected] = useState(false);
  const active = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  async function search() {
    const term = query.trim() || skills.slice(0, 2).join(' ');
    if (term.length < 2) {
      setMessage(
        'Bir pozisyon veya beceri yaz; CV’nden bir beceri de seçebilirsin.',
      );
      return;
    }
    if (!selected.length) {
      setMessage('En az bir platform seç.');
      return;
    }
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const n = ++sequence.current;
    setBusy(true);
    setMessage('');
    setStatuses([]);
    try {
      const r = await fetch('/api/platform-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: term,
          city: city === 'worldwide' ? 'TR' : city,
          sources: selected,
        }),
        signal: controller.signal,
      });
      const d = (await r.json()) as {
        jobs: Job[];
        sources: PlatformResult[];
        error?: string;
        indexConnected: boolean;
      };
      if (n !== sequence.current) return;
      if (!r.ok) throw Error(d.error || 'Arama tamamlanamadı.');
      if (d.jobs.length || d.sources.every(s => s.status === 'empty')) onResults(d.jobs);
      setStatuses(d.sources);
      setLast(term + ' · ' + (city && city !== 'TR' ? city : 'Türkiye'));
      setIndexConnected(d.indexConnected);
      if (!d.jobs.length)
        setMessage(
          'Bu aramada ilan getirilemedi. Her platformun durumunu aşağıda görebilirsin.',
        );
    } catch (e) {
      if (
        n === sequence.current &&
        !(e instanceof Error && e.name === 'AbortError')
      )
        setMessage(e instanceof Error ? e.message : 'Arama tamamlanamadı.');
    } finally {
      if (n === sequence.current) setBusy(false);
    }
  }
  return (
    <section className="platform-search">
      <form
        className="searchbar"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <Search size={20} />
        <input
          aria-label="İlan ara"
          placeholder="Örn. muhasebe uzmanı, satış, Python"
          value={query}
          maxLength={120}
          onChange={(e) => onQuery(e.target.value)}
        />
        <Button className="search-button" type="submit" disabled={busy}>
          {busy ? 'Taranıyor…' : 'Sunucudan ara'}
        </Button>
      </form>
      <fieldset className="platform-picker">
        <legend>Aranacak platformlar</legend>
        {platforms.map((p) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...selected, p.id]
                    : selected.filter((id) => id !== p.id),
                )
              }
            />
            {p.name}
          </label>
        ))}
      </fieldset>
      {skills.length > 0 && (
        <div className="cv-search-skills">
          <span>
            <Sparkles size={14} />
            CV’nden ara:
          </span>
          {skills.slice(0, 6).map((s) => (
            <button key={s} onClick={() => onQuery(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <section className="manual-search-links">
        <strong>Platformda ara, kendin başvur</strong>
        <p>{query.trim() || skills[0] ? `Arama: “${query.trim() || skills[0]}”. Bağlantıyı aç, uygun ilanı seç ve platform üzerinden başvur.` : 'Bir pozisyon yaz veya yukarıdan CV becerini seç. Bağlantılar yazdıkça güncellenir.'}</p>
        <div>{platforms.filter(p => selected.includes(p.id)).map(p => <a key={p.id} href={searchUrl(p.id, query.trim() || skills[0] || '', city === 'worldwide' ? 'TR' : city)} target="_blank" rel="noopener noreferrer"><span>{p.name}</span><ArrowUpRight size={16} /></a>)}</div>
        <p className="platform-help">Eklenti veya API gerekmez. Bu bağlantılar arama sayfalarını açar; ilanlar Pusula’ya otomatik aktarılmaz. İl filtresini açılan sitede kontrol et. Yenibiriş’te arama kelimeni sitedeki kutuya gir.</p>
      </section>
      <details className="optional-extension"><summary>İlanları Pusula’ya toplamak için: tarayıcı eklentisi</summary><BrowserSearch query={query.trim() || skills[0] || ''} city={city === 'worldwide' ? 'TR' : city} selected={selected} onResults={onResults} /></details>
      <p className="platform-help">“Sunucudan ara” alternatif yöntemdir; bazı platformlar bu erişimi engeller. Tarayıcı araması için yukarıdaki eklentiyi kur. İl ve diğer filtreler getirilen ilanlara uygulanır; bütün ilanları kapsamaz.</p>
      {busy && (
        <p className="platform-progress" role="status">
          Seçili platformlar araştırılıyor… Kaynaklara göre 10–30 saniye
          sürebilir.
        </p>
      )}
      {message && (
        <p className="platform-message" role="status">
          {message}
        </p>
      )}
      {statuses.length > 0 && (
        <details className="platform-statuses" open>
          <summary>Son platform araması: {last}</summary>
          <div>
            {statuses.map((s) => (
              <article key={s.id} className={'platform-status ' + s.status}>
                <div>
                  <strong>{s.name}</strong>
                  <span>
                    {s.status === 'ok'
                      ? `${s.count} ilan`
                      : s.status === 'index'
                        ? `${s.count} dizin sonucu`
                        : s.status === 'empty'
                          ? 'Sonuç yok'
                          : s.status === 'blocked'
                            ? 'Erişim engellendi'
                            : 'Bağlantı hatası'}
                  </span>
                </div>
                <p>{s.message}</p>
                <a href={s.searchUrl} target="_blank" rel="noreferrer">
                  Kaynakta aç <ArrowUpRight size={13} />
                </a>
              </article>
            ))}
          </div>
          {!indexConnected &&
            statuses.some(
              (s) => s.status === 'blocked' || s.status === 'error',
            ) && (
              <p className="platform-help">
                Engellenen kaynaklar için ek arama servisi bağlı değil. Bu
                kaynaklardan ilan alındığı varsayılmaz.
              </p>
            )}
        </details>
      )}
    </section>
  );
}
