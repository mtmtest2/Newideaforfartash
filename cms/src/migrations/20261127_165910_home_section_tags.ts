import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."home_layout" ALTER COLUMN "teachers_title" SET DEFAULT 'اساتید و کلاس‌های زبان';
  ALTER TABLE "cms"."home_layout" ALTER COLUMN "teachers_description" SET DEFAULT 'کلاس‌های زنده و تعاملی انگلیسی، آلمانی، فرانسوی، عربی و ترکی استانبولی با همراهی اساتید مجرب.';
  ALTER TABLE "cms"."home_layout" ADD COLUMN "teachers_tag" varchar DEFAULT 'کلاس‌های آنلاین فرتاش';
  ALTER TABLE "cms"."home_layout" ADD COLUMN "courses_tag" varchar DEFAULT 'دوره‌های ضبط‌شدهٔ فرتاش';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cms"."home_layout" ALTER COLUMN "teachers_title" SET DEFAULT 'کلاس‌های زبان فرتاش';
  ALTER TABLE "cms"."home_layout" ALTER COLUMN "teachers_description" SET DEFAULT 'با اساتید باتجربهٔ فرتاش، هر زبانی را که دوست دارید از پایه تا پیشرفته یاد بگیرید.';
  ALTER TABLE "cms"."home_layout" DROP COLUMN "teachers_tag";
  ALTER TABLE "cms"."home_layout" DROP COLUMN "courses_tag";`)
}
