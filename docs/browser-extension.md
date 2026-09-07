# Tarayıcı araması

Masaüstü Chrome/Edge Manifest V3 eklentisi. Pusula'da seçilen en fazla altı platform yeni arka plan sekmelerinde açılır. Kullanıcı oturumu tarayıcıda kalır. Sonuç sayfalarındaki ilan kartları yerel olarak ayrıştırılır; CV, çerez, parola veya sayfanın tam HTML'i uygulamaya gönderilmez. API aboneliği gerekmez.

`node scripts/build-extension.mjs` kaynakları `outputs/pusula-extension` içine paketler. Bu klasörün içeriği `public/pusula-extension.zip` olarak sıkıştırılır. Uygulamanın kurulum bölümü paketi indirir ve paketlenmemiş eklenti kurulumunu açıklar. Mağazada yayımlanmamıştır; kurulum kullanıcı tarafından yapılır.

Eklenti yalnızca canlı Pusula origin'inden başlatılır; localhost yetkisi içermez. Kaynak sekme kimliği, platform domain'i ve arama kimliği doğrulanır. Sonuçlar tekrar URL izin listesi üzerinden temizlenir. Arama kayıtları chrome.storage.session içindedir; bir saatten sonra kabul edilmez, Pusula sekmesi kapanınca veya Durdur'a basılınca silinir. Sonuç sekmeleri kullanıcıya aittir ve otomatik kapatılmaz.

LinkedIn oturumlu kartları, Indeed kartları ve mevcut dört kaynak ayrıştırıcısı desteklenir; platform tasarımları değişebilir. Yenibiriş için doğrulanmış arama URL parametresi olmadığından kullanıcı kelimeyi sitede girer. CAPTCHA/giriş durumunda otomasyon atlatma denemez. Kullanıcı tamamladıktan sonra eklenti menüsünden yeniden aktarır. Arka planda yüklenmeyen sitelerde sekmeyi öne almak gerekebilir. Tam sayfalama ve geçmiş başvurular kapsam dışıdır.

Doğrulama: mevcut platform ayrıştırıcı testleri ve extension.test.mjs; sahte Chrome API ile sekme yetkisi, eşzamanlı sonuç, iptal ve kötü URL denetimleri. Gerçek kullanıcı eklenti oturumu ve altı platformun oturumlu güncel ekranları uçtan uca doğrulanmış değildir.
