import { z } from 'zod';

export const activitySchema = z.object({
  code: z.string().regex(/^\d{7}$/),
  name: z.string().min(1),
  primary: z.boolean(),
});
export const companySchema = z.object({
  cnpj: z.string().length(14),
  rootCnpj: z.string().length(8),
  legalName: z.string().min(1),
  tradeName: z.string().nullable(),
  registrationStatus: z.string(),
  openedAt: z.string().nullable(),
  establishmentType: z.enum(['HEADQUARTERS', 'BRANCH']),
  legalNature: z.string().nullable(),
  address: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().nullable(),
    district: z.string(),
    city: z.string(),
    cityCode: z.string().nullable(),
    state: z.string(),
    postalCode: z.string(),
  }),
  declaredActivities: z.array(activitySchema).min(1).max(1000),
});
export const sourceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.url(),
    kind: z.enum(['OFFICIAL_DATASET', 'PUBLIC_API']),
    datasetPeriod: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .nullable(),
    referenceDate: z.iso.datetime(),
    retrievedAt: z.iso.datetime(),
    licenseReference: z.string().min(1),
  })
  .refine((source) => source.kind !== 'OFFICIAL_DATASET' || source.datasetPeriod !== null, {
    message: 'Dataset oficial exige competência.',
  });
export const evidenceSchema = z.object({
  sourceUrl: z.url(),
  sourceType: z.enum(['OFFICIAL_WEBSITE', 'CATALOG', 'PORTFOLIO']),
  excerpt: z.string().min(10).max(1500),
  collectedAt: z.iso.datetime(),
  contentHash: z.string().length(64),
  association: z.string().min(10),
});
export const observedActivitySchema = z.object({
  id: z.string(),
  activityCode: z.string(),
  activityName: z.string(),
  category: z.string(),
  possibleCnaes: z.array(z.string()),
  confidenceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW', 'INCONCLUSIVE']),
  classificationStatus: z.enum([
    'COMPATIBLE',
    'POSSIBLE_DIVERGENCE',
    'INSUFFICIENT_EVIDENCE',
    'NOT_ANALYZED',
  ]),
  modelVersion: z.string(),
  analyzedAt: z.iso.datetime(),
  reviewedBy: z.string().min(1),
  evidence: z.array(evidenceSchema).min(1).max(10),
});
export type Company = z.infer<typeof companySchema>;
export type Source = z.infer<typeof sourceSchema>;
export type ObservedActivity = z.infer<typeof observedActivitySchema>;
export type Snapshot = {
  id: string;
  companyId: string;
  source: Source;
  data: Company;
  contentHash: string;
  schemaVersion: number;
  ingestedAt: string;
};
export type Change = {
  id: string;
  companyId: string;
  previousSnapshotId: string;
  currentSnapshotId: string;
  eventType: string;
  field: string;
  previousValue: unknown;
  currentValue: unknown;
  detectedAt: string;
};
export type CompanyRecord = {
  company: Company;
  snapshots: Snapshot[];
  changes: Change[];
  observedActivities: ObservedActivity[];
};
export type CompanyResponse = {
  data: Company & { observedActivities: ObservedActivity[] };
  meta: Source & { snapshotId: string; contentHash: string; schemaVersion: number };
};
