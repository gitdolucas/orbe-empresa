import { pgTable, text, timestamp, jsonb, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';
import type { Company, Source, ObservedActivity } from '@/lib/company';
export const companies = pgTable(
  'companies',
  {
    id: text('id').primaryKey(),
    cnpj: text('cnpj').notNull().unique(),
    rootCnpj: text('root_cnpj').notNull(),
    data: jsonb('data').$type<Company>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('companies_root_idx').on(table.rootCnpj)],
);
export const dataSources = pgTable('data_sources', {
  id: text('id').primaryKey(),
  data: jsonb('data').$type<Source>().notNull(),
});
export const companySnapshots = pgTable(
  'company_snapshots',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id),
    sourceId: text('source_id')
      .notNull()
      .references(() => dataSources.id),
    release: text('release').notNull(),
    source: jsonb('source').$type<Source>().notNull(),
    contentHash: text('content_hash').notNull(),
    data: jsonb('data').$type<Company>().notNull(),
    schemaVersion: integer('schema_version').notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('snapshots_release_unique').on(table.companyId, table.sourceId, table.release),
    index('snapshots_company_idx').on(table.companyId),
  ],
);
export const companyChanges = pgTable(
  'company_changes',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id),
    previousSnapshotId: text('previous_snapshot_id')
      .notNull()
      .references(() => companySnapshots.id),
    currentSnapshotId: text('current_snapshot_id')
      .notNull()
      .references(() => companySnapshots.id),
    eventType: text('event_type').notNull(),
    field: text('field').notNull(),
    previousValue: jsonb('previous_value'),
    currentValue: jsonb('current_value'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('changes_company_idx').on(table.companyId),
    uniqueIndex('changes_transition_unique').on(
      table.previousSnapshotId,
      table.currentSnapshotId,
      table.eventType,
    ),
  ],
);
export const observedActivities = pgTable(
  'observed_activities',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id),
    data: jsonb('data').$type<Omit<ObservedActivity, 'evidence'>>().notNull(),
  },
  (table) => [index('activities_company_idx').on(table.companyId)],
);
export const activityEvidence = pgTable(
  'activity_evidence',
  {
    id: text('id').primaryKey(),
    observedActivityId: text('observed_activity_id')
      .notNull()
      .references(() => observedActivities.id),
    data: jsonb('data').$type<ObservedActivity['evidence'][number]>().notNull(),
  },
  (table) => [index('evidence_activity_idx').on(table.observedActivityId)],
);
export const apiUsage = pgTable('api_usage', {
  id: text('id').primaryKey(),
  operation: text('operation').notNull(),
  requestCount: integer('request_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});
