CREATE TABLE "activity_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"observed_activity_id" text NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"operation" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"cnpj" text NOT NULL,
	"root_cnpj" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "company_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"previous_snapshot_id" text NOT NULL,
	"current_snapshot_id" text NOT NULL,
	"event_type" text NOT NULL,
	"field" text NOT NULL,
	"previous_value" jsonb,
	"current_value" jsonb,
	"detected_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"source_id" text NOT NULL,
	"release" text NOT NULL,
	"source" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"data" jsonb NOT NULL,
	"schema_version" integer NOT NULL,
	"ingested_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observed_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_evidence" ADD CONSTRAINT "activity_evidence_observed_activity_id_observed_activities_id_fk" FOREIGN KEY ("observed_activity_id") REFERENCES "public"."observed_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_changes" ADD CONSTRAINT "company_changes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_changes" ADD CONSTRAINT "company_changes_previous_snapshot_id_company_snapshots_id_fk" FOREIGN KEY ("previous_snapshot_id") REFERENCES "public"."company_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_changes" ADD CONSTRAINT "company_changes_current_snapshot_id_company_snapshots_id_fk" FOREIGN KEY ("current_snapshot_id") REFERENCES "public"."company_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_snapshots" ADD CONSTRAINT "company_snapshots_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_snapshots" ADD CONSTRAINT "company_snapshots_source_id_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observed_activities" ADD CONSTRAINT "observed_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_activity_idx" ON "activity_evidence" USING btree ("observed_activity_id");--> statement-breakpoint
CREATE INDEX "companies_root_idx" ON "companies" USING btree ("root_cnpj");--> statement-breakpoint
CREATE INDEX "changes_company_idx" ON "company_changes" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "changes_transition_unique" ON "company_changes" USING btree ("previous_snapshot_id","current_snapshot_id","event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "snapshots_release_unique" ON "company_snapshots" USING btree ("company_id","source_id","release");--> statement-breakpoint
CREATE INDEX "snapshots_company_idx" ON "company_snapshots" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "activities_company_idx" ON "observed_activities" USING btree ("company_id");