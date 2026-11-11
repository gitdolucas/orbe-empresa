import { sql } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { apiUsage } from '@/db/schema';
export async function recordUsage(operation: string, status: number) {
  const db = getDatabase();
  if (!db) return;
  const day = new Date().toISOString().slice(0, 10),
    id = `${day}:${operation}`;
  try {
    await db
      .insert(apiUsage)
      .values({ id, operation, requestCount: 1, errorCount: status >= 400 ? 1 : 0 })
      .onConflictDoUpdate({
        target: apiUsage.id,
        set: {
          requestCount: sql`${apiUsage.requestCount}+1`,
          errorCount: sql`${apiUsage.errorCount}+${status >= 400 ? 1 : 0}`,
          recordedAt: new Date(),
        },
      });
  } catch {
    console.warn(JSON.stringify({ level: 'warn', code: 'USAGE_METRICS_UNAVAILABLE' }));
  }
}
export async function reportError(error: Error, operation: string) {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(error, { tags: { operation } });
    await Sentry.flush(1500);
  } catch {}
}
