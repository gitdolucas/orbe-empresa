import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { eq, inArray, sql } from 'drizzle-orm';
import seeds from '../../data/companies.json';
import { getDatabase } from '@/db/client';
import * as tables from '@/db/schema';
import type { CompanyRecord, Snapshot, ObservedActivity } from '@/lib/company';
import { appendSnapshot, hash } from './snapshot-engine';
const initial = seeds as CompanyRecord[];
const runtimeFile = path.join(process.cwd(), '.runtime', 'companies.json');
let queue = Promise.resolve();
async function localRecords(): Promise<CompanyRecord[]> {
  try {
    return JSON.parse(await readFile(runtimeFile, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return structuredClone(initial);
  }
}
async function localMutation(fn: (records: CompanyRecord[]) => CompanyRecord[]) {
  const task = queue.then(async () => {
    const updated = fn(await localRecords());
    await mkdir(path.dirname(runtimeFile), { recursive: true });
    const temporary = `${runtimeFile}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(updated));
    await rename(temporary, runtimeFile);
  });
  queue = task.catch(() => {});
  return task;
}
export async function getRecord(cnpj: string): Promise<CompanyRecord | null> {
  const db = getDatabase();
  if (!db) {
    // Deployed read-only examples work before production credentials are supplied.
    const records = process.env.VERCEL ? initial : await localRecords();
    return records.find((record) => record.company.cnpj === cnpj) ?? null;
  }
  const [company] = await db.select().from(tables.companies).where(eq(tables.companies.id, cnpj));
  if (!company) return null;
  const [snapshots, changes, activities] = await Promise.all([
    db.select().from(tables.companySnapshots).where(eq(tables.companySnapshots.companyId, cnpj)),
    db.select().from(tables.companyChanges).where(eq(tables.companyChanges.companyId, cnpj)),
    db
      .select()
      .from(tables.observedActivities)
      .where(eq(tables.observedActivities.companyId, cnpj)),
  ]);
  const evidence = activities.length
    ? await db
        .select()
        .from(tables.activityEvidence)
        .where(
          inArray(
            tables.activityEvidence.observedActivityId,
            activities.map((a) => a.id),
          ),
        )
    : [];
  return {
    company: company.data,
    snapshots: snapshots
      .map((s) => ({ ...s, ingestedAt: s.ingestedAt.toISOString() }))
      .sort((a, b) => a.source.referenceDate.localeCompare(b.source.referenceDate)),
    changes: changes
      .map((c) => ({ ...c, detectedAt: c.detectedAt.toISOString() }))
      .sort((a, b) => a.detectedAt.localeCompare(b.detectedAt)),
    observedActivities: activities.map((a) => ({
      ...a.data,
      evidence: evidence.filter((e) => e.observedActivityId === a.id).map((e) => e.data),
    })),
  };
}
export async function saveSnapshot(snapshot: Snapshot) {
  const db = getDatabase();
  if (!db) {
    if (process.env.VERCEL) throw new Error('PERSISTENCE_UNAVAILABLE');
    await localMutation((records) => {
      const index = records.findIndex((r) => r.company.cnpj === snapshot.companyId);
      const updated = appendSnapshot(index < 0 ? null : records[index], snapshot);
      return index < 0 ? [...records, updated] : records.map((r, i) => (i === index ? updated : r));
    });
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${snapshot.companyId}))`);
    const [existing] = await tx
      .select()
      .from(tables.companies)
      .where(eq(tables.companies.id, snapshot.companyId));
    const snapshots = existing
      ? await tx
          .select()
          .from(tables.companySnapshots)
          .where(eq(tables.companySnapshots.companyId, snapshot.companyId))
      : [];
    const record = existing
      ? {
          company: existing.data,
          snapshots: snapshots
            .map((s) => ({ ...s, ingestedAt: s.ingestedAt.toISOString() }))
            .sort((a, b) => a.source.referenceDate.localeCompare(b.source.referenceDate)),
          changes: [],
          observedActivities: [],
        }
      : null;
    const updated = appendSnapshot(record, snapshot);
    if (record === updated) return;
    await tx
      .insert(tables.companies)
      .values({
        id: snapshot.companyId,
        cnpj: snapshot.companyId,
        rootCnpj: snapshot.data.rootCnpj,
        data: snapshot.data,
      })
      .onConflictDoUpdate({
        target: tables.companies.id,
        set: { data: updated.company, updatedAt: new Date() },
      });
    await tx
      .insert(tables.dataSources)
      .values({ id: snapshot.source.id, data: snapshot.source })
      .onConflictDoNothing();
    await tx.insert(tables.companySnapshots).values({
      ...snapshot,
      sourceId: snapshot.source.id,
      release: snapshot.source.datasetPeriod ?? snapshot.source.referenceDate,
      ingestedAt: new Date(snapshot.ingestedAt),
    });
    if (updated.changes.length)
      await tx
        .insert(tables.companyChanges)
        .values(updated.changes.map((c) => ({ ...c, detectedAt: new Date(c.detectedAt) })))
        .onConflictDoNothing();
  });
}
export async function saveActivities(cnpj: string, activities: ObservedActivity[]) {
  const db = getDatabase();
  if (!db) {
    if (process.env.VERCEL) throw new Error('PERSISTENCE_UNAVAILABLE');
    await localMutation((records) =>
      records.map((r) => (r.company.cnpj === cnpj ? { ...r, observedActivities: activities } : r)),
    );
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${cnpj}))`);
    const old = await tx
      .select({ id: tables.observedActivities.id })
      .from(tables.observedActivities)
      .where(eq(tables.observedActivities.companyId, cnpj));
    if (old.length)
      await tx.delete(tables.activityEvidence).where(
        inArray(
          tables.activityEvidence.observedActivityId,
          old.map((a) => a.id),
        ),
      );
    await tx.delete(tables.observedActivities).where(eq(tables.observedActivities.companyId, cnpj));
    for (const activity of activities) {
      const { evidence, ...data } = activity;
      await tx.insert(tables.observedActivities).values({ id: activity.id, companyId: cnpj, data });
      await tx.insert(tables.activityEvidence).values(
        evidence.map((e) => ({
          id: hash([activity.id, e.sourceUrl, e.contentHash]),
          observedActivityId: activity.id,
          data: e,
        })),
      );
    }
  });
}
export function getExamples() {
  return initial.map((r) => ({
    cnpj: r.company.cnpj,
    name: r.company.legalName,
    city: r.company.address.city,
    state: r.company.address.state,
    status: r.company.registrationStatus,
    activity: r.company.declaredActivities.find((a) => a.primary)?.name ?? '',
    observedCount: r.observedActivities.length,
  }));
}
