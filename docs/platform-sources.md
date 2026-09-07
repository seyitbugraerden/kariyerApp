# Türkiye platform araması

Altı adaptör: LinkedIn, Indeed, Kariyer.net, İşin Olsun, Yenibiriş, Eleman.net.

Arama kullanıcı tarafından başlatılır. CV dosyası gönderilmez; yalnızca arama metni, kaynak seçimi ve il gönderilir. Sunucu, sabit izinli alan adlarındaki herkese açık arama sayfalarını okur; HTML veya sayfa betikleri çalıştırılmaz. Giriş yapılmaz, hesap çerezleri alınmaz, CAPTCHA aşılmaz. En fazla ilk 40 kayıt/kaynak döner. Sonuçlar başlık/özet olduğu için tam metin eşleşmesi olarak sunulmaz.

2026-09-07 doğrulaması: Node ortamından LinkedIn, Kariyer.net, İşin Olsun ve Eleman.net arama sayfaları okunabildi. Worker geliştirme ortamındaki `muhasebe` aramasında İşin Olsun 40, Eleman.net 34 kayıt döndürdü; diğer dört kaynak erişimi engelledi. Erişim kalıcı garanti değildir. Boş sonuç, erişim engeli ve servis hatası ayrı gösterilir. Sayfa yapısı değişirse adaptör güncellemesi gerekir. Başvuru geçmişi otomatik eşitlenmez.

## Engellenen kaynaklar için isteğe bağlı arama dizini

`BRAVE_SEARCH_API_KEY` yalnızca sunucuda okunur. Yerel kullanımda `.env` içine, barındırılan sürümde Sites ortam değişkenlerine gizli değer olarak eklenir ve yeni sürüm yayınlanır. API anahtarı istemciye, depoya veya tarayıcı depolamasına konulmaz. Uygulama abonelik açmaz; herhangi bir ücretli plan satın almaz. Anahtar yokken doğrudan okuma sürer ve erişilemeyen kaynaklar açıkça gösterilir.

Brave bağlantısı, engellenen sitenin indekslenmiş ilan bağlantılarını arar. İlanların güncelliği, konumu ve tüm platform kapsamı garanti edilmez. Sonuçlar "dizin özeti" olarak etiketlenir. Anahtar verilmediği için bu yol yalnızca sahte HTTP yanıtlarıyla sözleşme testinden geçirilmiştir; canlı doğrulanmamıştır. Kaynakta olmayan alanlar uydurulmaz.

Kaynaklar:
- [Indeed resmi entegrasyon dokümanları](https://docs.indeed.com/)
- [LinkedIn Talent Solutions](https://learn.microsoft.com/en-us/linkedin/talent/)
- [Brave Web Search API](https://api-dashboard.search.brave.com/app/documentation/web-search/get-started)
- [Kariyer.net](https://www.kariyer.net/is-ilanlari)
- [İşin Olsun](https://isinolsun.com/is-ilanlari)
- [Eleman.net](https://www.eleman.net/is-ilanlari)
- [Yenibiriş](https://www.yenibiris.com/is-ilanlari)
