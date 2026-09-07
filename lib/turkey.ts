export const cities = [
  'Adana',
  'Adıyaman',
  'Afyonkarahisar',
  'Ağrı',
  'Aksaray',
  'Amasya',
  'Ankara',
  'Antalya',
  'Ardahan',
  'Artvin',
  'Aydın',
  'Balıkesir',
  'Bartın',
  'Batman',
  'Bayburt',
  'Bilecik',
  'Bingöl',
  'Bitlis',
  'Bolu',
  'Burdur',
  'Bursa',
  'Çanakkale',
  'Çankırı',
  'Çorum',
  'Denizli',
  'Diyarbakır',
  'Düzce',
  'Edirne',
  'Elazığ',
  'Erzincan',
  'Erzurum',
  'Eskişehir',
  'Gaziantep',
  'Giresun',
  'Gümüşhane',
  'Hakkari',
  'Hatay',
  'Iğdır',
  'Isparta',
  'İstanbul',
  'İzmir',
  'Kahramanmaraş',
  'Karabük',
  'Karaman',
  'Kars',
  'Kastamonu',
  'Kayseri',
  'Kırıkkale',
  'Kırklareli',
  'Kırşehir',
  'Kilis',
  'Kocaeli',
  'Konya',
  'Kütahya',
  'Malatya',
  'Manisa',
  'Mardin',
  'Mersin',
  'Muğla',
  'Muş',
  'Nevşehir',
  'Niğde',
  'Ordu',
  'Osmaniye',
  'Rize',
  'Sakarya',
  'Samsun',
  'Siirt',
  'Sinop',
  'Sivas',
  'Şanlıurfa',
  'Şırnak',
  'Tekirdağ',
  'Tokat',
  'Trabzon',
  'Tunceli',
  'Uşak',
  'Van',
  'Yalova',
  'Yozgat',
  'Zonguldak',
];
export function normalizeText(s: string) {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
export const workLabels: Record<string, string> = {
  onsite: 'İş yerinde',
  hybrid: 'Hibrit',
  remote: 'Uzaktan',
  unknown: 'Belirtilmemiş',
};
export const typeLabels: Record<string, string> = {
  full_time: 'Tam zamanlı',
  part_time: 'Yarı zamanlı',
  internship: 'Staj',
  contract: 'Sözleşmeli',
  freelance: 'Serbest çalışma',
  unknown: 'Belirtilmemiş',
};
export const levelLabels: Record<string, string> = {
  intern: 'Stajyer',
  junior: 'Yeni mezun / başlangıç',
  senior: 'Kıdemli',
  lead: 'Yönetici / lider',
  unknown: 'Belirtilmemiş',
};
export function inferLevel(title: string) {
  const t = normalizeText(title);
  if (/\b(intern(ship)?|stajyer|staj)\b/.test(t)) return 'intern';
  if (
    /\b(new grad(uate)?|graduate|junior|entry.level|yeni mezun|yetistirilmek)\b/.test(
      t,
    )
  )
    return 'junior';
  if (/\b(senior|kidemli|sr\.)/.test(t)) return 'senior';
  if (/\b(lead|manager|director|head|yonetici|mudur|lideri)\b/.test(t))
    return 'lead';
  return 'unknown';
}
export const portals = [
  {
    name: 'Kariyer.net',
    url: 'https://www.kariyer.net/is-ilanlari',
    host: 'kariyer.net',
  },
  {
    name: 'Yenibiriş',
    url: 'https://www.yenibiris.com/is-ilanlari',
    host: 'yenibiris.com',
  },
  { name: 'Secretcv', url: 'https://www.secretcv.com/', host: 'secretcv.com' },
  {
    name: 'İŞKUR',
    url: 'https://acikisharita.iskur.gov.tr/',
    host: 'iskur.gov.tr',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/',
    host: 'linkedin.com',
  },
];
export function portalForUrl(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    return (
      portals.find(
        (p) => u.hostname === p.host || u.hostname.endsWith('.' + p.host),
      ) || null
    );
  } catch {
    return null;
  }
}
export function canonicalJobUrl(value: string) {
  const u = new URL(value);
  u.hash = '';
  for (const key of [...u.searchParams.keys()])
    if (/^(utm_|trk$|trackingId$|ref$|source$)/i.test(key))
      u.searchParams.delete(key);
  u.searchParams.sort();
  u.pathname = u.pathname.replace(/\/$/, '');
  return u.toString();
}
