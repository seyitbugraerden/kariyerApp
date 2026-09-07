'use client';
import type { CvAnalysis } from '@/lib/cv-analysis';
import { Button } from '@/components/ui/button';
export default function CvReport({ analysis, filename, onSearch, onUpload }: {
  analysis: CvAnalysis | null; filename: string; onSearch: (q: string) => void; onUpload: () => void;
}) {
  if (!filename) return null;
  return <section className="cv-report" aria-label="CV analiz sonucu">
    <h2>{analysis ? 'CV analiz sonucu' : 'Önceki CV profilin kayıtlı'}</h2>
    <p>{filename}</p>
    {!analysis ? <><p>Ayrıntılı analiz özeti için CV’ni bir kez yeniden yükle. Önceki sürüm yalnızca becerileri sakladığı için dosyanı yeniden okuyamıyoruz.</p><Button onClick={onUpload}>CV’mi yeniden analiz et</Button></> : <>
      <p className="cv-read-success">Metin okundu · {analysis.pages ? `${Math.min(analysis.pages, 30)} sayfa · ` : ''}{analysis.characters.toLocaleString('tr-TR')} karakter</p>
      {analysis.limited && <p>İlk 30 sayfa analiz edildi; kalan sayfalar değerlendirilmedi.</p>}
      <h3>CV’deki unvanlara göre aramalar</h3>
      {analysis.roles.length ? <div className="cv-role-list">{analysis.roles.map(r => <div key={r.title}><Button variant="outline" onClick={() => onSearch(r.title)}>{r.title} ile ara</Button><small>CV’de geçen ifade: “{r.evidence}”</small></div>)}</div> : <p>Belirgin bir pozisyon unvanı bulunamadı. Arama kutusuna hedef pozisyonunu yazabilirsin.</p>}
      {analysis.experienceStatement && <p><strong>CV’deki deneyim beyanı:</strong> {analysis.experienceStatement}. İş tarihleri toplanarak doğrulanmadı.</p>}
      <h3>Aramada kullanılacak beceriler ({analysis.skills.length})</h3>
      {analysis.skills.length ? <div className="cv-skill-list">{analysis.skills.map(s => <button key={s} onClick={() => onSearch(s)}>{s}</button>)}</div> : <p>Tanımlı becerilerle eşleşme bulunamadı. “CV ve profilim” bölümünden becerilerini ekleyebilirsin.</p>}
      {analysis.otherMentions.length > 0 && <details><summary>Diğer sözcükler ve alanlar ({analysis.otherMentions.length})</summary><p>{analysis.otherMentions.join(', ')}</p><p>Bunlar proje, sektör veya önceki iş bağlamında geçebilir; ana arama becerilerine eklenmedi.</p></details>}
      <p className="cv-analysis-note">Bu özet CV’deki unvan ve beceri ifadelerine dayanır; yapay zekâ kariyer değerlendirmesi değildir. Bir aramaya tıklayınca aşağıdaki platform bağlantıları güncellenir.</p>
    </>}
  </section>;
}
