import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { observedActivitySchema } from '../src/lib/company';
import { getRecord, saveActivities } from '../src/server/repository';
import { isValidCnpj } from '../src/lib/cnpj';
const file = process.argv[2];
if (!file)
  throw new Error('Usage: npm run enrich:activities -- /absolute/path/to/reviewed-activities.json');
const input = z
  .object({
    cnpj: z.string().refine(isValidCnpj),
    activities: z.array(observedActivitySchema).max(50),
  })
  .parse(JSON.parse(await readFile(file, 'utf8')));
const record = await getRecord(input.cnpj);
if (!record) throw new Error('COMPANY_NOT_IN_REPOSITORY');
for (const activity of input.activities) {
  if (!activity.id.startsWith(`${input.cnpj}:`)) throw new Error('ACTIVITY_ID_MUST_INCLUDE_CNPJ');
  if (
    activity.classificationStatus === 'COMPATIBLE' &&
    !activity.possibleCnaes.some((code) =>
      record.company.declaredActivities.some((a) => a.code === code),
    )
  )
    throw new Error('CNAE_COMPATIBILITY_NOT_VERIFIED');
}
await saveActivities(input.cnpj, input.activities);
console.log(
  JSON.stringify({ companyId: input.cnpj, activities: input.activities.length, status: 'saved' }),
);
