import { Redis } from '@upstash/redis';

let redis: Redis | undefined;
export function getRedis() {
  const [url, token] =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? [process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN]
      : [process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN];
  if (!url || !token) return null;
  redis ??= new Redis({ url, token });
  return redis;
}
