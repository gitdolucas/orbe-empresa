import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { CompanyRecord, ObservedActivity } from '../src/lib/company';
const servicesUrl = 'https://ok.org.br/eixos-de-atuacao/prestacao-de-servicos/';
const associationUrl = 'https://ok.org.br/apoie/';
async function getText(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('EVIDENCE_SOURCE_UNAVAILABLE');
  return (await response.text())
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const [services, association] = await Promise.all([getText(servicesUrl), getText(associationUrl)]);
if (!association.includes('19.131.243/0001-97') || !association.includes('Open Knowledge Brasil'))
  throw new Error('SOURCE_IDENTITY_NOT_VERIFIED');
const now = new Date().toISOString();
const definitions = [
  {
    activityCode: 'data-consulting',
    activityName: 'Consultoria e infraestrutura de dados',
    category: 'Tecnologia e dados',
    possibleCnaes: ['6204000'],
    excerpt: 'Automação de pipelines e processos de ETL',
  },
  {
    activityCode: 'data-education',
    activityName: 'Capacitação em dados',
    category: 'Educação e capacitação',
    possibleCnaes: ['8599699'],
    excerpt: 'Cursos sob demanda, customizados para a necessidade de sua organização',
  },
];
const activities: ObservedActivity[] = definitions.map((item) => {
  if (!services.includes(item.excerpt)) throw new Error(`EVIDENCE_NOT_FOUND: ${item.activityCode}`);
  const { excerpt, ...definition } = item;
  return {
    ...definition,
    id: `19131243000197:${item.activityCode}`,
    confidenceLevel: 'MEDIUM',
    classificationStatus: 'COMPATIBLE',
    modelVersion: 'curated-taxonomy-v1',
    reviewedBy: 'Revisão assistida de fonte pública; validação humana pendente',
    analyzedAt: now,
    evidence: [
      {
        sourceUrl: servicesUrl,
        sourceType: 'OFFICIAL_WEBSITE',
        excerpt,
        collectedAt: now,
        contentHash: createHash('sha256').update(excerpt).digest('hex'),
        association: `Domínio associado ao CNPJ pela página ${associationUrl}, que publica razão social Open Knowledge Brasil e CNPJ 19.131.243/0001-97.`,
      },
    ],
  };
});
const file = new URL('../data/companies.json', import.meta.url);
const records = JSON.parse(await readFile(file, 'utf8')) as CompanyRecord[];
const record = records.find((r) => r.company.cnpj === '19131243000197');
if (!record) throw new Error('COLLECT_EXAMPLES_FIRST');
for (const activity of activities)
  if (
    !activity.possibleCnaes.some((code) =>
      record.company.declaredActivities.some((a) => a.code === code),
    )
  )
    throw new Error('CNAE_COMPATIBILITY_NOT_VERIFIED');
record.observedActivities = activities;
await writeFile(file, JSON.stringify(records, null, 2) + '\n');
console.log(
  JSON.stringify({
    cnpj: record.company.cnpj,
    activities: activities.length,
    collectedAt: now,
    method: 'curated-taxonomy-v1',
    humanValidation: 'pending',
  }),
);
