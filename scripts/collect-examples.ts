import { writeFile } from 'node:fs/promises';
import { fetchCompany } from '../src/server/provider';
import { createSnapshot } from '../src/server/snapshot-engine';
import type { CompanyRecord } from '../src/lib/company';
const records: CompanyRecord[] = [];
for (const cnpj of ['19131243000197', '00000000000191', '47960950000121']) {
  const { company, source } = await fetchCompany(cnpj);
  records.push({
    company,
    snapshots: [createSnapshot(company, source)],
    changes: [],
    observedActivities: [],
  });
  console.log(
    JSON.stringify({ cnpj, legalName: company.legalName, collectedAt: source.retrievedAt }),
  );
}
await writeFile(
  new URL('../data/companies.json', import.meta.url),
  JSON.stringify(records, null, 2) + '\n',
);
