import { readFile, writeFile } from 'node:fs/promises';
import { fetchCompany } from '../src/server/provider';
import { createSnapshot } from '../src/server/snapshot-engine';
import type { CompanyRecord } from '../src/lib/company';
import { isValidCnpj, normalizeCnpj } from '../src/lib/cnpj';
const cnpj = normalizeCnpj(process.argv[2] ?? '');
if (process.argv.length !== 3 || !isValidCnpj(cnpj))
  throw new Error(
    'Provide exactly one valid CNPJ: npm run collect:examples -- <cnpj>. Bulk collection is disabled.',
  );
const records: CompanyRecord[] = JSON.parse(
  await readFile(new URL('../data/companies.json', import.meta.url), 'utf8'),
);
if (records.some((record) => record.company.cnpj === cnpj)) {
  console.log('Example already cached; no provider request made.');
} else {
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
