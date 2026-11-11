import { isValidCnpj, normalizeCnpj } from '@/lib/cnpj';
import type { CompanyRecord, CompanyResponse } from '@/lib/company';
import { getRecord, saveSnapshot } from './repository';
import { fetchCompany } from './provider';
import { createSnapshot } from './snapshot-engine';
const inflight = new Map<string, Promise<CompanyRecord>>();
export class ServiceError extends Error {
  constructor(
    public code: string,
    public status: number,
    public userMessage: string,
  ) {
    super(code);
  }
}
export async function findCompany(input: string): Promise<CompanyRecord> {
  const cnpj = normalizeCnpj(input);
  if (!isValidCnpj(cnpj))
    throw new ServiceError(
      'INVALID_CNPJ',
      400,
      'CNPJ inválido. Verifique os 14 caracteres e os dígitos verificadores.',
    );
  const existing = await getRecord(cnpj);
  if (existing) return existing;
  if (inflight.has(cnpj)) return inflight.get(cnpj)!;
  const promise = (async () => {
    try {
      const { company, source } = await fetchCompany(cnpj);
      const snapshot = createSnapshot(company, source);
      await saveSnapshot(snapshot);
      return { company, snapshots: [snapshot], changes: [], observedActivities: [] };
    } catch (error) {
      if ((error as Error).message === 'COMPANY_NOT_IN_COVERAGE')
        throw new ServiceError(
          'NOT_IN_COVERAGE',
          404,
          'CNPJ não encontrado na cobertura disponível. Isso não comprova inexistência do registro.',
        );
      throw new ServiceError(
        'SERVICE_UNAVAILABLE',
        503,
        'Consulta temporariamente indisponível. Tente novamente em instantes.',
      );
    }
  })();
  inflight.set(cnpj, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(cnpj);
  }
}
export function companyResponse(record: CompanyRecord): CompanyResponse {
  const snapshot = record.snapshots.at(-1)!;
  return {
    data: { ...record.company, observedActivities: record.observedActivities },
    meta: {
      ...snapshot.source,
      snapshotId: snapshot.id,
      contentHash: snapshot.contentHash,
      schemaVersion: snapshot.schemaVersion,
    },
  };
}
export function historyResponse(record: CompanyRecord) {
  const official = record.snapshots.filter((s) => s.source.kind === 'OFFICIAL_DATASET');
  const comparable = official.some((snapshot) =>
    official.some((other) => other.id !== snapshot.id && other.source.id === snapshot.source.id),
  );
  return {
    data: record.snapshots,
    meta: {
      officialSnapshotCount: official.length,
      comparisonAvailable: comparable,
      reason: !comparable
        ? 'Histórico comparável indisponível: precisamos de dois snapshots oficiais autênticos da mesma fonte.'
        : null,
    },
  };
}
