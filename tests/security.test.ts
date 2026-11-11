import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { evaluate, Redis } = vi.hoisted(() => {
  const evaluate = vi.fn();
  const Redis = vi.fn(function () {
    return { eval: evaluate };
  });
  return { evaluate, Redis };
});
vi.mock('@upstash/redis', () => ({ Redis }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
  vi.stubEnv('API_RATE_LIMIT', '30');
  vi.stubEnv('API_DAILY_LIMIT', '5000');
  evaluate.mockResolvedValue([1, 120]);
});
afterEach(() => vi.unstubAllEnvs());

describe('production Redis configuration', () => {
  it('uses the native Vercel integration credentials for distributed limits', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://native.example.test');
    vi.stubEnv('KV_REST_API_TOKEN', 'native-test-token');
    const { enforceLimits } = await import('../src/server/security');
    await expect(enforceLimits(new Request('https://empresa.example.test'))).resolves.toMatchObject(
      {
        allowed: true,
        remaining: 29,
      },
    );
    expect(Redis).toHaveBeenCalledWith({
      url: 'https://native.example.test',
      token: 'native-test-token',
    });
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('preserves explicit Upstash configuration when both pairs are present', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://explicit.example.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'explicit-test-token');
    vi.stubEnv('KV_REST_API_URL', 'https://native.example.test');
    vi.stubEnv('KV_REST_API_TOKEN', 'native-test-token');
    const { getRedis } = await import('../src/server/security');
    expect(getRedis()).not.toBeNull();
    expect(Redis).toHaveBeenCalledWith({
      url: 'https://explicit.example.test',
      token: 'explicit-test-token',
    });
  });

  it('fails closed instead of mixing incomplete credential pairs', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://explicit.example.test');
    vi.stubEnv('KV_REST_API_TOKEN', 'native-test-token');
    const { enforceLimits } = await import('../src/server/security');
    await expect(enforceLimits(new Request('https://empresa.example.test'))).rejects.toMatchObject({
      code: 'RATE_LIMIT_UNAVAILABLE',
      status: 503,
    });
    expect(Redis).not.toHaveBeenCalled();
  });
});
