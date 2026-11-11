import { createHash } from 'node:crypto';
import { getRedis } from './redis';

// Our conservative project-wide ceilings, not quotas advertised by BrasilAPI.
const prefix = 'empresa:brasilapi:';
let nextRequest = 0;
let cooldownUntil = 0;
let daily = { day: '', count: 0 };
const failures = new Map<string, { status: number; expires: number }>();

export class ProviderPolicyError extends Error {
  constructor(
    public status: number,
    public retryAfter: number,
  ) {
    super(status === 404 ? 'COMPANY_NOT_IN_COVERAGE' : 'PROVIDER_UNAVAILABLE');
  }
}

export function providerLimits() {
  const limit = Number(process.env.BRASILAPI_DAILY_LIMIT);
  const interval = Number(process.env.BRASILAPI_MIN_INTERVAL_SECONDS);
  return {
    daily: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 100,
    interval: Number.isInteger(interval) && interval > 0 ? Math.max(interval, 15) : 15,
  };
}

function identity(cnpj: string) {
  return createHash('sha256').update(cnpj).digest('hex').slice(0, 24);
}

// One atomic reservation across all server instances; blocked attempts consume no quota.
export const providerBudgetScript = `
local failure = redis.call('GET', KEYS[4])
if failure then return {tonumber(failure), math.max(1, redis.call('TTL', KEYS[4]))} end
local cooldown = redis.call('TTL', KEYS[1])
if cooldown >= 0 then return {429, math.max(1, cooldown)} end
local count = tonumber(redis.call('GET', KEYS[3]) or '0')
if count >= tonumber(ARGV[1]) then return {429, tonumber(ARGV[3])} end
local spacing = redis.call('TTL', KEYS[2])
if spacing >= 0 then return {429, math.max(1, spacing)} end
redis.call('SET', KEYS[2], '1', 'EX', ARGV[2])
redis.call('INCR', KEYS[3])
redis.call('EXPIRE', KEYS[3], ARGV[3])
return {200, 0}`;

export async function reserveProviderRequest(cnpj: string) {
  if (process.env.BRASILAPI_ENABLED === 'false') throw new ProviderPolicyError(503, 60);
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const untilTomorrow = Math.max(
    1,
    Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86400000 - now) / 1000),
  );
  const limits = providerLimits();
  const redis = getRedis();
  if (redis) {
    let result: [number, number];
    try {
      result = await redis.eval(
        providerBudgetScript,
        [
          `${prefix}cooldown`,
          `${prefix}spacing`,
          `${prefix}daily:${day}`,
          `${prefix}failure:${identity(cnpj)}`,
        ],
        [limits.daily, limits.interval, untilTomorrow],
      );
    } catch {
      throw new ProviderPolicyError(503, 60);
    }
    if (result[0] !== 200) throw new ProviderPolicyError(result[0], result[1]);
    return;
  }
  if (process.env.NODE_ENV === 'production') throw new ProviderPolicyError(503, 60);
  for (const [key, failure] of failures) if (failure.expires <= now) failures.delete(key);
  const failure = failures.get(cnpj);
  if (failure)
    throw new ProviderPolicyError(
      failure.status,
      Math.max(1, Math.ceil((failure.expires - now) / 1000)),
    );
  if (cooldownUntil > now)
    throw new ProviderPolicyError(429, Math.ceil((cooldownUntil - now) / 1000));
  if (daily.day !== day) daily = { day, count: 0 };
  if (daily.count >= limits.daily) throw new ProviderPolicyError(429, untilTomorrow);
  if (nextRequest > now) throw new ProviderPolicyError(429, Math.ceil((nextRequest - now) / 1000));
  nextRequest = now + limits.interval * 1000;
  daily.count++;
}

export function providerRetryAfter(value: string | null, fallback = 900) {
  if (!value?.trim()) return fallback;
  const seconds = /^\d+$/.test(value.trim())
    ? Number(value)
    : Math.ceil((Date.parse(value) - Date.now()) / 1000);
  return Number.isFinite(seconds) ? Math.max(60, Math.min(seconds, 2147483647)) : fallback;
}

// Preserve the longest upstream backoff even when concurrent failures arrive out of order.
const cooldownScript = `
if redis.call('TTL', KEYS[1]) < tonumber(ARGV[1]) then
  redis.call('SET', KEYS[1], '1', 'EX', ARGV[1])
end
return 1`;

export async function recordProviderFailure(
  cnpj: string,
  status: number,
  retryAfter?: string | null,
) {
  const delay =
    status === 404 ? 3600 : providerRetryAfter(retryAfter ?? null, status === 429 ? 900 : 60);
  const redis = getRedis();
  if (redis) {
    try {
      if (status === 404)
        await redis.set(`${prefix}failure:${identity(cnpj)}`, '404', { ex: delay });
      else await redis.eval(cooldownScript, [`${prefix}cooldown`], [delay]);
    } catch {
      // The next reservation fails closed if Redis is unavailable.
    }
  } else if (status === 404) failures.set(cnpj, { status, expires: Date.now() + delay * 1000 });
  else cooldownUntil = Math.max(cooldownUntil, Date.now() + delay * 1000);
  return delay;
}

// Keep duplicate cache misses on different instances away from the provider until persistence finishes.
export async function withLookupLease<T>(cnpj: string, lookup: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  if (!redis) return lookup();
  const key = `${prefix}lookup:${identity(cnpj)}`;
  const token = crypto.randomUUID();
  let acquired;
  try {
    acquired = await redis.set(key, token, { nx: true, ex: 60 });
  } catch {
    throw new ProviderPolicyError(503, 60);
  }
  if (!acquired) throw new ProviderPolicyError(503, 2);
  try {
    return await lookup();
  } finally {
    try {
      await redis.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
        [key],
        [token],
      );
    } catch {
      /* Lease expires automatically; never hide a successful persisted result. */
    }
  }
}
