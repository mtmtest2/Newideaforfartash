import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Audit records are append-only at the database level: UPDATE, DELETE and TRUNCATE are rejected even for direct SQL
// from the application role. (A database superuser can still drop the trigger — that is outside the app's reach and
// itself visible in Postgres logs.)
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION "cms"."audit_logs_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs is append-only (% blocked)', TG_OP USING ERRCODE = 'insufficient_privilege';
    END $$;
    DROP TRIGGER IF EXISTS "audit_logs_no_update_delete" ON "cms"."audit_logs";
    CREATE TRIGGER "audit_logs_no_update_delete" BEFORE UPDATE OR DELETE ON "cms"."audit_logs"
      FOR EACH ROW EXECUTE FUNCTION "cms"."audit_logs_append_only"();
    DROP TRIGGER IF EXISTS "audit_logs_no_truncate" ON "cms"."audit_logs";
    CREATE TRIGGER "audit_logs_no_truncate" BEFORE TRUNCATE ON "cms"."audit_logs"
      FOR EACH STATEMENT EXECUTE FUNCTION "cms"."audit_logs_append_only"();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS "audit_logs_no_update_delete" ON "cms"."audit_logs";
    DROP TRIGGER IF EXISTS "audit_logs_no_truncate" ON "cms"."audit_logs";
    DROP FUNCTION IF EXISTS "cms"."audit_logs_append_only"();
  `)
}
