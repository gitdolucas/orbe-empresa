import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getRedis } = vi.hoisted(() => ({ getRedis: vi.fn() }));
vi.mock('../src/server/redis', () => ({ getRedis }));
const cnpj = '12345678000195';

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('BRASILAPI_ENABLED', 'true');
  vi.stubEnv('BRASILAPI_DAILY_LIMIT', '2');
  vi.stubEnv('BRASILAPI_MIN_INTERVAL_SECONDS', '15');
  getRedis.mockReturnValue(null);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network request')));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('BrasilAPI consumption policy', () => {
  it('blocks bursts and daily exhaustion without consuming quota on blocked attempts', async () => {
    const { reserveProviderRequest } = await import('../src/server/provider-policy');
    await reserveProviderRequest(cnpj);
    await expect(reserveProviderRequest(cnpj)).rejects.toMatchObject({
      status: 429,
      retryAfter: 15,
    });
    vi.advanceTimersByTime(15000);
    await reserveProviderRequest(cnpj);
    vi.advanceTimersByTime(15000);
    await expect(reserveProviderRequest(cnpj)).rejects.toMatchObject({
      status: 429,
      retryAfter: 43170,
    });
    vi.setSystemTime(new Date('2026-11-12T00:00:00Z'));
    await expect(reserveProviderRequest(cnpj)).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not allow environment settings to raise the conservative ceilings', async () => {
    vi.stubEnv('BRASILAPI_DAILY_LIMIT', '10000');
    vi.stubEnv('BRASILAPI_MIN_INTERVAL_SECONDS', '1');
    const { providerLimits } = await import('../src/server/provider-policy');
    expect(providerLimits()).toEqual({ daily: 100, interval: 15 });
  });

  it('caches missing coverage without blocking a different company', async () => {
    const { reserveProviderRequest, recordProviderFailure } =
      await import('../src/server/provider-policy');
    await recordProviderFailure(cnpj, 404);
    await expect(reserveProviderRequest(cnpj)).rejects.toMatchObject({ status: 404 });
    await expect(reserveProviderRequest('19131243000197')).resolves.toBeUndefined();
    vi.advanceTimersByTime(3600000);
    await expect(reserveProviderRequest(cnpj)).resolves.toBeUndefined();
  });

  it('honors upstream Retry-After globally with no automatic retry', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('{}', { status: 429, headers: { 'Retry-After': '120' } }),
    );
    const { fetchCompany } = await import('../src/server/provider');
    await expect(fetchCompany(cnpj)).rejects.toMatchObject({ status: 429, retryAfter: 120 });
    vi.advanceTimersByTime(15000);
    await expect(fetchCompany('19131243000197')).rejects.toMatchObject({
      status: 429,
      retryAfter: 105,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('pauses other lookups after a provider network failure', async () => {
    const { fetchCompany } = await import('../src/server/provider');
    await expect(fetchCompany(cnpj)).rejects.toMatchObject({ status: 503, retryAfter: 60 });
    vi.advanceTimersByTime(15000);
    await expect(fetchCompany('19131243000197')).rejects.toMatchObject({
      status: 429,
      retryAfter: 45,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('parses both Retry-After formats and uses a conservative fallback', async () => {
    const { providerRetryAfter } = await import('../src/server/provider-policy');
    expect(providerRetryAfter('120')).toBe(120);
    expect(providerRetryAfter('Wed, 11 Nov 2026 12:03:00 GMT')).toBe(180);
    expect(providerRetryAfter('invalid')).toBe(900);
    expect(providerRetryAfter(null)).toBe(900);
  });

  it('makes no upstream request if distributed protection fails', async () => {
    getRedis.mockReturnValue({ eval: vi.fn().mockRejectedValue(new Error('Redis offline')) });
    const { fetchCompany } = await import('../src/server/provider');
    await expect(fetchCompany(cnpj)).rejects.toMatchObject({ status: 503 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed without Redis in production and supports disabling new lookups', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { fetchCompany } = await import('../src/server/provider');
    await expect(fetchCompany(cnpj)).rejects.toMatchObject({ status: 503 });
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('BRASILAPI_ENABLED', 'false');
    await expect(fetchCompany(cnpj)).rejects.toMatchObject({ status: 503 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a duplicate distributed cache miss before executing the lookup', async () => {
    getRedis.mockReturnValue({ set: vi.fn().mockResolvedValue(null) });
    const { withLookupLease } = await import('../src/server/provider-policy');
    const lookup = vi.fn();
    await expect(withLookupLease(cnpj, lookup)).rejects.toMatchObject({
      status: 503,
      retryAfter: 2,
    });
    expect(lookup).not.toHaveBeenCalled();
  });
});
