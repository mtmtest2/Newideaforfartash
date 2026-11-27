import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_otp_challenges_audience" AS ENUM('member', 'staff');
  ALTER TYPE "cms"."enum_staff_role" ADD VALUE 'owner' BEFORE 'support';
  ALTER TYPE "cms"."enum_staff_role" ADD VALUE 'supervisor';
  ALTER TYPE "cms"."enum_staff_role" ADD VALUE 'reception';
  ALTER TYPE "cms"."enum_staff_role" ADD VALUE 'teacher';
  CREATE TABLE "cms"."members_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "cms"."members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar,
  	"phone_verified_at" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"password_set" boolean DEFAULT true,
  	"last_login_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar,
  	"username" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."otp_challenges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"audience" "cms"."enum_otp_challenges_audience" NOT NULL,
  	"phone_hash" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"ip_hash" varchar,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"consumed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "cms"."staff" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "cms"."staff" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "cms"."staff" ADD COLUMN "phone" varchar;
  ALTER TABLE "cms"."staff" ADD COLUMN "last_login_at" timestamp(3) with time zone;
  ALTER TABLE "cms"."staff" ADD COLUMN "username" varchar;
  -- existing staff (support accounts created by email): username = email local part, or "staff<ID>" if that is not valid
  UPDATE "cms"."staff" SET "username" = CASE
    WHEN lower(split_part("email", '@', 1)) ~ '^[a-z][a-z0-9._]{3,29}$' THEN lower(split_part("email", '@', 1))
    ELSE 'staff' || "id" END;
  UPDATE "cms"."staff" s SET "username" = s."username" || s."id"
    WHERE EXISTS (SELECT 1 FROM "cms"."staff" t WHERE t."username" = s."username" AND t."id" < s."id");
  ALTER TABLE "cms"."staff" ALTER COLUMN "username" SET NOT NULL;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD COLUMN "otp_challenges_id" integer;
  ALTER TABLE "cms"."payload_preferences_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "cms"."members_sessions" ADD CONSTRAINT "members_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "members_sessions_order_idx" ON "cms"."members_sessions" USING btree ("_order");
  CREATE INDEX "members_sessions_parent_id_idx" ON "cms"."members_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "members_phone_idx" ON "cms"."members" USING btree ("phone");
  CREATE INDEX "members_updated_at_idx" ON "cms"."members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "cms"."members" USING btree ("created_at");
  CREATE UNIQUE INDEX "members_username_idx" ON "cms"."members" USING btree ("username");
  CREATE INDEX "otp_challenges_audience_idx" ON "cms"."otp_challenges" USING btree ("audience");
  CREATE INDEX "otp_challenges_phone_hash_idx" ON "cms"."otp_challenges" USING btree ("phone_hash");
  CREATE INDEX "otp_challenges_ip_hash_idx" ON "cms"."otp_challenges" USING btree ("ip_hash");
  CREATE INDEX "otp_challenges_expires_at_idx" ON "cms"."otp_challenges" USING btree ("expires_at");
  CREATE INDEX "otp_challenges_updated_at_idx" ON "cms"."otp_challenges" USING btree ("updated_at");
  CREATE INDEX "otp_challenges_created_at_idx" ON "cms"."otp_challenges" USING btree ("created_at");
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "cms"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_challenges_fk" FOREIGN KEY ("otp_challenges_id") REFERENCES "cms"."otp_challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "cms"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "staff_phone_idx" ON "cms"."staff" USING btree ("phone");
  CREATE UNIQUE INDEX "staff_username_idx" ON "cms"."staff" USING btree ("username");
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX "payload_locked_documents_rels_otp_challenges_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("otp_challenges_id");
  CREATE INDEX "payload_preferences_rels_members_id_idx" ON "cms"."payload_preferences_rels" USING btree ("members_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // rolling back would delete every site user and is impossible once non-support staff exist: refuse instead of losing data
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM "cms"."staff" WHERE "role"::text <> 'support') OR EXISTS (SELECT 1 FROM "cms"."members") THEN
      RAISE EXCEPTION 'identity down-migration blocked: members or non-support staff exist (restore a backup instead)';
    END IF; END $$;`)
  await db.execute(sql`
   ALTER TABLE "cms"."members_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cms"."otp_challenges" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cms"."members_sessions" CASCADE;
  DROP TABLE "cms"."members" CASCADE;
  DROP TABLE "cms"."otp_challenges" CASCADE;
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_members_fk";
  
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_otp_challenges_fk";
  
  ALTER TABLE "cms"."payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_members_fk";
  
  ALTER TABLE "cms"."staff" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "cms"."staff" ALTER COLUMN "role" SET DEFAULT 'support'::text;
  DROP TYPE "cms"."enum_staff_role";
  CREATE TYPE "cms"."enum_staff_role" AS ENUM('support');
  ALTER TABLE "cms"."staff" ALTER COLUMN "role" SET DEFAULT 'support'::"cms"."enum_staff_role";
  ALTER TABLE "cms"."staff" ALTER COLUMN "role" SET DATA TYPE "cms"."enum_staff_role" USING "role"::"cms"."enum_staff_role";
  DROP INDEX "cms"."staff_phone_idx";
  DROP INDEX "cms"."staff_username_idx";
  DROP INDEX "cms"."payload_locked_documents_rels_members_id_idx";
  DROP INDEX "cms"."payload_locked_documents_rels_otp_challenges_id_idx";
  DROP INDEX "cms"."payload_preferences_rels_members_id_idx";
  ALTER TABLE "cms"."staff" ALTER COLUMN "email" SET NOT NULL;
  ALTER TABLE "cms"."staff" DROP COLUMN "phone";
  ALTER TABLE "cms"."staff" DROP COLUMN "last_login_at";
  ALTER TABLE "cms"."staff" DROP COLUMN "username";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "members_id";
  ALTER TABLE "cms"."payload_locked_documents_rels" DROP COLUMN "otp_challenges_id";
  ALTER TABLE "cms"."payload_preferences_rels" DROP COLUMN "members_id";
  DROP TYPE "cms"."enum_otp_challenges_audience";`)
}
