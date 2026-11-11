import { createHash } from 'node:crypto';
import {
  companySchema,
  sourceSchema,
  type Company,
  type Source,
  type Snapshot,
  type Change,
  type CompanyRecord,
} from '@/lib/company';
import { isValidCnpj } from '@/lib/cnpj';

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${canonicalJson(val)}`)
    .join(',')}}`;
}
export function hash(value: unknown) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}
export function normalizeCompany(input: Company): Company {
  const company = companySchema.parse(input);
  if (!isValidCnpj(company.cnpj) || company.rootCnpj !== company.cnpj.slice(0, 8))
    throw new Error('INVALID_COMPANY_IDENTITY');
  const primary = company.declaredActivities.filter((a) => a.primary);
  if (primary.length !== 1) throw new Error('ONE_PRIMARY_ACTIVITY_REQUIRED');
  return {
    ...company,
    declaredActivities: [
      ...new Map(company.declaredActivities.map((a) => [`${a.code}:${a.primary}`, a])).values(),
    ].sort((a, b) => Number(b.primary) - Number(a.primary) || a.code.localeCompare(b.code)),
  };
}
export function createSnapshot(input: Company, inputSource: Source): Snapshot {
  const data = normalizeCompany(input);
  const source = sourceSchema.parse(inputSource);
  const contentHash = hash(data);
  return {
    id: hash([data.cnpj, source.id, source.datasetPeriod ?? source.referenceDate, contentHash]),
    companyId: data.cnpj,
    source,
    data,
    contentHash,
    schemaVersion: 1,
    ingestedAt: new Date().toISOString(),
  };
}
const fields = [
  ['registrationStatus', 'company.status.changed'],
  ['address', 'company.address.changed'],
  ['primaryActivity', 'company.primary_activity.changed'],
  ['secondaryActivities', 'company.secondary_activities.changed'],
  ['tradeName', 'company.trade_name.changed'],
] as const;
function fieldValue(company: Company, field: string): unknown {
  if (field === 'primaryActivity') return company.declaredActivities.find((a) => a.primary);
  if (field === 'secondaryActivities') return company.declaredActivities.filter((a) => !a.primary);
  return company[field as keyof Company];
}
export function compareSnapshots(previous: Snapshot, current: Snapshot): Change[] {
  if (previous.companyId !== current.companyId) throw new Error('SNAPSHOT_ENTITY_MISMATCH');
  if (
    previous.source.kind !== 'OFFICIAL_DATASET' ||
    current.source.kind !== 'OFFICIAL_DATASET' ||
    previous.source.id !== current.source.id
  )
    return [];
  if (previous.source.datasetPeriod! >= current.source.datasetPeriod!)
    throw new Error('SNAPSHOT_ORDER_INVALID');
  return fields.flatMap(([field, eventType]) => {
    const previousValue = fieldValue(previous.data, field),
      currentValue = fieldValue(current.data, field);
    return canonicalJson(previousValue) === canonicalJson(currentValue)
      ? []
      : [
          {
            id: hash([previous.id, current.id, eventType]),
            companyId: current.companyId,
            previousSnapshotId: previous.id,
            currentSnapshotId: current.id,
            field,
            eventType,
            previousValue,
            currentValue,
            detectedAt: current.ingestedAt,
          },
        ];
  });
}
export function appendSnapshot(record: CompanyRecord | null, snapshot: Snapshot): CompanyRecord {
  if (record?.snapshots.some((s) => s.id === snapshot.id)) return record;
  const snapshots = record?.snapshots ?? [];
  const sameRelease = snapshots.find(
    (s) =>
      s.source.id === snapshot.source.id &&
      (s.source.datasetPeriod ?? s.source.referenceDate) ===
        (snapshot.source.datasetPeriod ?? snapshot.source.referenceDate),
  );
  if (sameRelease) throw new Error('IMMUTABLE_SNAPSHOT_CONFLICT');
  const previous = [...snapshots]
    .reverse()
    .find((s) => s.source.id === snapshot.source.id && s.source.kind === snapshot.source.kind);
  if (previous && previous.source.referenceDate >= snapshot.source.referenceDate)
    throw new Error('SNAPSHOT_ORDER_INVALID');
  const changes = previous ? compareSnapshots(previous, snapshot) : [];
  const ordered = [...snapshots, snapshot].sort((a, b) =>
    a.source.referenceDate.localeCompare(b.source.referenceDate),
  );
  return {
    company: ordered.at(-1)!.data,
    snapshots: ordered,
    changes: [...(record?.changes ?? []), ...changes],
    observedActivities: record?.observedActivities ?? [],
  };
}
