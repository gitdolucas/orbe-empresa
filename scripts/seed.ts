import seeds from '../data/companies.json' with { type: 'json' };
import type { CompanyRecord } from '../src/lib/company';
import { saveSnapshot, saveActivities } from '../src/server/repository';
for (const record of seeds as CompanyRecord[]) {
  for (const snapshot of record.snapshots) await saveSnapshot(snapshot);
  await saveActivities(record.company.cnpj, record.observedActivities);
  console.log(JSON.stringify({ cnpj: record.company.cnpj, status: 'seeded' }));
}
process.exit(0);
