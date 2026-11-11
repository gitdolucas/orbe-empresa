import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { companySchema, sourceSchema } from '../src/lib/company';
import { createSnapshot } from '../src/server/snapshot-engine';
import { saveSnapshot } from '../src/server/repository';
const file = process.argv[2];
if (!file)
  throw new Error('Usage: npm run import:companies -- /absolute/path/to/normalized-dataset.json');
const batch = z
  .array(z.object({ company: companySchema, source: sourceSchema }))
  .min(1)
  .max(1000)
  .parse(JSON.parse(await readFile(file, 'utf8')));
// Validate the entire input before writing the first row. Each entity commits atomically.
const snapshots = batch
  .map(({ company, source }) => createSnapshot(company, source))
  .sort((a, b) => a.source.referenceDate.localeCompare(b.source.referenceDate));
for (const snapshot of snapshots) {
  await saveSnapshot(snapshot);
  console.log(
    JSON.stringify({
      companyId: snapshot.companyId,
      snapshotId: snapshot.id,
      datasetPeriod: snapshot.source.datasetPeriod,
      status: 'imported_or_existing',
    }),
  );
}
