import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_payload_query_presets_access_read_constraint" AS ENUM('everyone', 'onlyMe', 'specificUsers');
  CREATE TYPE "cms"."enum_payload_query_presets_access_update_constraint" AS ENUM('everyone', 'onlyMe', 'specificUsers');
  CREATE TYPE "cms"."enum_payload_query_presets_access_delete_constraint" AS ENUM('everyone', 'onlyMe', 'specificUsers');
  CREATE TYPE "cms"."enum_payload_query_presets_related_collection" AS ENUM('articles', 'teachers', 'courses', 'events', 'media', 'audit-logs');
  ALTER TYPE "cms"."enum_payload_jobs_log_task_slug" ADD VALUE 'cleanupEmptyDrafts' BEFORE 'schedulePublish';
  ALTER TYPE "cms"."enum_payload_jobs_task_slug" ADD VALUE 'cleanupEmptyDrafts' BEFORE 'schedulePublish';
  CREATE TABLE "cms"."payload_query_presets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"is_shared" boolean DEFAULT false,
  	"access_read_constraint" "cms"."enum_payload_query_presets_access_read_constraint" DEFAULT 'onlyMe',
  	"access_update_constraint" "cms"."enum_payload_query_presets_access_update_constraint" DEFAULT 'onlyMe',
  	"access_delete_constraint" "cms"."enum_payload_query_presets_access_delete_constraint" DEFAULT 'onlyMe',
  	"where" jsonb,
  	"columns" jsonb,
  	"group_by" varchar,
  	"related_collection" "cms"."enum_payload_query_presets_related_collection" NOT NULL,
  	"is_temp" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_query_presets_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"staff_id" integer
  );
  
  CREATE TABLE "cms"."payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."audit_logs" ADD COLUMN "summary" varchar;
  ALTER TABLE "cms"."audit_logs" ADD COLUMN "actor_name" varchar;
  ALTER TABLE "cms"."payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "cms"."payload_query_presets_rels" ADD CONSTRAINT "payload_query_presets_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_query_presets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_query_presets_rels" ADD CONSTRAINT "payload_query_presets_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "cms"."staff"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_query_presets_updated_at_idx" ON "cms"."payload_query_presets" USING btree ("updated_at");
  CREATE INDEX "payload_query_presets_created_at_idx" ON "cms"."payload_query_presets" USING btree ("created_at");
  CREATE INDEX "payload_query_presets_rels_order_idx" ON "cms"."payload_query_presets_rels" USING btree ("order");
  CREATE INDEX "payload_query_presets_rels_parent_idx" ON "cms"."payload_query_presets_rels" USING btree ("parent_id");
  CREATE INDEX "payload_query_presets_rels_path_idx" ON "cms"."payload_query_presets_rels" USING btree ("path");
  CREATE INDEX "payload_query_presets_rels_staff_id_idx" ON "cms"."payload_query_presets_rels" USING btree ("staff_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."payload_query_presets" CASCADE;
  DROP TABLE "cms"."payload_query_presets_rels" CASCADE;
  DROP TABLE "cms"."payload_jobs_stats" CASCADE;
  ALTER TABLE "cms"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "cms"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "cms"."payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "cms"."enum_payload_jobs_log_task_slug" USING "task_slug"::"cms"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "cms"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "cms"."enum_payload_jobs_task_slug";
  CREATE TYPE "cms"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "cms"."payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "cms"."enum_payload_jobs_task_slug" USING "task_slug"::"cms"."enum_payload_jobs_task_slug";
  ALTER TABLE "cms"."audit_logs" DROP COLUMN "summary";
  ALTER TABLE "cms"."audit_logs" DROP COLUMN "actor_name";
  ALTER TABLE "cms"."payload_jobs" DROP COLUMN "meta";
  DROP TYPE "cms"."enum_payload_query_presets_access_read_constraint";
  DROP TYPE "cms"."enum_payload_query_presets_access_update_constraint";
  DROP TYPE "cms"."enum_payload_query_presets_access_delete_constraint";
  DROP TYPE "cms"."enum_payload_query_presets_related_collection";`)
}
