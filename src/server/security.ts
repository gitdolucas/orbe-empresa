import { createHash } from 'node:crypto';
import { ServiceError } from './company-service';
import { getRedis } from './redis';
export { getRedis } from './redis';
const windows = new Map<string, { count: number; reset: number }>();
function configuredLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
export function clientKey(request: Request) {
  // Never trust arbitrary user-provided forwarding headers outside Vercel.
  const identity = process.env.VERCEL
    ? (request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ?? 'shared')
    : 'shared-local';
  return createHash('sha256')
    .update(`${new Date().toISOString().slice(0, 10)}:${identity}`)
    .digest('hex')
    .slice(0, 24);
}
export function consumeMemory(key: string, limit: number, duration: number, now = Date.now()) {
  if (windows.size > 10000)
    for (const [id, entry] of windows) if (entry.reset <= now) windows.delete(id);
  let entry = windows.get(key);
  if (!entry || entry.reset <= now) {
    entry = { count: 0, reset: now + duration };
    windows.set(key, entry);
  }
  entry.count++;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)),
  };
}
const limitScript = `local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return {count, redis.call('TTL', KEYS[1])}`;
export async function enforceLimits(request: Request) {
  const minuteLimit = configuredLimit(process.env.API_RATE_LIMIT, 30),
    dailyLimit = configuredLimit(process.env.API_DAILY_LIMIT, 5000);
  const now = Date.now(),
    minute = Math.floor(now / 60000),
    day = new Date(now).toISOString().slice(0, 10);
  const keys = [`empresa:rate:${clientKey(request)}:${minute}`, `empresa:global:${day}`];
  const client = getRedis();
  if (!client && process.env.NODE_ENV === 'production')
    throw new ServiceError(
      'RATE_LIMIT_UNAVAILABLE',
      503,
      'Serviço indisponível: proteção de consumo não configurada.',
    );
  try {
    const results = client
      ? await Promise.all(
          keys.map((key, index) =>
            client.eval<[number], [number, number]>(
              limitScript,
              [key],
              [index === 0 ? 120 : 172800],
            ),
          ),
        )
      : null;
    const local = results
      ? results.map(([count, ttl], index) => ({
          allowed: count <= (index === 0 ? minuteLimit : dailyLimit),
          remaining: Math.max(0, (index === 0 ? minuteLimit : dailyLimit) - count),
          retryAfter: Math.max(1, ttl),
        }))
      : keys.map((key, index) =>
          consumeMemory(
            key,
            index === 0 ? minuteLimit : dailyLimit,
            index === 0 ? 60000 : 86400000,
          ),
        );
    if (local.some((result) => !result.allowed))
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(...local.filter((r) => !r.allowed).map((r) => r.retryAfter)),
      };
    return { ...local[0], allowed: true };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      'RATE_LIMIT_UNAVAILABLE',
      503,
      'Proteção de consumo temporariamente indisponível.',
    );
  }
}
