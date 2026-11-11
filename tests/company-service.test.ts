import { beforeEach, describe, expect, it, vi } from 'vitest';
import seeds from '../data/companies.json';

const { getRecord, saveSnapshot, fetchCompany } = vi.hoisted(() => ({
  getRecord: vi.fn(),
  saveSnapshot: vi.fn(),
  fetchCompany: vi.fn(),
}));
vi.mock('../src/server/repository', () => ({ getRecord, saveSnapshot }));
vi.mock('../src/server/provider', () => ({ fetchCompany }));
vi.mock('../src/server/redis', () => ({ getRedis: () => null }));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  getRecord.mockResolvedValue(null);
  saveSnapshot.mockResolvedValue(undefined);
});

describe('provider calls only on cache misses', () => {
  it('serves persisted records without consulting the provider', async () => {
    getRecord.mockResolvedValue(seeds[0]);
    const { findCompany } = await import('../src/server/company-service');
    expect(await findCompany(seeds[0].company.cnpj)).toBe(seeds[0]);
    expect(fetchCompany).not.toHaveBeenCalled();
  });

  it('coalesces simultaneous profile, history and changes lookups into one provider request', async () => {
    const cnpj = '12345678000195';
    fetchCompany.mockResolvedValue({
      company: { ...seeds[0].company, cnpj, rootCnpj: cnpj.slice(0, 8) },
      source: seeds[0].snapshots[0].source,
    });
    const { findCompany } = await import('../src/server/company-service');
    const records = await Promise.all([findCompany(cnpj), findCompany(cnpj), findCompany(cnpj)]);
    expect(fetchCompany).toHaveBeenCalledTimes(1);
    expect(saveSnapshot).toHaveBeenCalledTimes(1);
    expect(records.every((record) => record.company.cnpj === cnpj)).toBe(true);
  });
});
