import { extractSkills, containsSkill } from './matching';

export type CvAnalysis = {
  version: 1; characters: number; pages?: number; limited: boolean;
  roles: { title: string; evidence: string }[];
  skills: string[]; otherMentions: string[]; experienceStatement: string;
};
const roles: [string, RegExp][] = [
  ['Frontend Developer', /(?:senior\s+|junior\s+|jr\.?\s+)?front[ -]?end(?:\s*&\s*full[ -]?stack)?\s+(?:developer|engineering|engineer|geliştirici)/i],
  ['Full Stack Developer', /full[ -]?stack\s+(?:developer|engineering|engineer|geliştirici|geliştirme)/i],
  ['Software Engineer', /(?:senior\s+|junior\s+)?(?:software\s+(?:engineer|developer)|yazılım\s+(?:mühendisi|geliştirici|uzmanı))/i],
  ['Backend Developer', /back[ -]?end\s+(?:developer|engineer|geliştirici)/i],
  ['Data Analyst', /data\s+analyst|veri\s+analisti/i],
  ['Muhasebe Uzmanı', /muhasebe\s+(?:uzmanı|sorumlusu|elemanı)|accountant|accounting\s+specialist/i],
  ['Satış Uzmanı', /satış\s+(?:uzmanı|temsilcisi|yöneticisi)|sales\s+(?:specialist|representative|manager)/i],
  ['Pazarlama Uzmanı', /pazarlama\s+(?:uzmanı|yöneticisi)|marketing\s+(?:specialist|manager)/i],
  ['İnsan Kaynakları Uzmanı', /insan\s+kaynakları\s+(?:uzmanı|yöneticisi)|human\s+resources\s+(?:specialist|manager)/i],
  ['İnşaat Mühendisi', /inşaat\s+mühendisi|civil\s+engineer/i],
];
const technical = ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'NestJS', 'Vue.js', 'C#', '.NET', 'PostgreSQL', 'SQL', 'MongoDB', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'Tailwind CSS', 'REST API', 'SignalR', 'WebSocket', 'MQTT', 'Jest', 'Playwright', 'Git', 'AWS', 'Docker', 'Cloudflare', 'CI/CD', 'React Native', 'Flutter', 'Redis', 'Kubernetes', 'Figma', 'UX', 'UI', 'Scrum', 'Agile'];

export function analyzeCv(text: string, pages?: number): CvAnalysis {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length < 40) throw Error('CV’den yeterli metin okunamadı. PDF bir tarama/görsel olabilir. Metin içeren PDF veya DOCX yükle; ya da CV metnini aşağıya yapıştır.');
  const matches = roles.flatMap(([title, pattern]) => {
    const match = pattern.exec(clean);
    return match ? [{ title, evidence: match[0], position: match.index }] : [];
  });
  // Lead with the headline/summary, not a distant earlier occupation.
  const leading = matches.filter(r => r.position < 1200);
  const selected = (leading.length ? leading : matches).sort((a, b) => a.position - b.position).slice(0, 4);
  const software = selected.some(r => ['Frontend Developer', 'Full Stack Developer', 'Software Engineer', 'Backend Developer'].includes(r.title));
  const all = extractSkills(clean);
  const tech = technical.filter(s => containsSkill(clean, s));
  const skills = software ? tech : all;
  const experience = /\b\d{1,2}\+?\s*(?:yıllık|yıl|years?)(?:\s+(?:of|profesyonel|professional))?\s+(?:deneyim|experience)/i.exec(clean);
  return { version: 1, characters: clean.length, pages, limited: Boolean(pages && pages > 30),
    roles: selected.map(({ title, evidence }) => ({ title, evidence })), skills,
    otherMentions: all.filter(s => !skills.includes(s)),
    experienceStatement: experience?.[0] || '',
  };
}
