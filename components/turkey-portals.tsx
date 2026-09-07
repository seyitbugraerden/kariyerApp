'use client';
import { useState } from 'react';
import { ArrowUpRight, Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  cities,
  portals,
  portalForUrl,
  canonicalJobUrl,
  workLabels,
  inferLevel,
  typeLabels,
} from '@/lib/turkey';
import { extractSkills } from '@/lib/matching';
import { department, type Job } from '@/lib/jobs';
import { platformJobKey } from '@/lib/platforms';
export default function TurkeyPortals({
  query,
  city,
  skills,
  onAdd,
}: {
  query: string;
  city: string;
  skills: string[];
  onAdd: (job: Job) => void;
}) {
  const [open, setOpen] = useState(false),
    [message, setMessage] = useState('');
  const brief = [
    query || skills.slice(0, 3).join(' '),
    city && city !== 'TR' && city !== 'worldwide'
      ? city
      : city === 'TR'
        ? 'Türkiye'
        : '',
  ]
    .filter(Boolean)
    .join(' · ');
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    const form = new FormData(e.currentTarget);
    const url = String(form.get('url') || '').trim();
    const portal = portalForUrl(url);
    if (!portal) {
      setMessage(
        'Desteklenen kariyer platformlarından bir HTTPS ilan bağlantısı ekle.',
      );
      return;
    }
    const title = String(form.get('title') || '').trim(),
      company = String(form.get('company') || '').trim(),
      description = String(form.get('description') || '').trim();
    if (!title || !company) {
      setMessage('Pozisyonu ve şirketi doldur.');
      return;
    }
    const canonical = canonicalJobUrl(url);
    onAdd({
      id: platformJobKey(canonical),
      url: canonical,
      title,
      company_name: company,
      candidate_required_location: String(form.get('city') || ''),
      country: 'TR',
      description,
      source: portal.name + ' · elle eklendi',
      tags: extractSkills(description + ' ' + title),
      category: department(title),
      salary: '',
      publication_date: '',
      job_type: String(form.get('type') || 'unknown'),
      workplace: String(form.get('workplace') || 'unknown'),
      level: inferLevel(title),
      manual: true,
    });
    setOpen(false);
  }
  return (
    <section className="turkey-portals">
      <div className="portal-heading">
        <div>
          <span className="mini-label">TÜRKİYE’DE İŞ ARA</span>
          <h2>Diğer kariyer platformları</h2>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setOpen(true);
            setMessage('');
          }}
        >
          <Plus size={16} />
          İlan ekle
        </Button>
      </div>
      <details>
        <summary>Arama sayfaları ve arama metni</summary>
        <p>
          Bu sitelerin arama sayfalarını aç. Bulduğun ilanı buraya ekleyerek
          CV’nle karşılaştır ve başvurunu takip et.
        </p>
        <div className="portal-links">
          {portals.map((p) => (
            <a key={p.host} href={p.url} target="_blank" rel="noreferrer">
              {p.name}
              <ArrowUpRight size={15} />
            </a>
          ))}
        </div>
        <div className="search-brief">
          <span>{brief || 'Arama alanına bir pozisyon veya beceri yaz.'}</span>
          <button
            type="button"
            disabled={!brief}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(brief);
                setMessage(
                  'Arama metni kopyalandı. Seçtiğin sitenin aramasına yapıştır.',
                );
              } catch {
                setMessage(
                  'Otomatik kopyalama kullanılamıyor. Yukarıdaki arama metnini seçerek kopyalayabilirsin.',
                );
              }
            }}
          >
            <Copy size={14} />
            Kopyala
          </button>
        </div>
        <small>
          Bu bağlantılar ilanları içeri aktarmaz; filtrelerini ilgili sitede de
          seçmelisin. Hesap ve başvuru geçmişi eşitlenmez.
        </small>
      </details>
      {message && !open && <p role="status">{message}</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="modal" showCloseButton>
          <DialogTitle>Yerel bir ilan ekle</DialogTitle>
          <p>
            İlan metnini kendin ekle. Bağlantı ziyaret edilmez ve hesabına
            erişilmez.
          </p>
          <form onSubmit={submit} className="manual-form">
            <label>
              İlan bağlantısı
              <input
                required
                type="url"
                name="url"
                maxLength={2000}
                placeholder="https://www.kariyer.net/is-ilani/…"
              />
            </label>
            <div className="form-grid">
              <label>
                Pozisyon
                <input
                  required
                  name="title"
                  maxLength={180}
                  placeholder="Örn. Muhasebe uzmanı"
                />
              </label>
              <label>
                Şirket
                <input required name="company" maxLength={120} />
              </label>
              <label>
                İl
                <select
                  name="city"
                  defaultValue={cities.includes(city) ? city : ''}
                >
                  <option value="">Belirtilmemiş</option>
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Çalışma şekli
                <select name="workplace" defaultValue="unknown">
                  {Object.entries(workLabels).map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                İstihdam türü
                <select name="type" defaultValue="unknown">
                  {Object.entries(typeLabels).map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              İlan metni
              <textarea
                name="description"
                rows={5}
                maxLength={20000}
                placeholder="Görevleri ve aranan becerileri yapıştır. Beceri eşleşmesi bu metne dayanır."
              />
            </label>
            {message && <p role="alert">{message}</p>}
            <Button type="submit" className="primary-button">
              İlanı listeme ekle
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
