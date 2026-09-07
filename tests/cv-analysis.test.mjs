import './platforms.test.mjs';
import assert from 'node:assert/strict';
const { analyzeCv } = await import('../lib/cv-analysis.ts');
const cv = `SENIOR SOFTWARE ENGINEER FRONTEND & FULL-STACK ENGINEERING
5+ yıllık profesyonel deneyime sahip. React, Next.js, TypeScript, NestJS,
PostgreSQL, Vue.js ve Playwright kullanarak satış ve muhasebe modülleri geliştirdim.
${'Proje açıklaması. '.repeat(100)} Önceki görev: İnşaat Mühendisi.`;
const a = analyzeCv(cv, 2);
assert.equal(a.roles[0].title, 'Software Engineer');
assert(a.roles.some(r => r.title === 'Frontend Developer'));
assert(a.roles.some(r => r.title === 'Full Stack Developer'));
assert(!a.roles.some(r => r.title === 'İnşaat Mühendisi'));
assert(a.skills.includes('Next.js') && a.skills.includes('NestJS') && a.skills.includes('PostgreSQL'));
assert(!a.skills.includes('Muhasebe') && !a.skills.includes('Satış'));
assert(a.otherMentions.includes('Muhasebe'));
assert.equal(a.experienceStatement, '5+ yıllık profesyonel deneyim');
assert.equal(a.pages, 2);
assert.throws(() => analyzeCv('  '), /yeterli metin/);
const accountant = analyzeCv('Muhasebe Uzmanı. Excel ve SAP ile muhasebe süreçleri ve finans raporları hazırladım.');
assert.equal(accountant.roles[0].title, 'Muhasebe Uzmanı');
assert(accountant.skills.includes('Muhasebe'));
const unknown = analyzeCv('Birçok farklı şirkette çeşitli görevlerde çalıştım ve yeni bir iş arıyorum.');
assert.equal(unknown.roles.length, 0);
assert.equal(unknown.experienceStatement, '');
assert.equal(analyzeCv(cv, 31).limited, true);
console.log('PASS: headline priority, frontend/full-stack titles, sector-vs-skill separation, nontechnical CV, explicit experience, empty text, page limit.');
