import { normalizeText } from './turkey';
export const skillGroups: string[][] = [
  ['Satış', 'Sales'],
  ['Pazarlama', 'Marketing'],
  ['Dijital pazarlama', 'Digital Marketing'],
  ['Muhasebe', 'Accounting'],
  ['Finans', 'Finance'],
  ['İnsan kaynakları', 'Human Resources'],
  ['İşe alım', 'Recruitment', 'Recruiting'],
  ['Müşteri hizmetleri', 'Customer Support', 'Customer Service'],
  ['Proje yönetimi', 'Project Management'],
  ['Ürün yönetimi', 'Product Management'],
  ['Veri analizi', 'Data Analysis', 'Data Analytics'],
  ['Makine öğrenmesi', 'Machine Learning'],
  ['Yapay zeka', 'Artificial Intelligence'],
  ['Yazılım geliştirme', 'Software Development'],
  ['Tedarik zinciri', 'Supply Chain'],
  ['Lojistik', 'Logistics'],
  ['Satın alma', 'Purchasing', 'Procurement'],
  ['Üretim', 'Manufacturing', 'Production'],
  ['Kalite kontrol', 'Quality Control'],
  ['İş analizi', 'Business Analysis'],
  ['İş geliştirme', 'Business Development'],
  ['Grafik tasarım', 'Graphic Design'],
  ['İçerik üretimi', 'Content Creation'],
  ['Sosyal medya', 'Social Media'],
  ['İngilizce', 'English'],
  ['Almanca', 'German'],
  ['Fransızca', 'French'],
  ['E-ticaret', 'Ecommerce', 'E-commerce'],
  ['Excel', 'Microsoft Excel', 'MS Excel'],
  ['SAP'],
  ['Logo Tiger', 'Logo ERP'],
  ['Mikro ERP'],
  ['AutoCAD'],
  ['SolidWorks'],
  ['React'],
  ['JavaScript'],
  ['TypeScript'],
  ['Python'],
  ['SQL'],
  ['Java'],
  ['C#'],
  ['C++'],
  ['Figma'],
  ['UX'],
  ['UI'],
  ['CSS'],
  ['HTML'],
  ['Node.js', 'NodeJS'],
  ['Next.js'],
  ['AWS'],
  ['Docker'],
  ['Power BI'],
  ['Tableau'],
  ['SEO'],
  ['Kubernetes'],
  ['Git'],
  ['Agile', 'Çevik'],
  ['Scrum'],
  ['.NET'],
  ['Unity'],
  ['NestJS', 'Nest.js'],
  ['Vue.js', 'VueJS', 'Vue'],
  ['PostgreSQL', 'Postgres'],
  ['MongoDB'],
  ['Tailwind CSS', 'Tailwind'],
  ['REST API', 'RESTful'],
  ['SignalR'],
  ['WebSocket', 'WebSockets'],
  ['MQTT'],
  ['Jest'],
  ['Playwright'],
  ['Cloudflare'],
  ['CI/CD', 'GitHub Actions', 'Azure Pipelines'],
  ['React Native'],
  ['Flutter'],
  ['Redis'],
];
function exactSkill(text: string, skill: string) {
  const escaped = normalizeText(skill.trim()).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
  return (
    Boolean(escaped) &&
    new RegExp(
      '(^|[^\\p{L}\\p{N}])' + escaped + '(?=$|[^\\p{L}\\p{N}])',
      'iu',
    ).test(normalizeText(text))
  );
}
export function containsSkill(text: string, skill: string) {
  const group = skillGroups.find((g) =>
    g.some((s) => normalizeText(s) === normalizeText(skill)),
  );
  return (group || [skill]).some((s) => exactSkill(text, s));
}
export function extractSkills(text: string) {
  return skillGroups
    .filter((g) => g.some((s) => exactSkill(text, s)))
    .map((g) => g[0]);
}
