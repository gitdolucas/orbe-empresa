import { describe, it, expect } from 'vitest';
import { isValidCnpj, normalizeCnpj } from '../src/lib/cnpj';
import {
  appendSnapshot,
  compareSnapshots,
  createSnapshot,
  hash,
} from '../src/server/snapshot-engine';
import { companyResponse, historyResponse } from '../src/server/company-service';
import { consumeMemory } from '../src/server/security';
import seeds from '../data/companies.json';
import type { Company, CompanyRecord, Source } from '../src/lib/company';
// Synthetic versions are isolated to tests. Never exposed as real company history.
const company = structuredClone(seeds[0].company) as Company;
function source(period = '2026-09'): Source {
  return {
    id: 'test-only-official',
    name: 'Synthetic test dataset',
    url: 'https://example.org/test-only',
    kind: 'OFFICIAL_DATASET',
    datasetPeriod: period,
    referenceDate: `${period}-01T12:00:00.000Z`,
    retrievedAt: '2026-11-11T12:00:00.000Z',
    licenseReference: 'Synthetic fixture, tests only',
  };
}
describe('CNPJ validation', () => {
  it.each([
    '19131243000197',
    '00.000.000/0001-91',
    '47.960.950/0001-21',
    '12.ABC.345/01DE-35',
    '00.000.000/E08G-12',
  ])('accepts numeric and alphanumeric CNPJ %s', (value) => expect(isValidCnpj(value)).toBe(true));
  it.each([
    '00000000000000',
    '11111111111111',
    '19131243000198',
    '12ABC34501DE36',
    '19131243000197!',
    '123',
  ])('rejects invalid CNPJ %s', (value) => expect(isValidCnpj(value)).toBe(false));
  it('normalizes case and formatting without hiding invalid characters', () => {
    expect(normalizeCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
    expect(normalizeCnpj('19!131243000197')).toContain('!');
  });
});
describe('immutable snapshots and deterministic changes', () => {
  it('canonicalizes object keys and activity order', () => {
    expect(hash({ a: 1, b: 2 })).toBe(hash({ b: 2, a: 1 }));
    const reordered = { ...company, declaredActivities: [...company.declaredActivities].reverse() };
    expect(createSnapshot(company, source()).id).toBe(createSnapshot(reordered, source()).id);
  });
  it('does not duplicate snapshots or events on reimport', () => {
    const first = createSnapshot(company, source());
    const second = createSnapshot(
      { ...company, tradeName: 'Synthetic new name' },
      source('2026-10'),
    );
    const record = appendSnapshot(appendSnapshot(null, first), second);
    const reprocessed = appendSnapshot(record, second);
    expect(reprocessed).toBe(record);
    expect(record.snapshots).toHaveLength(2);
    expect(record.changes).toHaveLength(1);
    expect(record.changes[0].eventType).toBe('company.trade_name.changed');
  });
  it('detects all five supported event types', () => {
    const changed = {
      ...company,
      tradeName: 'Test',
      registrationStatus: 'BAIXADA',
      address: { ...company.address, number: '100' },
      declaredActivities: [
        { code: '6201501', name: 'Synthetic software development', primary: true },
        { code: '6204000', name: 'Synthetic consulting', primary: false },
      ],
    };
    expect(
      compareSnapshots(
        createSnapshot(company, source()),
        createSnapshot(changed, source('2026-10')),
      ).map((c) => c.eventType),
    ).toEqual([
      'company.status.changed',
      'company.address.changed',
      'company.primary_activity.changed',
      'company.secondary_activities.changed',
      'company.trade_name.changed',
    ]);
  });
  it('refuses to mutate an existing dataset release', () => {
    const record = appendSnapshot(null, createSnapshot(company, source()));
    expect(() =>
      appendSnapshot(record, createSnapshot({ ...company, tradeName: 'Replacement' }, source())),
    ).toThrow('IMMUTABLE_SNAPSHOT_CONFLICT');
  });
  it('rejects backwards and cross-company comparisons', () => {
    expect(() =>
      compareSnapshots(
        createSnapshot(company, source('2026-10')),
        createSnapshot(company, source()),
      ),
    ).toThrow('SNAPSHOT_ORDER_INVALID');
    expect(() =>
      compareSnapshots(
        createSnapshot(company, source()),
        createSnapshot(
          { ...company, cnpj: '00000000000191', rootCnpj: '00000000' },
          source('2026-10'),
        ),
      ),
    ).toThrow('SNAPSHOT_ENTITY_MISMATCH');
  });
  it('never emits official events for API observations or different sources', () => {
    const previous = createSnapshot(company, {
      ...source(),
      kind: 'PUBLIC_API',
      datasetPeriod: null,
    });
    const current = createSnapshot(
      { ...company, tradeName: 'New observation' },
      { ...source('2026-10'), kind: 'PUBLIC_API', datasetPeriod: null },
    );
    expect(compareSnapshots(previous, current)).toEqual([]);
    expect(
      compareSnapshots(
        createSnapshot(company, source()),
        createSnapshot(
          { ...company, tradeName: 'Other source' },
          { ...source('2026-10'), id: 'other-source' },
        ),
      ),
    ).toEqual([]);
  });
  it('rejects malformed identity and missing official competence', () => {
    expect(() => createSnapshot({ ...company, rootCnpj: '12345678' }, source())).toThrow(
      'INVALID_COMPANY_IDENTITY',
    );
    expect(() => createSnapshot(company, { ...source(), datasetPeriod: null })).toThrow();
  });
});
describe('source transparency', () => {
  it('does not expose comparison without two official releases of same source', () => {
    const record = seeds[0] as CompanyRecord;
    expect(historyResponse(record).meta.comparisonAvailable).toBe(false);
    expect(companyResponse(record).meta.datasetPeriod).toBeNull();
    const mixed = {
      ...record,
      snapshots: [
        createSnapshot(company, source()),
        createSnapshot(company, { ...source('2026-10'), id: 'another-source' }),
      ],
    };
    expect(historyResponse(mixed).meta.comparisonAvailable).toBe(false);
  });
  it('only includes minimized company fields in bundled real data', () => {
    const json = JSON.stringify(seeds);
    for (const key of ['nome_socio', 'cnpj_cpf_do_socio', 'ddd_telefone_1', 'email'])
      expect(json).not.toContain(`"${key}"`);
  });
});
describe('rate limiting', () => {
  it('blocks after limit and resets after expiry', () => {
    const key = crypto.randomUUID();
    expect(consumeMemory(key, 2, 60000, 100).allowed).toBe(true);
    expect(consumeMemory(key, 2, 60000, 200).remaining).toBe(0);
    expect(consumeMemory(key, 2, 60000, 300).allowed).toBe(false);
    expect(consumeMemory(key, 2, 60000, 60200).allowed).toBe(true);
  });
});
