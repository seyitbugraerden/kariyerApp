'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Search,
  Bookmark,
  BriefcaseBusiness,
  FileText,
  Link2,
  Upload,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  X,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { containsSkill } from '@/lib/matching';
import {
  cities,
  normalizeText,
  workLabels,
  typeLabels,
  levelLabels,
} from '@/lib/turkey';
import {
  type Job,
  type JobId,
  type SourceStatus,
  matchesLocation,
} from '@/lib/jobs';
import TurkeyPortals from '@/components/turkey-portals';
import PlatformSearch from '@/components/platform-search';
import CvReport from '@/components/cv-report';
import { analyzeCv, type CvAnalysis } from '@/lib/cv-analysis';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]),
    [platformJobs, setPlatformJobs] = useState<Job[]>([]),
    [rememberedJobs, setRememberedJobs] = useState<Job[]>([]),
    [manualJobs, setManualJobs] = useState<Job[]>([]),
    [sources, setSources] = useState<SourceStatus[]>([]),
    [workplace, setWorkplace] = useState(''),
    [level, setLevel] = useState(''),
    [jobType, setJobType] = useState(''),
    [sourceFilter, setSourceFilter] = useState(''),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState(''),
    [location, setLocation] = useState('TR'),
    [tab, setTab] = useState('discover'),
    [saved, setSaved] = useState<JobId[]>([]),
    [applied, setApplied] = useState<JobId[]>([]),
    [hide, setHide] = useState(false),
    [skills, setSkills] = useState<string[]>([]),
    [filename, setFilename] = useState(''),
    [analysis, setAnalysis] = useState<CvAnalysis | null>(null),
    [cvError, setCvError] = useState(''),
    [modal, setModal] = useState(''),
    [cvText, setCvText] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [detail, setDetail] = useState<Job | null>(null),
    [sort, setSort] = useState('match');
  const input = useRef<HTMLInputElement>(null);
  async function fetchJobs() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/jobs');
      const d = (await r.json()) as { jobs: Job[]; sources: SourceStatus[] };
      setSources(d.sources || []);
      if (!r.ok) throw Error();
      setJobs(d.jobs);
    } catch {
      setError(
        'İlan kaynağına şu anda ulaşılamıyor. Biraz sonra yeniden deneyebilirsin.',
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchJobs();
    try {
      const d = JSON.parse(localStorage.getItem('pusula-local') || '{}');
      setSaved(d.saved || []);
      setApplied(d.applied || []);
      setSkills(d.skills || []);
      setFilename(d.filename || '');
      const report = JSON.parse(localStorage.getItem('pusula-cv-analysis') || 'null');
      if (report?.version === 1 && report.filename === d.filename && Array.isArray(report.skills) && Array.isArray(report.roles) && Array.isArray(report.otherMentions) && typeof report.characters === 'number') {
        setAnalysis(report);
        setQuery(report.roles[0]?.title || report.skills[0] || '');
      }
      const imported = JSON.parse(
        localStorage.getItem('pusula-manual') || '[]',
      );
      if (Array.isArray(imported))
        setManualJobs(
          imported.filter(
            (j) =>
              j &&
              j.manual &&
              typeof j.id === 'string' &&
              typeof j.title === 'string' &&
              typeof j.description === 'string' &&
              Array.isArray(j.tags),
          ),
        );
      const history = JSON.parse(
        localStorage.getItem('pusula-history') || '[]',
      );
      if (Array.isArray(history))
        setRememberedJobs(
          history.filter(
            (j) =>
              j &&
              typeof j.title === 'string' &&
              typeof j.description === 'string' &&
              typeof j.company_name === 'string' &&
              typeof j.source === 'string' &&
              Array.isArray(j.tags) &&
              typeof j.url === 'string' &&
              j.url.startsWith('https://'),
          ),
        );
    } catch {}
  }, []);
  function persist(s: JobId[], a: JobId[], sk = skills, f = filename) {
    try {
      localStorage.setItem(
        'pusula-local',
        JSON.stringify({ saved: s, applied: a, skills: sk, filename: f }),
      );
    } catch {
      setMessage(
        'Kayıt alanı kullanılamıyor; değişiklikler yalnızca bu oturumda kalacak.',
      );
    }
  }
  function toggle(j: Job, kind: string) {
    const history = [j, ...rememberedJobs.filter((old) => old.id !== j.id)];
    setRememberedJobs(history);
    try {
      localStorage.setItem('pusula-history', JSON.stringify(history));
    } catch {
      setMessage('İlan ayrıntıları saklanamadı; tarayıcı kayıt alanı dolu.');
    }
    if (kind === 'saved') {
      const v = saved.includes(j.id)
        ? saved.filter((i) => i !== j.id)
        : [...saved, j.id];
      setSaved(v);
      persist(v, applied);
    } else {
      const v = applied.includes(j.id)
        ? applied.filter((i) => i !== j.id)
        : [...applied, j.id];
      setApplied(v);
      persist(saved, v);
    }
  }
  function navigate(next: string) {
    setTab(next);
    setQuery('');
    setCategory('');
    setLocation(next === 'discover' ? 'TR' : '');
    setWorkplace('');
    setLevel('');
    setJobType('');
    setSourceFilter('');
  }
  function analyze(text: string, name: string, pages?: number) {
    const report = analyzeCv(text, pages);
    const found = report.skills;
    setAnalysis(report);
    setCvError('');
    try { localStorage.setItem('pusula-cv-analysis', JSON.stringify({ ...report, filename: name })); } catch {}
    setSkills(found);
    setFilename(name);
    persist(saved, applied, found, name);
    setModal('');
    navigate('discover');
    setQuery(report.roles[0]?.title || found[0] || '');
    setSort('match');
    setCvText('');
    setMessage(
      found.length
        ? `${found.length} beceri bulundu. İlanlar becerilerine göre sıralandı.`
        : 'CV okundu. Profilinden becerilerini ekleyebilirsin.',
    );
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setCvError('En fazla 10 MB dosya seç.');
      return;
    }
    setBusy(true);
    setCvError('');
    try {
      let text = '';
      let pages: number | undefined;
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const p = await import('pdfjs-dist/legacy/build/pdf.mjs');
        p.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs?compat=legacy-6.3.289';
        const task = p.getDocument({ data: await file.arrayBuffer() });
        try {
          const doc = await task.promise;
          pages = doc.numPages;
          for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
            const c = await (await doc.getPage(i)).getTextContent();
            text +=
              c.items.map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : '')).join('') + '\n';
          }
        } finally {
          await task.destroy();
        }
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const m = await import('mammoth');
        text = (
          await m.extractRawText({ arrayBuffer: await file.arrayBuffer() })
        ).value;
      } else if (file.name.toLowerCase().endsWith('.txt'))
        text = await file.text();
      else throw Error('PDF, DOCX veya TXT seç.');
      analyze(text, file.name, pages);
    } catch (e) {
      const reason = e instanceof Error ? e.message : '';
      setCvError(/password/i.test(reason) ? 'PDF parola korumalı. Parolasız bir kopya yükle veya metnini yapıştır.' : /CV’den|PDF, DOCX/.test(reason) ? reason : 'Dosya okunamadı. PDF/DOCX dosyasını yeniden seç veya CV metnini aşağıya yapıştır.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  const matches = (j: Job) =>
    skills.filter((s) =>
      containsSkill(j.title + ' ' + j.tags.join(' ') + ' ' + j.description, s),
    );
  function addManual(j: Job) {
    const previous = manualJobs.find((m) => m.id === j.id);
    if (previous) {
      setMessage('Bu ilan zaten listende.');
      return;
    }
    const updated = [j, ...manualJobs];
    const bookmarks = [...saved, j.id];
    setManualJobs(updated);
    setSaved(bookmarks);
    persist(bookmarks, applied);
    try {
      localStorage.setItem('pusula-manual', JSON.stringify(updated));
    } catch {
      setMessage('İlan bu oturuma eklendi; tarayıcı kayıt alanı dolu.');
    }
    setTab('saved');
    setQuery('');
    setLocation('');
    setCategory('');
    setWorkplace('');
    setLevel('');
    setJobType('');
    setSourceFilter('');
  }
  const liveAndManual = [
    ...new Map(
      [...jobs, ...platformJobs, ...manualJobs].map((j) => [j.id, j]),
    ).values(),
  ];
  const allJobs = [
    ...liveAndManual,
    ...(tab === 'discover'
      ? []
      : rememberedJobs.filter(
          (j) => !liveAndManual.some((live) => live.id === j.id),
        )),
  ];
  const filtered = allJobs
    .filter(
      (j) =>
        (!query ||
          normalizeText(
            j.title + ' ' + j.company_name + ' ' + j.tags.join(' '),
          ).includes(normalizeText(query))) &&
        (!category || j.category === category) &&
        matchesLocation(j, location) &&
        (!workplace || j.workplace === workplace) &&
        (!level || j.level === level) &&
        (!jobType || j.job_type === jobType) &&
        (!sourceFilter || j.source === sourceFilter) &&
        (tab !== 'saved' || saved.includes(j.id)) &&
        (tab !== 'applied' || applied.includes(j.id)) &&
        (!(hide && tab !== 'applied') || !applied.includes(j.id)),
    )
    .sort((a, b) =>
      sort === 'match'
        ? matches(b).length - matches(a).length
        : (Date.parse(b.publication_date) || 0) -
          (Date.parse(a.publication_date) || 0),
    );
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: {
          registerTool: (t: unknown, o: unknown) => Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const c = new AbortController();
    try {
      Promise.resolve(
        ctx.registerTool(
          {
            name: 'search_jobs',
            description:
              'İlan listesini başlık, şirket veya beceriye göre filtreler.',
            inputSchema: {
              type: 'object',
              properties: { query: { type: 'string' } },
              required: ['query'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (v: { query: unknown }) => {
              if (typeof v?.query !== 'string' || v.query.length > 200)
                throw Error('Geçerli arama metni gerekli.');
              setQuery(v.query);
              setTab('discover');
              return { query: v.query };
            },
          },
          { signal: c.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => c.abort();
  }, []);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-icon">
            <Compass size={25} />
          </span>
          pusula<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">KARİYER ALANIN</div>
        <nav>
          <button
            className={'nav-item ' + (tab === 'discover' ? 'active' : '')}
            onClick={() => navigate('discover')}
          >
            <Compass />
            İş keşfet
          </button>
          <button
            className={'nav-item ' + (tab === 'saved' ? 'active' : '')}
            onClick={() => navigate('saved')}
          >
            <Bookmark />
            Kaydedilenler<small>{saved.length}</small>
          </button>
          <button
            className={'nav-item ' + (tab === 'applied' ? 'active' : '')}
            onClick={() => navigate('applied')}
          >
            <BriefcaseBusiness />
            Başvurularım<small>{applied.length}</small>
          </button>
        </nav>
        <div className="nav-separator" />
        <button className="nav-item" onClick={() => setModal('profile')}>
          <FileText />
          CV ve profilim
        </button>
        <button className="nav-item" onClick={() => setModal('linkedin')}>
          <Link2 />
          Bağlantılar
          <span className="tiny-dot" />
        </button>
        <div className="sidebar-bottom">
          <div className="tip-icon">
            <Sparkles size={19} />
          </div>
          <strong>Bir sonraki adımın burada.</strong>
          <p>Deneyimine uygun fırsatları tek bir yerde keşfet.</p>
          <button onClick={() => setModal('upload')}>
            CV’ni ekle <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="local-profile">
          <span>B</span>
          <div>
            <strong>Kişisel çalışma alanı</strong>
            <small>Bu tarayıcıda saklanır</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Çalışma alanım <ChevronRight size={15} />
            <strong>
              {tab === 'discover'
                ? 'İş keşfet'
                : tab === 'saved'
                  ? 'Kaydedilenler'
                  : 'Başvurularım'}
            </strong>
          </span>
          <span className="private">
            <ShieldCheck size={15} />
            CV’n senin kontrolünde
          </span>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />
                TÜRKİYE KARİYER ALANIN
              </div>
              <h1>
                {tab === 'discover'
                  ? 'Türkiye’de bir sonraki işini keşfet.'
                  : tab === 'saved'
                    ? 'Aklında kalan fırsatlar.'
                    : 'Attığın adımları takip et.'}
              </h1>
              <p>
                Yerel fırsatlar, Türkçe CV eşleşmesi ve tek yerde başvuru
                takibi.
              </p>
            </div>
            <Compass className="heading-mark" size={62} strokeWidth={1} />
          </div>
          <section className="onboarding">
            <div className="upload-intro">
              <span className="square-icon">
                <FileText size={26} />
              </span>
              <div>
                <div className="mini-label">SANA ÖZEL BİR ARAMA</div>
                <h2>
                  {filename
                    ? 'Profilin keşfe hazır.'
                    : 'İyi bir eşleşme, CV’nle başlar.'}
                </h2>
                <p>
                  {filename ||
                    'CV’ni yükle, becerilerine uygun ilanları birlikte bulalım.'}
                </p>
              </div>
            </div>
            <Button
              className="primary-button"
              onClick={() => setModal('upload')}
            >
              <Upload size={17} />
              {filename ? 'CV’yi güncelle' : 'CV’mi yükle'}
              <ArrowUpRight size={16} />
            </Button>
            <div className="onboarding-foot">
              <span>
                <ShieldCheck size={14} />
                Dosyan sunucuya gönderilmez
              </span>
              <span>PDF, DOCX veya TXT · En fazla 10 MB</span>
            </div>
          </section>
          <CvReport analysis={analysis} filename={filename} onSearch={q => { navigate('discover'); setQuery(q); }} onUpload={() => setModal('upload')} />
          <div className="content-grid">
            <section className="results">
              <PlatformSearch
                query={query}
                onQuery={setQuery}
                city={location}
                skills={skills}
                onResults={(rows) => {
                  setPlatformJobs(rows);
                  setTab('discover');
                }}
              />
              <div className="filters">
                <label>
                  <SlidersHorizontal size={16} />
                  <select
                    aria-label="Alan"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Tüm alanlar</option>
                    {Array.from(new Set(allJobs.map((j) => j.category)))
                      .sort()
                      .map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                  </select>
                </label>
                <label>
                  <MapPin size={16} />
                  <select
                    aria-label="Konum"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="TR">Türkiye · tüm iller</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="worldwide">
                      Dünya geneline açık uzaktan
                    </option>
                    <option value="">Tüm ülkeler</option>
                  </select>
                </label>
                <label>
                  <select
                    aria-label="Çalışma şekli"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                  >
                    <option value="">Tüm çalışma şekilleri</option>
                    {Object.entries(workLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <select
                    aria-label="Pozisyon seviyesi"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option value="">Tüm seviyeler</option>
                    {Object.entries(levelLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <select
                    aria-label="İstihdam türü"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="">Tüm istihdam türleri</option>
                    {Object.entries(typeLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <select
                    aria-label="İlan kaynağı"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                  >
                    <option value="">Tüm ilan kaynakları</option>
                    {Array.from(new Set(allJobs.map((j) => j.source))).map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <TurkeyPortals
                query={query}
                city={location}
                skills={skills}
                onAdd={addManual}
              />
              {sources.length > 0 && (
                <div
                  className="source-status"
                  aria-label="İlan kaynağı durumları"
                >
                  {sources.map((s) => (
                    <span
                      className={s.status === 'error' ? 'source-error' : ''}
                      key={s.name}
                    >
                      {s.status === 'ok' ? '✓' : '!'} {s.name} ·{' '}
                      {s.status === 'ok' ? s.count + ' ilan' : 'ulaşılamadı'}
                    </span>
                  ))}
                </div>
              )}
              <div className="results-heading">
                <h2>
                  {tab === 'discover'
                    ? 'Senin için fırsatlar'
                    : tab === 'saved'
                      ? 'Kaydettiğin ilanlar'
                      : 'Başvurduğun ilanlar'}{' '}
                  <span>{filtered.length}</span>
                </h2>
                <select
                  aria-label="Sıralama"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="match">Beceri eşleşmesi</option>
                  <option value="date">Kaynak tarihine göre</option>
                </select>
              </div>
              <div className="hide-row">
                <label>
                  <input
                    type="checkbox"
                    checked={hide}
                    onChange={(e) => setHide(e.target.checked)}
                  />
                  Başvurduğum ilanları gizle
                </label>
                <span>
                  {location === 'TR'
                    ? 'Türkiye konumlu ilanlar'
                    : 'Seçili konumlardaki ilanlar'}
                </span>
              </div>
              {loading && !manualJobs.length ? (
                <div className="empty">
                  <Compass className="spin" size={32} />
                  <h3>Fırsatlar aranıyor…</h3>
                  <p>Güncel ilanlar getiriliyor.</p>
                </div>
              ) : error && !manualJobs.length ? (
                <div className="empty">
                  <h3>Bağlantı kurulamadı</h3>
                  <p>{error}</p>
                  <Button onClick={fetchJobs}>Yeniden dene</Button>
                </div>
              ) : !filtered.length ? (
                <div className="empty">
                  <Search size={30} />
                  <h3>
                    {tab === 'saved'
                      ? 'Henüz bir ilan kaydetmedin.'
                      : tab === 'applied'
                        ? 'İlk adımını bekliyoruz.'
                        : 'Bu aramada ilan bulunamadı.'}
                  </h3>
                  <p>İlanları keşfet, kaydet ve başvurularını takip et.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery('');
                      setCategory('');
                      setLocation('');
                      setWorkplace('');
                      setLevel('');
                      setJobType('');
                      setSourceFilter('');
                      setTab('discover');
                    }}
                  >
                    Tüm fırsatları keşfet
                  </Button>
                </div>
              ) : (
                filtered.slice(0, 80).map((j) => (
                  <article className="job-card" key={j.id}>
                    <div className="job-top">
                      <span
                        className={
                          'company-logo color-' + (j.company_name.length % 4)
                        }
                      >
                        {j.company_name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="job-title">
                        <span>
                          {j.company_name} ·{' '}
                          <small>
                            {j.publication_date
                              ? new Date(j.publication_date).toLocaleDateString(
                                  'tr-TR',
                                  { day: 'numeric', month: 'short' },
                                )
                              : 'Tarih belirtilmemiş'}
                          </small>
                        </span>
                        <button onClick={() => setDetail(j)}>
                          <h3>{j.title}</h3>
                        </button>
                      </div>
                      <button
                        className={
                          'bookmark ' + (saved.includes(j.id) ? 'selected' : '')
                        }
                        aria-label={
                          saved.includes(j.id) ? 'Kaydı kaldır' : 'İlanı kaydet'
                        }
                        onClick={() => toggle(j, 'saved')}
                      >
                        <Bookmark
                          size={20}
                          fill={saved.includes(j.id) ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
                    <div className="job-meta">
                      <span>
                        <MapPin size={14} />
                        {j.candidate_required_location || 'Konum belirtilmemiş'}
                      </span>
                      <span>
                        <BriefcaseBusiness size={14} />
                        {typeLabels[j.job_type] || 'Belirtilmemiş'}
                      </span>
                      <span>
                        {workLabels[j.workplace] ||
                          'Çalışma şekli belirtilmemiş'}
                      </span>
                    </div>
                    <a
                      className="job-source"
                      href={j.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {j.source} ↗
                    </a>
                    {!j.manual &&
                      !liveAndManual.some((live) => live.id === j.id) && (
                        <p className="source-note">
                          Güncel kaynak listesinde görünmüyor. Başvuru durumunu
                          kaynaktan kontrol et.
                        </p>
                      )}
                    {j.summaryOnly && (
                      <p className="source-note">
                        {j.indexResult
                          ? 'Arama dizini özeti · güncellik ve konum doğrulanmadı'
                          : 'İlan başlığı / özeti · tam metin kaynaktadır'}
                      </p>
                    )}
                    <div className="tags">
                      {(j.tags.length ? j.tags : [j.category])
                        .slice(0, 4)
                        .map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                    </div>
                    <div className="job-bottom">
                      <span
                        className={matches(j).length ? 'match' : 'match muted'}
                      >
                        <Sparkles size={15} />
                        {skills.length
                          ? `${matches(j).length} / ${skills.length} beceri${j.summaryOnly ? ' özette eşleşiyor' : ' eşleşiyor'}`
                          : 'Eşleşmeyi görmek için CV ekle'}
                      </span>
                      <button onClick={() => setDetail(j)}>
                        İlanı incele <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </article>
                ))
              )}
              <p className="source-note">
                Platform araması erişilebilen ilk sonuç sayfalarını getirir.
                Özetlerdeki beceri eşleşmesi sınırlıdır; tam metni ve ilan
                güncelliğini kaynaktan kontrol et. Pozisyon seviyesi başlıktan
                tahmin edilir. Ek şirket akışları: Trendyol, Insider One ve
                Dream Games. Remotive, “Tüm ülkeler” seçeneğindedir ve 24 saat
                gecikmelidir.
                {filtered.length > 80
                  ? ' İlk 80 sonuç gösteriliyor. Aramayla daraltabilirsin.'
                  : ''}
              </p>
            </section>
            <aside className="right-rail">
              <section className="profile-card">
                <div className="rail-title">
                  <h2>Eşleşme profilin</h2>
                  <Sparkles size={19} />
                </div>
                <div className="profile-orbit">
                  <div>
                    <FileText size={27} />
                  </div>
                  <span className="orbit-plus">
                    {filename ? <Check size={13} /> : '+'}
                  </span>
                </div>
                <h3>
                  {filename
                    ? 'Becerilerin yol göstersin.'
                    : 'Seni biraz tanıyalım.'}
                </h3>
                <p>
                  {filename
                    ? 'İlanlar CV’ndeki becerilerle karşılaştırılır.'
                    : 'CV’ni eklediğinde sana uygun fırsatları öne çıkaracağız.'}
                </p>
                {skills.length > 0 && (
                  <div className="tags profile-tags">
                    {skills.slice(0, 6).map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                )}
                <button
                  className="rail-action"
                  onClick={() => setModal(filename ? 'profile' : 'upload')}
                >
                  {filename ? 'Profilimi düzenle' : 'Profilimi oluştur'}
                  <ChevronRight size={16} />
                </button>
                <div className="profile-steps">
                  <span className="done">
                    <Check size={12} />
                    Çalışma alanın hazır
                  </span>
                  <span className={filename ? 'done' : ''}>
                    <span className="step-circle" />
                    CV’ni ekle
                  </span>
                  <span className={skills.length ? 'done' : ''}>
                    <span className="step-circle" />
                    Sana uygun ilanları keşfet
                  </span>
                </div>
              </section>
              <section className="linkedin-card">
                <div className="linkedin-heading">
                  <span className="linkedin-logo">in</span>
                  <span>LinkedIn bağlantısı</span>
                </div>
                <h3>Aynı ilana yeniden başvurma.</h3>
                <p>
                  Başvurularını burada işaretle, aramalarında yeni fırsatlara
                  odaklan.
                </p>
                <button onClick={() => setModal('linkedin')}>
                  Bağlantı seçenekleri <ArrowUpRight size={16} />
                </button>
                <small>
                  <span />
                  Otomatik eşitleme bağlı değil
                </small>
              </section>
              <div className="quiet-note">
                <ShieldCheck size={19} />
                <p>
                  CV’nin içeriği cihazında işlenir. Profil ve başvuru
                  tercihlerin bu tarayıcıda saklanır.
                </p>
              </div>
            </aside>
          </div>
          <footer>
            <span className="footer-brand">pusula.</span>
            <span>Kariyerinin yönü sende.</span>
          </footer>
        </main>
      </div>
      <input
        ref={input}
        type="file"
        accept=".pdf,.docx,.txt"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {message && (
        <div className="toast" role="status">
          {message}
          <button aria-label="Bildirimi kapat" onClick={() => setMessage('')}>
            <X size={17} />
          </button>
        </div>
      )}
      {(modal || detail) && (
        <Dialog
          open
          onOpenChange={() => {
            setModal('');
            setDetail(null);
          }}
        >
          <DialogContent
            showCloseButton={false}
            aria-label={detail ? 'İlan detayı' : 'CV ve bağlantılar'}
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setModal('');
                setDetail(null);
              }
            }}
          >
            <DialogTitle className="sr-only">
              {detail ? 'İlan detayı' : 'CV ve bağlantılar'}
            </DialogTitle>
            <button
              autoFocus
              className="close"
              aria-label="Kapat"
              onClick={() => {
                setModal('');
                setDetail(null);
              }}
            >
              <X />
            </button>
            {detail ? (
              <>
                <span className="eyebrow">{detail.company_name}</span>
                <h2>{detail.title}</h2>
                <p>{detail.candidate_required_location}</p>
                <div className="tags">
                  {matches(detail).map((s) => (
                    <span key={s}>{s} ✓</span>
                  ))}
                </div>
                <p className="detail-copy">{detail.description}</p>
                {detail.salary && <p>Ücret: {detail.salary}</p>}
                <div className="modal-actions">
                  <a
                    className="primary-link"
                    href={detail.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    İlanın kaynağında başvur <ArrowUpRight size={16} />
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => toggle(detail, 'applied')}
                  >
                    {applied.includes(detail.id)
                      ? 'Başvuru işaretini kaldır'
                      : 'Başvurdum olarak işaretle'}
                  </Button>
                </div>
                <small>
                  Başvurunu tamamladığında işaretle. İlanı açmak başvuru olarak
                  kaydedilmez.
                </small>
              </>
            ) : modal === 'linkedin' ? (
              <>
                <span className="linkedin-logo">in</span>
                <h2>LinkedIn ve başvuruların</h2>
                <p>
                  LinkedIn ile standart giriş, başvurduğun ilanların geçmişine
                  erişim sağlamaz. Bu sürümde hesabınla otomatik eşitleme
                  bulunmuyor.
                </p>
                <p>
                  İlan detayındaki “Başvurdum olarak işaretle” seçeneğiyle,
                  tamamladığın başvuruları keşfet listesinden gizleyebilirsin.
                </p>
                <a
                  className="primary-link"
                  href={
                    'https://www.linkedin.com/jobs/search/?keywords=' +
                    encodeURIComponent(query || skills.slice(0, 2).join(' '))
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn’de iş ara <ArrowUpRight size={17} />
                </a>
                <p className="source-note">
                  LinkedIn sonuçları uygulamaya aktarılmaz.
                </p>
              </>
            ) : modal === 'profile' ? (
              <>
                <h2>CV ve profilim</h2>
                <p>{filename || 'Henüz CV eklemedin.'}</p>
                <label className="field-label">
                  Becerilerin (virgülle ayır)
                  <textarea
                    defaultValue={skills.join(', ')}
                    id="skill-editor"
                    placeholder="Örn. Python, Excel, SQL"
                  />
                </label>
                <Button
                  className="primary-button"
                  onClick={() => {
                    const v = (
                      document.getElementById(
                        'skill-editor',
                      ) as HTMLTextAreaElement
                    ).value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 40);
                    setSkills(v);
                    if (analysis) {
                      const updated = { ...analysis, skills: v };
                      setAnalysis(updated);
                      try { localStorage.setItem('pusula-cv-analysis', JSON.stringify({ ...updated, filename })); } catch {}
                    }
                    persist(saved, applied, v);
                    setModal('');
                  }}
                >
                  Becerileri kaydet
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSkills([]);
                    setFilename('');
                    setAnalysis(null);
                    try { localStorage.removeItem('pusula-cv-analysis'); } catch {}
                    persist(saved, applied, [], '');
                    setModal('');
                  }}
                >
                  CV profilini kaldır
                </Button>
                <p className="source-note">
                  Eşleşme, beceri sözcüklerinin ilanda bulunmasına dayanır; işe
                  kabul olasılığı değildir.
                </p>
              </>
            ) : (
              <>
                <span className="square-icon">
                  <Upload />
                </span>
                <h2>Bir sonraki adım, CV’n.</h2>
                <p>Becerilerini çıkaralım, sana uygun ilanları öne alalım.</p>
                {cvError && <p className="cv-upload-error" role="alert">{cvError}</p>}
                {busy && <p role="status">CV metni okunuyor ve beceriler çıkarılıyor…</p>}
                <button
                  className="dropzone"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!busy) upload(e.dataTransfer.files[0]);
                  }}
                >
                  <Upload size={30} />
                  <strong>
                    {busy ? 'CV’n okunuyor…' : 'Dosyanı sürükle veya seç'}
                  </strong>
                  <span>PDF, DOCX, TXT · En fazla 10 MB</span>
                </button>
                <label className="field-label">
                  Ya da CV metnini yapıştır
                  <textarea
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    placeholder="Deneyimlerini ve becerilerini buraya yapıştır…"
                  />
                </label>
                <Button
                  className="primary-button"
                  disabled={busy || !cvText.trim()}
                  onClick={() => {
                    try {
                      analyze(cvText, 'Yapıştırılan CV');
                    } catch (e) {
                      setCvError((e as Error).message);
                    }
                  }}
                >
                  CV’mi analiz et <Sparkles size={16} />
                </Button>
                <p className="source-note">
                  Dosya saklanmaz. PDF’lerde ilk 30 sayfa okunur; taranmış
                  görseller desteklenmez.
                </p>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
