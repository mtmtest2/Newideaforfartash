import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "cms"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_teachers_levels" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "cms"."enum_teachers_profile_state" AS ENUM('active', 'inactive', 'archived');
  CREATE TYPE "cms"."enum_teachers_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__teachers_v_version_levels" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "cms"."enum__teachers_v_version_profile_state" AS ENUM('active', 'inactive', 'archived');
  CREATE TYPE "cms"."enum__teachers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_courses_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "cms"."enum_courses_modules_chapters_lessons_video_provider" AS ENUM('arvan', 'aparat', 'bunny', 'other');
  CREATE TYPE "cms"."enum_courses_difficulty" AS ENUM('easy', 'medium', 'hard');
  CREATE TYPE "cms"."enum_courses_discount_kind" AS ENUM('percent', 'amount');
  CREATE TYPE "cms"."enum_courses_enrollment" AS ENUM('not_open', 'open', 'closed');
  CREATE TYPE "cms"."enum_courses_workflow_status" AS ENUM('draft', 'pending_review', 'approved', 'published', 'scheduled', 'archived');
  CREATE TYPE "cms"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__courses_v_version_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "cms"."enum__courses_v_version_modules_chapters_lessons_video_provider" AS ENUM('arvan', 'aparat', 'bunny', 'other');
  CREATE TYPE "cms"."enum__courses_v_version_difficulty" AS ENUM('easy', 'medium', 'hard');
  CREATE TYPE "cms"."enum__courses_v_version_discount_kind" AS ENUM('percent', 'amount');
  CREATE TYPE "cms"."enum__courses_v_version_enrollment" AS ENUM('not_open', 'open', 'closed');
  CREATE TYPE "cms"."enum__courses_v_version_workflow_status" AS ENUM('draft', 'pending_review', 'approved', 'published', 'scheduled', 'archived');
  CREATE TYPE "cms"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_events_type" AS ENUM('workshop', 'webinar', 'special', 'educational', 'masterclass');
  CREATE TYPE "cms"."enum_events_format" AS ENUM('online', 'offline');
  CREATE TYPE "cms"."enum_events_registration" AS ENUM('soon', 'open', 'full', 'closed');
  CREATE TYPE "cms"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__events_v_version_type" AS ENUM('workshop', 'webinar', 'special', 'educational', 'masterclass');
  CREATE TYPE "cms"."enum__events_v_version_format" AS ENUM('online', 'offline');
  CREATE TYPE "cms"."enum__events_v_version_registration" AS ENUM('soon', 'open', 'full', 'closed');
  CREATE TYPE "cms"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_languages_levels_code" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "cms"."enum_languages_flag" AS ENUM('uk', 'de', 'fr', 'sa', 'tr', 'it');
  CREATE TYPE "cms"."enum_languages_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__languages_v_version_levels_code" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "cms"."enum__languages_v_version_flag" AS ENUM('uk', 'de', 'fr', 'sa', 'tr', 'it');
  CREATE TYPE "cms"."enum__languages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_pages_blocks_announcement_tone" AS ENUM('info', 'important');
  CREATE TYPE "cms"."enum_pages_kind" AS ENUM('info', 'legal', 'contact');
  CREATE TYPE "cms"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum__pages_v_blocks_announcement_tone" AS ENUM('info', 'important');
  CREATE TYPE "cms"."enum__pages_v_version_kind" AS ENUM('info', 'legal', 'contact');
  CREATE TYPE "cms"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "cms"."enum_media_category" AS ENUM('teachers', 'magazine', 'events', 'courses', 'languages', 'pages', 'other');
  CREATE TYPE "cms"."enum_redirects_type" AS ENUM('301', '302');
  CREATE TYPE "cms"."enum_staff_role" AS ENUM('support');
  CREATE TYPE "cms"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "cms"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "cms"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "cms"."enum_home_layout_courses_selection" AS ENUM('auto', 'manual');
  CREATE TYPE "cms"."enum_home_layout_courses_position" AS ENUM('afterClasses', 'afterIntro', 'beforeArticles');
  CREATE TABLE "cms"."articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"cover_id" integer,
  	"content" jsonb,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"author_id" integer,
  	"category_id" integer,
  	"language_id" integer,
  	"reading_time" numeric,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_image_id" integer,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"articles_id" integer
  );
  
  CREATE TABLE "cms"."_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_cover_id" integer,
  	"version_content" jsonb,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" integer,
  	"version_category_id" integer,
  	"version_language_id" integer,
  	"version_reading_time" numeric,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_image_id" integer,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"articles_id" integer
  );
  
  CREATE TABLE "cms"."teachers_levels" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "cms"."enum_teachers_levels",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."teachers_specializations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "cms"."teachers_qualifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "cms"."teachers_certificates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"year" numeric
  );
  
  CREATE TABLE "cms"."teachers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"first_name" varchar,
  	"last_name" varchar,
  	"display_name" varchar,
  	"title" varchar,
  	"photo_id" integer,
  	"bio" jsonb,
  	"experience_years" numeric,
  	"intro_video" varchar,
  	"card_text" varchar,
  	"card_level" varchar,
  	"students" numeric,
  	"rating" numeric,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_image_id" integer,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"slug" varchar,
  	"profile_state" "cms"."enum_teachers_profile_state" DEFAULT 'active',
  	"show_on_home" boolean DEFAULT true,
  	"fartash_user_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_teachers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."teachers_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "cms"."teachers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"languages_id" integer
  );
  
  CREATE TABLE "cms"."_teachers_v_version_levels" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "cms"."enum__teachers_v_version_levels",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."_teachers_v_version_specializations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_teachers_v_version_qualifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_teachers_v_version_certificates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"year" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_teachers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_first_name" varchar,
  	"version_last_name" varchar,
  	"version_display_name" varchar,
  	"version_title" varchar,
  	"version_photo_id" integer,
  	"version_bio" jsonb,
  	"version_experience_years" numeric,
  	"version_intro_video" varchar,
  	"version_card_text" varchar,
  	"version_card_level" varchar,
  	"version_students" numeric,
  	"version_rating" numeric,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_image_id" integer,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_slug" varchar,
  	"version_profile_state" "cms"."enum__teachers_v_version_profile_state" DEFAULT 'active',
  	"version_show_on_home" boolean DEFAULT true,
  	"version_fartash_user_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__teachers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."_teachers_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "cms"."_teachers_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"languages_id" integer
  );
  
  CREATE TABLE "cms"."courses_level" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "cms"."enum_courses_level",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."courses_objectives" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "cms"."courses_modules_chapters_lessons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"minutes" numeric,
  	"preview" boolean,
  	"video_provider" "cms"."enum_courses_modules_chapters_lessons_video_provider",
  	"video_asset_id" varchar
  );
  
  CREATE TABLE "cms"."courses_modules_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "cms"."courses_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "cms"."courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"excerpt" varchar,
  	"description" jsonb,
  	"language_id" integer,
  	"difficulty" "cms"."enum_courses_difficulty",
  	"instructor_id" integer,
  	"audience" varchar,
  	"prerequisites" varchar,
  	"cover_id" integer,
  	"promo_video" varchar,
  	"estimated_weeks" numeric,
  	"total_minutes" numeric,
  	"total_lessons" numeric,
  	"price" numeric,
  	"access_days" numeric DEFAULT 0,
  	"discount_enabled" boolean,
  	"discount_kind" "cms"."enum_courses_discount_kind",
  	"discount_value" numeric,
  	"discount_from" timestamp(3) with time zone,
  	"discount_to" timestamp(3) with time zone,
  	"enrollment" "cms"."enum_courses_enrollment" DEFAULT 'not_open',
  	"purchasable" boolean DEFAULT false,
  	"available_from" timestamp(3) with time zone,
  	"available_to" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_image_id" integer,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"workflow_status" "cms"."enum_courses_workflow_status" DEFAULT 'draft',
  	"show_on_home" boolean DEFAULT true,
  	"featured" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_courses_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"private_files_id" integer
  );
  
  CREATE TABLE "cms"."_courses_v_version_level" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "cms"."enum__courses_v_version_level",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "cms"."_courses_v_version_objectives" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_courses_v_version_modules_chapters_lessons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"minutes" numeric,
  	"preview" boolean,
  	"video_provider" "cms"."enum__courses_v_version_modules_chapters_lessons_video_provider",
  	"video_asset_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_courses_v_version_modules_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_courses_v_version_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_courses_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_excerpt" varchar,
  	"version_description" jsonb,
  	"version_language_id" integer,
  	"version_difficulty" "cms"."enum__courses_v_version_difficulty",
  	"version_instructor_id" integer,
  	"version_audience" varchar,
  	"version_prerequisites" varchar,
  	"version_cover_id" integer,
  	"version_promo_video" varchar,
  	"version_estimated_weeks" numeric,
  	"version_total_minutes" numeric,
  	"version_total_lessons" numeric,
  	"version_price" numeric,
  	"version_access_days" numeric DEFAULT 0,
  	"version_discount_enabled" boolean,
  	"version_discount_kind" "cms"."enum__courses_v_version_discount_kind",
  	"version_discount_value" numeric,
  	"version_discount_from" timestamp(3) with time zone,
  	"version_discount_to" timestamp(3) with time zone,
  	"version_enrollment" "cms"."enum__courses_v_version_enrollment" DEFAULT 'not_open',
  	"version_purchasable" boolean DEFAULT false,
  	"version_available_from" timestamp(3) with time zone,
  	"version_available_to" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_image_id" integer,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_workflow_status" "cms"."enum__courses_v_version_workflow_status" DEFAULT 'draft',
  	"version_show_on_home" boolean DEFAULT true,
  	"version_featured" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__courses_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"private_files_id" integer
  );
  
  CREATE TABLE "cms"."events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"type" "cms"."enum_events_type" DEFAULT 'workshop',
  	"title" varchar,
  	"subtitle" varchar,
  	"excerpt" varchar,
  	"description" jsonb,
  	"poster_id" integer,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"timezone" varchar DEFAULT 'Asia/Tehran',
  	"format" "cms"."enum_events_format" DEFAULT 'online',
  	"venue" varchar,
  	"meeting_link" varchar,
  	"registration" "cms"."enum_events_registration" DEFAULT 'soon',
  	"registration_url" varchar,
  	"capacity" numeric,
  	"price" numeric DEFAULT 0,
  	"requirements" varchar,
  	"audience" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_image_id" integer,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"speaker_teacher_id" integer,
  	"speaker_name" varchar,
  	"language_id" integer,
  	"category_id" integer,
  	"featured" boolean,
  	"show_on_home" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_type" "cms"."enum__events_v_version_type" DEFAULT 'workshop',
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_excerpt" varchar,
  	"version_description" jsonb,
  	"version_poster_id" integer,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_timezone" varchar DEFAULT 'Asia/Tehran',
  	"version_format" "cms"."enum__events_v_version_format" DEFAULT 'online',
  	"version_venue" varchar,
  	"version_meeting_link" varchar,
  	"version_registration" "cms"."enum__events_v_version_registration" DEFAULT 'soon',
  	"version_registration_url" varchar,
  	"version_capacity" numeric,
  	"version_price" numeric DEFAULT 0,
  	"version_requirements" varchar,
  	"version_audience" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_image_id" integer,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_speaker_teacher_id" integer,
  	"version_speaker_name" varchar,
  	"version_language_id" integer,
  	"version_category_id" integer,
  	"version_featured" boolean,
  	"version_show_on_home" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."languages_levels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" "cms"."enum_languages_levels_code",
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "cms"."languages_exams" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "cms"."languages_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "cms"."languages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name" varchar,
  	"short_name" varchar,
  	"flag" "cms"."enum_languages_flag",
  	"intro" varchar,
  	"description" jsonb,
  	"image_id" integer,
  	"slug" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_image_id" integer,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_languages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."_languages_v_version_levels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" "cms"."enum__languages_v_version_levels_code",
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_languages_v_version_exams" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_languages_v_version_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_languages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_name" varchar,
  	"version_short_name" varchar,
  	"version_flag" "cms"."enum__languages_v_version_flag",
  	"version_intro" varchar,
  	"version_description" jsonb,
  	"version_image_id" integer,
  	"version_slug" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_image_id" integer,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__languages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."pages_blocks_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "cms"."pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"button_label" varchar,
  	"href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."pages_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."pages_blocks_announcement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tone" "cms"."enum_pages_blocks_announcement_tone" DEFAULT 'info',
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"kind" "cms"."enum_pages_kind" DEFAULT 'info',
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_image_id" integer,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "cms"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"button_label" varchar,
  	"href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_pages_v_blocks_announcement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tone" "cms"."enum__pages_v_blocks_announcement_tone" DEFAULT 'info',
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_kind" "cms"."enum__pages_v_version_kind" DEFAULT 'info',
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_image_id" integer,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "cms"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "cms"."authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"role" varchar,
  	"avatar_id" integer,
  	"bio" varchar,
  	"teacher_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_image_id" integer,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"category" "cms"."enum_media_category",
  	"credit" varchar,
  	"checksum" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar
  );
  
  CREATE TABLE "cms"."private_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "cms"."redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"type" "cms"."enum_redirects_type" DEFAULT '301',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."staff_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "cms"."staff" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "cms"."enum_staff_role" DEFAULT 'support' NOT NULL,
  	"active" boolean DEFAULT true,
  	"fartash_user_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar NOT NULL,
  	"entity" varchar NOT NULL,
  	"entity_id" varchar,
  	"actor_id" integer,
  	"actor_label" varchar,
  	"actor_role" varchar,
  	"changed" jsonb,
  	"before" jsonb,
  	"after" jsonb,
  	"result" varchar,
  	"request_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "cms"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "cms"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "cms"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "cms"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "cms"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"teachers_id" integer,
  	"courses_id" integer,
  	"events_id" integer,
  	"languages_id" integer,
  	"pages_id" integer,
  	"authors_id" integer,
  	"categories_id" integer,
  	"tags_id" integer,
  	"media_id" integer,
  	"private_files_id" integer,
  	"redirects_id" integer,
  	"staff_id" integer,
  	"audit_logs_id" integer
  );
  
  CREATE TABLE "cms"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"staff_id" integer
  );
  
  CREATE TABLE "cms"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms"."home_layout" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"teachers_title" varchar DEFAULT 'کلاس‌های زبان فرتاش',
  	"teachers_description" varchar DEFAULT 'با اساتید باتجربهٔ فرتاش، هر زبانی را که دوست دارید از پایه تا پیشرفته یاد بگیرید.',
  	"courses_title" varchar DEFAULT 'دوره‌های آفلاین فرتاش',
  	"courses_description" varchar DEFAULT 'هر زمان که خواستید، با ویدیوهای ضبط‌شده و تمرین‌های هر درس یاد بگیرید.',
  	"courses_selection" "cms"."enum_home_layout_courses_selection" DEFAULT 'auto',
  	"courses_visible_cards" numeric DEFAULT 3,
  	"courses_position" "cms"."enum_home_layout_courses_position" DEFAULT 'afterClasses',
  	"events_enabled" boolean DEFAULT false,
  	"events_title" varchar DEFAULT 'کارگاه‌ها و رویدادها',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."home_layout_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer
  );
  
  CREATE TABLE "cms"."navigation_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."navigation_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "cms"."navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'آموزشگاه آنلاین زبان فرتاش',
  	"contact_address" varchar DEFAULT 'مشهد، نبش طبرسی جنوبی ۶۰',
  	"contact_phone" varchar DEFAULT '05132777100',
  	"contact_phone_display" varchar DEFAULT '۰۵۱-۳۲۷۷۷۱۰۰',
  	"contact_email" varchar,
  	"contact_hours" varchar DEFAULT 'شنبه تا پنجشنبه، ۹ تا ۲۱',
  	"social_instagram" varchar,
  	"social_telegram" varchar,
  	"social_youtube" varchar,
  	"seo_title_suffix" varchar DEFAULT ' | فرتاش',
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms"."feature_flags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"offline_courses_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "cms"."articles" ADD CONSTRAINT "articles_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."articles" ADD CONSTRAINT "articles_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "cms"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "cms"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."articles" ADD CONSTRAINT "articles_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "cms"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."articles" ADD CONSTRAINT "articles_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "cms"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."articles_rels" ADD CONSTRAINT "articles_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "cms"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v" ADD CONSTRAINT "_articles_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "cms"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v" ADD CONSTRAINT "_articles_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "cms"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v" ADD CONSTRAINT "_articles_v_version_language_id_languages_id_fk" FOREIGN KEY ("version_language_id") REFERENCES "cms"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v" ADD CONSTRAINT "_articles_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "cms"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "cms"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."teachers_levels" ADD CONSTRAINT "teachers_levels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."teachers_specializations" ADD CONSTRAINT "teachers_specializations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."teachers_qualifications" ADD CONSTRAINT "teachers_qualifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."teachers_certificates" ADD CONSTRAINT "teachers_certificates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."teachers" ADD CONSTRAINT "teachers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."teachers" ADD CONSTRAINT "teachers_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."teachers_texts" ADD CONSTRAINT "teachers_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."teachers_rels" ADD CONSTRAINT "teachers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."teachers_rels" ADD CONSTRAINT "teachers_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "cms"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v_version_levels" ADD CONSTRAINT "_teachers_v_version_levels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_teachers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v_version_specializations" ADD CONSTRAINT "_teachers_v_version_specializations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_teachers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v_version_qualifications" ADD CONSTRAINT "_teachers_v_version_qualifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_teachers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v_version_certificates" ADD CONSTRAINT "_teachers_v_version_certificates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_teachers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v" ADD CONSTRAINT "_teachers_v_parent_id_teachers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."teachers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v" ADD CONSTRAINT "_teachers_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v" ADD CONSTRAINT "_teachers_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v_texts" ADD CONSTRAINT "_teachers_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_teachers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v_rels" ADD CONSTRAINT "_teachers_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_teachers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_teachers_v_rels" ADD CONSTRAINT "_teachers_v_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "cms"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."courses_level" ADD CONSTRAINT "courses_level_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."courses_objectives" ADD CONSTRAINT "courses_objectives_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."courses_modules_chapters_lessons" ADD CONSTRAINT "courses_modules_chapters_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."courses_modules_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."courses_modules_chapters" ADD CONSTRAINT "courses_modules_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."courses_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."courses_modules" ADD CONSTRAINT "courses_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."courses" ADD CONSTRAINT "courses_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "cms"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."courses" ADD CONSTRAINT "courses_instructor_id_teachers_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "cms"."teachers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."courses" ADD CONSTRAINT "courses_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."courses" ADD CONSTRAINT "courses_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."courses_rels" ADD CONSTRAINT "courses_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "cms"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v_version_level" ADD CONSTRAINT "_courses_v_version_level_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v_version_objectives" ADD CONSTRAINT "_courses_v_version_objectives_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v_version_modules_chapters_lessons" ADD CONSTRAINT "_courses_v_version_modules_chapters_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_courses_v_version_modules_chapters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v_version_modules_chapters" ADD CONSTRAINT "_courses_v_version_modules_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_courses_v_version_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v_version_modules" ADD CONSTRAINT "_courses_v_version_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v" ADD CONSTRAINT "_courses_v_version_language_id_languages_id_fk" FOREIGN KEY ("version_language_id") REFERENCES "cms"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v" ADD CONSTRAINT "_courses_v_version_instructor_id_teachers_id_fk" FOREIGN KEY ("version_instructor_id") REFERENCES "cms"."teachers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v" ADD CONSTRAINT "_courses_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v" ADD CONSTRAINT "_courses_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "cms"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."events" ADD CONSTRAINT "events_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."events" ADD CONSTRAINT "events_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."events" ADD CONSTRAINT "events_speaker_teacher_id_teachers_id_fk" FOREIGN KEY ("speaker_teacher_id") REFERENCES "cms"."teachers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."events" ADD CONSTRAINT "events_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "cms"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."events" ADD CONSTRAINT "events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "cms"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_events_v" ADD CONSTRAINT "_events_v_version_poster_id_media_id_fk" FOREIGN KEY ("version_poster_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_events_v" ADD CONSTRAINT "_events_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_events_v" ADD CONSTRAINT "_events_v_version_speaker_teacher_id_teachers_id_fk" FOREIGN KEY ("version_speaker_teacher_id") REFERENCES "cms"."teachers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_events_v" ADD CONSTRAINT "_events_v_version_language_id_languages_id_fk" FOREIGN KEY ("version_language_id") REFERENCES "cms"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_events_v" ADD CONSTRAINT "_events_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "cms"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."languages_levels" ADD CONSTRAINT "languages_levels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."languages_exams" ADD CONSTRAINT "languages_exams_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."languages_resources" ADD CONSTRAINT "languages_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."languages" ADD CONSTRAINT "languages_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."languages" ADD CONSTRAINT "languages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_languages_v_version_levels" ADD CONSTRAINT "_languages_v_version_levels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_languages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_languages_v_version_exams" ADD CONSTRAINT "_languages_v_version_exams_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_languages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_languages_v_version_resources" ADD CONSTRAINT "_languages_v_version_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_languages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_languages_v" ADD CONSTRAINT "_languages_v_parent_id_languages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_languages_v" ADD CONSTRAINT "_languages_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_languages_v" ADD CONSTRAINT "_languages_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_intro" ADD CONSTRAINT "pages_blocks_intro_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_intro" ADD CONSTRAINT "pages_blocks_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_contact" ADD CONSTRAINT "pages_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages_blocks_announcement" ADD CONSTRAINT "pages_blocks_announcement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."pages" ADD CONSTRAINT "pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_intro" ADD CONSTRAINT "_pages_v_blocks_intro_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_intro" ADD CONSTRAINT "_pages_v_blocks_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_contact" ADD CONSTRAINT "_pages_v_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v_blocks_announcement" ADD CONSTRAINT "_pages_v_blocks_announcement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."_pages_v" ADD CONSTRAINT "_pages_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."authors" ADD CONSTRAINT "authors_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."authors" ADD CONSTRAINT "authors_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "cms"."teachers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."categories" ADD CONSTRAINT "categories_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."staff_sessions" ADD CONSTRAINT "staff_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_staff_id_fk" FOREIGN KEY ("actor_id") REFERENCES "cms"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "cms"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teachers_fk" FOREIGN KEY ("teachers_id") REFERENCES "cms"."teachers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "cms"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "cms"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "cms"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "cms"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "cms"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "cms"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "cms"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "cms"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "cms"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "cms"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "cms"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "cms"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."home_layout_rels" ADD CONSTRAINT "home_layout_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."home_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."home_layout_rels" ADD CONSTRAINT "home_layout_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "cms"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."navigation_header" ADD CONSTRAINT "navigation_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."navigation_footer" ADD CONSTRAINT "navigation_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms"."site_settings" ADD CONSTRAINT "site_settings_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "articles_cover_idx" ON "cms"."articles" USING btree ("cover_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "cms"."articles" USING btree ("slug");
  CREATE INDEX "articles_published_at_idx" ON "cms"."articles" USING btree ("published_at");
  CREATE INDEX "articles_author_idx" ON "cms"."articles" USING btree ("author_id");
  CREATE INDEX "articles_category_idx" ON "cms"."articles" USING btree ("category_id");
  CREATE INDEX "articles_language_idx" ON "cms"."articles" USING btree ("language_id");
  CREATE INDEX "articles_seo_seo_image_idx" ON "cms"."articles" USING btree ("seo_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "cms"."articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "cms"."articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "cms"."articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "cms"."articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "cms"."articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "cms"."articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_tags_id_idx" ON "cms"."articles_rels" USING btree ("tags_id");
  CREATE INDEX "articles_rels_articles_id_idx" ON "cms"."articles_rels" USING btree ("articles_id");
  CREATE INDEX "_articles_v_parent_idx" ON "cms"."_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_cover_idx" ON "cms"."_articles_v" USING btree ("version_cover_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "cms"."_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_published_at_idx" ON "cms"."_articles_v" USING btree ("version_published_at");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "cms"."_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_articles_v_version_version_category_idx" ON "cms"."_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_articles_v_version_version_language_idx" ON "cms"."_articles_v" USING btree ("version_language_id");
  CREATE INDEX "_articles_v_version_seo_version_seo_image_idx" ON "cms"."_articles_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "cms"."_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "cms"."_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "cms"."_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "cms"."_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "cms"."_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "cms"."_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "cms"."_articles_v" USING btree ("autosave");
  CREATE INDEX "_articles_v_rels_order_idx" ON "cms"."_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "cms"."_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "cms"."_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "cms"."_articles_v_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_rels_articles_id_idx" ON "cms"."_articles_v_rels" USING btree ("articles_id");
  CREATE INDEX "teachers_levels_order_idx" ON "cms"."teachers_levels" USING btree ("order");
  CREATE INDEX "teachers_levels_parent_idx" ON "cms"."teachers_levels" USING btree ("parent_id");
  CREATE INDEX "teachers_specializations_order_idx" ON "cms"."teachers_specializations" USING btree ("_order");
  CREATE INDEX "teachers_specializations_parent_id_idx" ON "cms"."teachers_specializations" USING btree ("_parent_id");
  CREATE INDEX "teachers_qualifications_order_idx" ON "cms"."teachers_qualifications" USING btree ("_order");
  CREATE INDEX "teachers_qualifications_parent_id_idx" ON "cms"."teachers_qualifications" USING btree ("_parent_id");
  CREATE INDEX "teachers_certificates_order_idx" ON "cms"."teachers_certificates" USING btree ("_order");
  CREATE INDEX "teachers_certificates_parent_id_idx" ON "cms"."teachers_certificates" USING btree ("_parent_id");
  CREATE INDEX "teachers__order_idx" ON "cms"."teachers" USING btree ("_order");
  CREATE INDEX "teachers_photo_idx" ON "cms"."teachers" USING btree ("photo_id");
  CREATE INDEX "teachers_seo_seo_image_idx" ON "cms"."teachers" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "teachers_slug_idx" ON "cms"."teachers" USING btree ("slug");
  CREATE INDEX "teachers_fartash_user_id_idx" ON "cms"."teachers" USING btree ("fartash_user_id");
  CREATE INDEX "teachers_updated_at_idx" ON "cms"."teachers" USING btree ("updated_at");
  CREATE INDEX "teachers_created_at_idx" ON "cms"."teachers" USING btree ("created_at");
  CREATE INDEX "teachers__status_idx" ON "cms"."teachers" USING btree ("_status");
  CREATE INDEX "teachers_texts_order_parent" ON "cms"."teachers_texts" USING btree ("order","parent_id");
  CREATE INDEX "teachers_rels_order_idx" ON "cms"."teachers_rels" USING btree ("order");
  CREATE INDEX "teachers_rels_parent_idx" ON "cms"."teachers_rels" USING btree ("parent_id");
  CREATE INDEX "teachers_rels_path_idx" ON "cms"."teachers_rels" USING btree ("path");
  CREATE INDEX "teachers_rels_languages_id_idx" ON "cms"."teachers_rels" USING btree ("languages_id");
  CREATE INDEX "_teachers_v_version_levels_order_idx" ON "cms"."_teachers_v_version_levels" USING btree ("order");
  CREATE INDEX "_teachers_v_version_levels_parent_idx" ON "cms"."_teachers_v_version_levels" USING btree ("parent_id");
  CREATE INDEX "_teachers_v_version_specializations_order_idx" ON "cms"."_teachers_v_version_specializations" USING btree ("_order");
  CREATE INDEX "_teachers_v_version_specializations_parent_id_idx" ON "cms"."_teachers_v_version_specializations" USING btree ("_parent_id");
  CREATE INDEX "_teachers_v_version_qualifications_order_idx" ON "cms"."_teachers_v_version_qualifications" USING btree ("_order");
  CREATE INDEX "_teachers_v_version_qualifications_parent_id_idx" ON "cms"."_teachers_v_version_qualifications" USING btree ("_parent_id");
  CREATE INDEX "_teachers_v_version_certificates_order_idx" ON "cms"."_teachers_v_version_certificates" USING btree ("_order");
  CREATE INDEX "_teachers_v_version_certificates_parent_id_idx" ON "cms"."_teachers_v_version_certificates" USING btree ("_parent_id");
  CREATE INDEX "_teachers_v_parent_idx" ON "cms"."_teachers_v" USING btree ("parent_id");
  CREATE INDEX "_teachers_v_version_version__order_idx" ON "cms"."_teachers_v" USING btree ("version__order");
  CREATE INDEX "_teachers_v_version_version_photo_idx" ON "cms"."_teachers_v" USING btree ("version_photo_id");
  CREATE INDEX "_teachers_v_version_seo_version_seo_image_idx" ON "cms"."_teachers_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_teachers_v_version_version_slug_idx" ON "cms"."_teachers_v" USING btree ("version_slug");
  CREATE INDEX "_teachers_v_version_version_fartash_user_id_idx" ON "cms"."_teachers_v" USING btree ("version_fartash_user_id");
  CREATE INDEX "_teachers_v_version_version_updated_at_idx" ON "cms"."_teachers_v" USING btree ("version_updated_at");
  CREATE INDEX "_teachers_v_version_version_created_at_idx" ON "cms"."_teachers_v" USING btree ("version_created_at");
  CREATE INDEX "_teachers_v_version_version__status_idx" ON "cms"."_teachers_v" USING btree ("version__status");
  CREATE INDEX "_teachers_v_created_at_idx" ON "cms"."_teachers_v" USING btree ("created_at");
  CREATE INDEX "_teachers_v_updated_at_idx" ON "cms"."_teachers_v" USING btree ("updated_at");
  CREATE INDEX "_teachers_v_latest_idx" ON "cms"."_teachers_v" USING btree ("latest");
  CREATE INDEX "_teachers_v_autosave_idx" ON "cms"."_teachers_v" USING btree ("autosave");
  CREATE INDEX "_teachers_v_texts_order_parent" ON "cms"."_teachers_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_teachers_v_rels_order_idx" ON "cms"."_teachers_v_rels" USING btree ("order");
  CREATE INDEX "_teachers_v_rels_parent_idx" ON "cms"."_teachers_v_rels" USING btree ("parent_id");
  CREATE INDEX "_teachers_v_rels_path_idx" ON "cms"."_teachers_v_rels" USING btree ("path");
  CREATE INDEX "_teachers_v_rels_languages_id_idx" ON "cms"."_teachers_v_rels" USING btree ("languages_id");
  CREATE INDEX "courses_level_order_idx" ON "cms"."courses_level" USING btree ("order");
  CREATE INDEX "courses_level_parent_idx" ON "cms"."courses_level" USING btree ("parent_id");
  CREATE INDEX "courses_objectives_order_idx" ON "cms"."courses_objectives" USING btree ("_order");
  CREATE INDEX "courses_objectives_parent_id_idx" ON "cms"."courses_objectives" USING btree ("_parent_id");
  CREATE INDEX "courses_modules_chapters_lessons_order_idx" ON "cms"."courses_modules_chapters_lessons" USING btree ("_order");
  CREATE INDEX "courses_modules_chapters_lessons_parent_id_idx" ON "cms"."courses_modules_chapters_lessons" USING btree ("_parent_id");
  CREATE INDEX "courses_modules_chapters_order_idx" ON "cms"."courses_modules_chapters" USING btree ("_order");
  CREATE INDEX "courses_modules_chapters_parent_id_idx" ON "cms"."courses_modules_chapters" USING btree ("_parent_id");
  CREATE INDEX "courses_modules_order_idx" ON "cms"."courses_modules" USING btree ("_order");
  CREATE INDEX "courses_modules_parent_id_idx" ON "cms"."courses_modules" USING btree ("_parent_id");
  CREATE INDEX "courses__order_idx" ON "cms"."courses" USING btree ("_order");
  CREATE INDEX "courses_language_idx" ON "cms"."courses" USING btree ("language_id");
  CREATE INDEX "courses_instructor_idx" ON "cms"."courses" USING btree ("instructor_id");
  CREATE INDEX "courses_cover_idx" ON "cms"."courses" USING btree ("cover_id");
  CREATE INDEX "courses_seo_seo_image_idx" ON "cms"."courses" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "cms"."courses" USING btree ("slug");
  CREATE INDEX "courses_published_at_idx" ON "cms"."courses" USING btree ("published_at");
  CREATE INDEX "courses_updated_at_idx" ON "cms"."courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "cms"."courses" USING btree ("created_at");
  CREATE INDEX "courses__status_idx" ON "cms"."courses" USING btree ("_status");
  CREATE INDEX "courses_rels_order_idx" ON "cms"."courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "cms"."courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "cms"."courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_private_files_id_idx" ON "cms"."courses_rels" USING btree ("private_files_id");
  CREATE INDEX "_courses_v_version_level_order_idx" ON "cms"."_courses_v_version_level" USING btree ("order");
  CREATE INDEX "_courses_v_version_level_parent_idx" ON "cms"."_courses_v_version_level" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_objectives_order_idx" ON "cms"."_courses_v_version_objectives" USING btree ("_order");
  CREATE INDEX "_courses_v_version_objectives_parent_id_idx" ON "cms"."_courses_v_version_objectives" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_modules_chapters_lessons_order_idx" ON "cms"."_courses_v_version_modules_chapters_lessons" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_chapters_lessons_parent_id_idx" ON "cms"."_courses_v_version_modules_chapters_lessons" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_modules_chapters_order_idx" ON "cms"."_courses_v_version_modules_chapters" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_chapters_parent_id_idx" ON "cms"."_courses_v_version_modules_chapters" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_modules_order_idx" ON "cms"."_courses_v_version_modules" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_parent_id_idx" ON "cms"."_courses_v_version_modules" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_parent_idx" ON "cms"."_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_version__order_idx" ON "cms"."_courses_v" USING btree ("version__order");
  CREATE INDEX "_courses_v_version_version_language_idx" ON "cms"."_courses_v" USING btree ("version_language_id");
  CREATE INDEX "_courses_v_version_version_instructor_idx" ON "cms"."_courses_v" USING btree ("version_instructor_id");
  CREATE INDEX "_courses_v_version_version_cover_idx" ON "cms"."_courses_v" USING btree ("version_cover_id");
  CREATE INDEX "_courses_v_version_seo_version_seo_image_idx" ON "cms"."_courses_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "cms"."_courses_v" USING btree ("version_slug");
  CREATE INDEX "_courses_v_version_version_published_at_idx" ON "cms"."_courses_v" USING btree ("version_published_at");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "cms"."_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "cms"."_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_version_version__status_idx" ON "cms"."_courses_v" USING btree ("version__status");
  CREATE INDEX "_courses_v_created_at_idx" ON "cms"."_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "cms"."_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_latest_idx" ON "cms"."_courses_v" USING btree ("latest");
  CREATE INDEX "_courses_v_autosave_idx" ON "cms"."_courses_v" USING btree ("autosave");
  CREATE INDEX "_courses_v_rels_order_idx" ON "cms"."_courses_v_rels" USING btree ("order");
  CREATE INDEX "_courses_v_rels_parent_idx" ON "cms"."_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX "_courses_v_rels_path_idx" ON "cms"."_courses_v_rels" USING btree ("path");
  CREATE INDEX "_courses_v_rels_private_files_id_idx" ON "cms"."_courses_v_rels" USING btree ("private_files_id");
  CREATE INDEX "events__order_idx" ON "cms"."events" USING btree ("_order");
  CREATE INDEX "events_poster_idx" ON "cms"."events" USING btree ("poster_id");
  CREATE INDEX "events_starts_at_idx" ON "cms"."events" USING btree ("starts_at");
  CREATE INDEX "events_seo_seo_image_idx" ON "cms"."events" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "cms"."events" USING btree ("slug");
  CREATE INDEX "events_published_at_idx" ON "cms"."events" USING btree ("published_at");
  CREATE INDEX "events_speaker_teacher_idx" ON "cms"."events" USING btree ("speaker_teacher_id");
  CREATE INDEX "events_language_idx" ON "cms"."events" USING btree ("language_id");
  CREATE INDEX "events_category_idx" ON "cms"."events" USING btree ("category_id");
  CREATE INDEX "events_updated_at_idx" ON "cms"."events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "cms"."events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "cms"."events" USING btree ("_status");
  CREATE INDEX "_events_v_parent_idx" ON "cms"."_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version__order_idx" ON "cms"."_events_v" USING btree ("version__order");
  CREATE INDEX "_events_v_version_version_poster_idx" ON "cms"."_events_v" USING btree ("version_poster_id");
  CREATE INDEX "_events_v_version_version_starts_at_idx" ON "cms"."_events_v" USING btree ("version_starts_at");
  CREATE INDEX "_events_v_version_seo_version_seo_image_idx" ON "cms"."_events_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "cms"."_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_published_at_idx" ON "cms"."_events_v" USING btree ("version_published_at");
  CREATE INDEX "_events_v_version_version_speaker_teacher_idx" ON "cms"."_events_v" USING btree ("version_speaker_teacher_id");
  CREATE INDEX "_events_v_version_version_language_idx" ON "cms"."_events_v" USING btree ("version_language_id");
  CREATE INDEX "_events_v_version_version_category_idx" ON "cms"."_events_v" USING btree ("version_category_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "cms"."_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "cms"."_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "cms"."_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "cms"."_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "cms"."_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "cms"."_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_autosave_idx" ON "cms"."_events_v" USING btree ("autosave");
  CREATE INDEX "languages_levels_order_idx" ON "cms"."languages_levels" USING btree ("_order");
  CREATE INDEX "languages_levels_parent_id_idx" ON "cms"."languages_levels" USING btree ("_parent_id");
  CREATE INDEX "languages_exams_order_idx" ON "cms"."languages_exams" USING btree ("_order");
  CREATE INDEX "languages_exams_parent_id_idx" ON "cms"."languages_exams" USING btree ("_parent_id");
  CREATE INDEX "languages_resources_order_idx" ON "cms"."languages_resources" USING btree ("_order");
  CREATE INDEX "languages_resources_parent_id_idx" ON "cms"."languages_resources" USING btree ("_parent_id");
  CREATE INDEX "languages__order_idx" ON "cms"."languages" USING btree ("_order");
  CREATE INDEX "languages_image_idx" ON "cms"."languages" USING btree ("image_id");
  CREATE UNIQUE INDEX "languages_slug_idx" ON "cms"."languages" USING btree ("slug");
  CREATE INDEX "languages_seo_seo_image_idx" ON "cms"."languages" USING btree ("seo_image_id");
  CREATE INDEX "languages_updated_at_idx" ON "cms"."languages" USING btree ("updated_at");
  CREATE INDEX "languages_created_at_idx" ON "cms"."languages" USING btree ("created_at");
  CREATE INDEX "languages__status_idx" ON "cms"."languages" USING btree ("_status");
  CREATE INDEX "_languages_v_version_levels_order_idx" ON "cms"."_languages_v_version_levels" USING btree ("_order");
  CREATE INDEX "_languages_v_version_levels_parent_id_idx" ON "cms"."_languages_v_version_levels" USING btree ("_parent_id");
  CREATE INDEX "_languages_v_version_exams_order_idx" ON "cms"."_languages_v_version_exams" USING btree ("_order");
  CREATE INDEX "_languages_v_version_exams_parent_id_idx" ON "cms"."_languages_v_version_exams" USING btree ("_parent_id");
  CREATE INDEX "_languages_v_version_resources_order_idx" ON "cms"."_languages_v_version_resources" USING btree ("_order");
  CREATE INDEX "_languages_v_version_resources_parent_id_idx" ON "cms"."_languages_v_version_resources" USING btree ("_parent_id");
  CREATE INDEX "_languages_v_parent_idx" ON "cms"."_languages_v" USING btree ("parent_id");
  CREATE INDEX "_languages_v_version_version__order_idx" ON "cms"."_languages_v" USING btree ("version__order");
  CREATE INDEX "_languages_v_version_version_image_idx" ON "cms"."_languages_v" USING btree ("version_image_id");
  CREATE INDEX "_languages_v_version_version_slug_idx" ON "cms"."_languages_v" USING btree ("version_slug");
  CREATE INDEX "_languages_v_version_seo_version_seo_image_idx" ON "cms"."_languages_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_languages_v_version_version_updated_at_idx" ON "cms"."_languages_v" USING btree ("version_updated_at");
  CREATE INDEX "_languages_v_version_version_created_at_idx" ON "cms"."_languages_v" USING btree ("version_created_at");
  CREATE INDEX "_languages_v_version_version__status_idx" ON "cms"."_languages_v" USING btree ("version__status");
  CREATE INDEX "_languages_v_created_at_idx" ON "cms"."_languages_v" USING btree ("created_at");
  CREATE INDEX "_languages_v_updated_at_idx" ON "cms"."_languages_v" USING btree ("updated_at");
  CREATE INDEX "_languages_v_latest_idx" ON "cms"."_languages_v" USING btree ("latest");
  CREATE INDEX "_languages_v_autosave_idx" ON "cms"."_languages_v" USING btree ("autosave");
  CREATE INDEX "pages_blocks_intro_order_idx" ON "cms"."pages_blocks_intro" USING btree ("_order");
  CREATE INDEX "pages_blocks_intro_parent_id_idx" ON "cms"."pages_blocks_intro" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_intro_path_idx" ON "cms"."pages_blocks_intro" USING btree ("_path");
  CREATE INDEX "pages_blocks_intro_image_idx" ON "cms"."pages_blocks_intro" USING btree ("image_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "cms"."pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "cms"."pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "cms"."pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "cms"."pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "cms"."pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "cms"."pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "cms"."pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "cms"."pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "cms"."pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "cms"."pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "cms"."pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_order_idx" ON "cms"."pages_blocks_contact" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_parent_id_idx" ON "cms"."pages_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_path_idx" ON "cms"."pages_blocks_contact" USING btree ("_path");
  CREATE INDEX "pages_blocks_announcement_order_idx" ON "cms"."pages_blocks_announcement" USING btree ("_order");
  CREATE INDEX "pages_blocks_announcement_parent_id_idx" ON "cms"."pages_blocks_announcement" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_announcement_path_idx" ON "cms"."pages_blocks_announcement" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "cms"."pages" USING btree ("slug");
  CREATE INDEX "pages_published_at_idx" ON "cms"."pages" USING btree ("published_at");
  CREATE INDEX "pages_seo_seo_image_idx" ON "cms"."pages" USING btree ("seo_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "cms"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "cms"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "cms"."pages" USING btree ("_status");
  CREATE INDEX "_pages_v_blocks_intro_order_idx" ON "cms"."_pages_v_blocks_intro" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_intro_parent_id_idx" ON "cms"."_pages_v_blocks_intro" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_intro_path_idx" ON "cms"."_pages_v_blocks_intro" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_intro_image_idx" ON "cms"."_pages_v_blocks_intro" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "cms"."_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "cms"."_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "cms"."_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "cms"."_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "cms"."_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "cms"."_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "cms"."_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "cms"."_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "cms"."_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "cms"."_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "cms"."_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_order_idx" ON "cms"."_pages_v_blocks_contact" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_parent_id_idx" ON "cms"."_pages_v_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_path_idx" ON "cms"."_pages_v_blocks_contact" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_announcement_order_idx" ON "cms"."_pages_v_blocks_announcement" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_announcement_parent_id_idx" ON "cms"."_pages_v_blocks_announcement" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_announcement_path_idx" ON "cms"."_pages_v_blocks_announcement" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "cms"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "cms"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_published_at_idx" ON "cms"."_pages_v" USING btree ("version_published_at");
  CREATE INDEX "_pages_v_version_seo_version_seo_image_idx" ON "cms"."_pages_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "cms"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "cms"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "cms"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "cms"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "cms"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "cms"."_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "cms"."_pages_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "cms"."authors" USING btree ("slug");
  CREATE INDEX "authors_avatar_idx" ON "cms"."authors" USING btree ("avatar_id");
  CREATE INDEX "authors_teacher_idx" ON "cms"."authors" USING btree ("teacher_id");
  CREATE INDEX "authors_updated_at_idx" ON "cms"."authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "cms"."authors" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "cms"."categories" USING btree ("slug");
  CREATE INDEX "categories_seo_seo_image_idx" ON "cms"."categories" USING btree ("seo_image_id");
  CREATE INDEX "categories_updated_at_idx" ON "cms"."categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "cms"."categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "cms"."tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "cms"."tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "cms"."tags" USING btree ("created_at");
  CREATE INDEX "media_checksum_idx" ON "cms"."media" USING btree ("checksum");
  CREATE INDEX "media_updated_at_idx" ON "cms"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "cms"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "cms"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "cms"."media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "cms"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "cms"."media" USING btree ("sizes_wide_filename");
  CREATE INDEX "private_files_updated_at_idx" ON "cms"."private_files" USING btree ("updated_at");
  CREATE INDEX "private_files_created_at_idx" ON "cms"."private_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "private_files_filename_idx" ON "cms"."private_files" USING btree ("filename");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "cms"."redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "cms"."redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "cms"."redirects" USING btree ("created_at");
  CREATE INDEX "staff_sessions_order_idx" ON "cms"."staff_sessions" USING btree ("_order");
  CREATE INDEX "staff_sessions_parent_id_idx" ON "cms"."staff_sessions" USING btree ("_parent_id");
  CREATE INDEX "staff_fartash_user_id_idx" ON "cms"."staff" USING btree ("fartash_user_id");
  CREATE INDEX "staff_updated_at_idx" ON "cms"."staff" USING btree ("updated_at");
  CREATE INDEX "staff_created_at_idx" ON "cms"."staff" USING btree ("created_at");
  CREATE UNIQUE INDEX "staff_email_idx" ON "cms"."staff" USING btree ("email");
  CREATE INDEX "audit_logs_action_idx" ON "cms"."audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_entity_idx" ON "cms"."audit_logs" USING btree ("entity");
  CREATE INDEX "audit_logs_entity_id_idx" ON "cms"."audit_logs" USING btree ("entity_id");
  CREATE INDEX "audit_logs_actor_idx" ON "cms"."audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "cms"."audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "cms"."audit_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "cms"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "cms"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "cms"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "cms"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "cms"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "cms"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "cms"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "cms"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "cms"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "cms"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "cms"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "cms"."payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "cms"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "cms"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "cms"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "cms"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "cms"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "cms"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_teachers_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("teachers_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_languages_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("languages_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_private_files_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("private_files_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_staff_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("staff_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "cms"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "cms"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "cms"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "cms"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "cms"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "cms"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_staff_id_idx" ON "cms"."payload_preferences_rels" USING btree ("staff_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "cms"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "cms"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_layout_rels_order_idx" ON "cms"."home_layout_rels" USING btree ("order");
  CREATE INDEX "home_layout_rels_parent_idx" ON "cms"."home_layout_rels" USING btree ("parent_id");
  CREATE INDEX "home_layout_rels_path_idx" ON "cms"."home_layout_rels" USING btree ("path");
  CREATE INDEX "home_layout_rels_courses_id_idx" ON "cms"."home_layout_rels" USING btree ("courses_id");
  CREATE INDEX "navigation_header_order_idx" ON "cms"."navigation_header" USING btree ("_order");
  CREATE INDEX "navigation_header_parent_id_idx" ON "cms"."navigation_header" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_order_idx" ON "cms"."navigation_footer" USING btree ("_order");
  CREATE INDEX "navigation_footer_parent_id_idx" ON "cms"."navigation_footer" USING btree ("_parent_id");
  CREATE INDEX "site_settings_seo_seo_image_idx" ON "cms"."site_settings" USING btree ("seo_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms"."articles" CASCADE;
  DROP TABLE "cms"."articles_rels" CASCADE;
  DROP TABLE "cms"."_articles_v" CASCADE;
  DROP TABLE "cms"."_articles_v_rels" CASCADE;
  DROP TABLE "cms"."teachers_levels" CASCADE;
  DROP TABLE "cms"."teachers_specializations" CASCADE;
  DROP TABLE "cms"."teachers_qualifications" CASCADE;
  DROP TABLE "cms"."teachers_certificates" CASCADE;
  DROP TABLE "cms"."teachers" CASCADE;
  DROP TABLE "cms"."teachers_texts" CASCADE;
  DROP TABLE "cms"."teachers_rels" CASCADE;
  DROP TABLE "cms"."_teachers_v_version_levels" CASCADE;
  DROP TABLE "cms"."_teachers_v_version_specializations" CASCADE;
  DROP TABLE "cms"."_teachers_v_version_qualifications" CASCADE;
  DROP TABLE "cms"."_teachers_v_version_certificates" CASCADE;
  DROP TABLE "cms"."_teachers_v" CASCADE;
  DROP TABLE "cms"."_teachers_v_texts" CASCADE;
  DROP TABLE "cms"."_teachers_v_rels" CASCADE;
  DROP TABLE "cms"."courses_level" CASCADE;
  DROP TABLE "cms"."courses_objectives" CASCADE;
  DROP TABLE "cms"."courses_modules_chapters_lessons" CASCADE;
  DROP TABLE "cms"."courses_modules_chapters" CASCADE;
  DROP TABLE "cms"."courses_modules" CASCADE;
  DROP TABLE "cms"."courses" CASCADE;
  DROP TABLE "cms"."courses_rels" CASCADE;
  DROP TABLE "cms"."_courses_v_version_level" CASCADE;
  DROP TABLE "cms"."_courses_v_version_objectives" CASCADE;
  DROP TABLE "cms"."_courses_v_version_modules_chapters_lessons" CASCADE;
  DROP TABLE "cms"."_courses_v_version_modules_chapters" CASCADE;
  DROP TABLE "cms"."_courses_v_version_modules" CASCADE;
  DROP TABLE "cms"."_courses_v" CASCADE;
  DROP TABLE "cms"."_courses_v_rels" CASCADE;
  DROP TABLE "cms"."events" CASCADE;
  DROP TABLE "cms"."_events_v" CASCADE;
  DROP TABLE "cms"."languages_levels" CASCADE;
  DROP TABLE "cms"."languages_exams" CASCADE;
  DROP TABLE "cms"."languages_resources" CASCADE;
  DROP TABLE "cms"."languages" CASCADE;
  DROP TABLE "cms"."_languages_v_version_levels" CASCADE;
  DROP TABLE "cms"."_languages_v_version_exams" CASCADE;
  DROP TABLE "cms"."_languages_v_version_resources" CASCADE;
  DROP TABLE "cms"."_languages_v" CASCADE;
  DROP TABLE "cms"."pages_blocks_intro" CASCADE;
  DROP TABLE "cms"."pages_blocks_rich_text" CASCADE;
  DROP TABLE "cms"."pages_blocks_faq_items" CASCADE;
  DROP TABLE "cms"."pages_blocks_faq" CASCADE;
  DROP TABLE "cms"."pages_blocks_cta" CASCADE;
  DROP TABLE "cms"."pages_blocks_contact" CASCADE;
  DROP TABLE "cms"."pages_blocks_announcement" CASCADE;
  DROP TABLE "cms"."pages" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_intro" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_faq" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_cta" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_contact" CASCADE;
  DROP TABLE "cms"."_pages_v_blocks_announcement" CASCADE;
  DROP TABLE "cms"."_pages_v" CASCADE;
  DROP TABLE "cms"."authors" CASCADE;
  DROP TABLE "cms"."categories" CASCADE;
  DROP TABLE "cms"."tags" CASCADE;
  DROP TABLE "cms"."media" CASCADE;
  DROP TABLE "cms"."private_files" CASCADE;
  DROP TABLE "cms"."redirects" CASCADE;
  DROP TABLE "cms"."staff_sessions" CASCADE;
  DROP TABLE "cms"."staff" CASCADE;
  DROP TABLE "cms"."audit_logs" CASCADE;
  DROP TABLE "cms"."payload_kv" CASCADE;
  DROP TABLE "cms"."payload_jobs_log" CASCADE;
  DROP TABLE "cms"."payload_jobs" CASCADE;
  DROP TABLE "cms"."payload_locked_documents" CASCADE;
  DROP TABLE "cms"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "cms"."payload_preferences" CASCADE;
  DROP TABLE "cms"."payload_preferences_rels" CASCADE;
  DROP TABLE "cms"."payload_migrations" CASCADE;
  DROP TABLE "cms"."home_layout" CASCADE;
  DROP TABLE "cms"."home_layout_rels" CASCADE;
  DROP TABLE "cms"."navigation_header" CASCADE;
  DROP TABLE "cms"."navigation_footer" CASCADE;
  DROP TABLE "cms"."navigation" CASCADE;
  DROP TABLE "cms"."site_settings" CASCADE;
  DROP TABLE "cms"."feature_flags" CASCADE;
  DROP TYPE "cms"."enum_articles_status";
  DROP TYPE "cms"."enum__articles_v_version_status";
  DROP TYPE "cms"."enum_teachers_levels";
  DROP TYPE "cms"."enum_teachers_profile_state";
  DROP TYPE "cms"."enum_teachers_status";
  DROP TYPE "cms"."enum__teachers_v_version_levels";
  DROP TYPE "cms"."enum__teachers_v_version_profile_state";
  DROP TYPE "cms"."enum__teachers_v_version_status";
  DROP TYPE "cms"."enum_courses_level";
  DROP TYPE "cms"."enum_courses_modules_chapters_lessons_video_provider";
  DROP TYPE "cms"."enum_courses_difficulty";
  DROP TYPE "cms"."enum_courses_discount_kind";
  DROP TYPE "cms"."enum_courses_enrollment";
  DROP TYPE "cms"."enum_courses_workflow_status";
  DROP TYPE "cms"."enum_courses_status";
  DROP TYPE "cms"."enum__courses_v_version_level";
  DROP TYPE "cms"."enum__courses_v_version_modules_chapters_lessons_video_provider";
  DROP TYPE "cms"."enum__courses_v_version_difficulty";
  DROP TYPE "cms"."enum__courses_v_version_discount_kind";
  DROP TYPE "cms"."enum__courses_v_version_enrollment";
  DROP TYPE "cms"."enum__courses_v_version_workflow_status";
  DROP TYPE "cms"."enum__courses_v_version_status";
  DROP TYPE "cms"."enum_events_type";
  DROP TYPE "cms"."enum_events_format";
  DROP TYPE "cms"."enum_events_registration";
  DROP TYPE "cms"."enum_events_status";
  DROP TYPE "cms"."enum__events_v_version_type";
  DROP TYPE "cms"."enum__events_v_version_format";
  DROP TYPE "cms"."enum__events_v_version_registration";
  DROP TYPE "cms"."enum__events_v_version_status";
  DROP TYPE "cms"."enum_languages_levels_code";
  DROP TYPE "cms"."enum_languages_flag";
  DROP TYPE "cms"."enum_languages_status";
  DROP TYPE "cms"."enum__languages_v_version_levels_code";
  DROP TYPE "cms"."enum__languages_v_version_flag";
  DROP TYPE "cms"."enum__languages_v_version_status";
  DROP TYPE "cms"."enum_pages_blocks_announcement_tone";
  DROP TYPE "cms"."enum_pages_kind";
  DROP TYPE "cms"."enum_pages_status";
  DROP TYPE "cms"."enum__pages_v_blocks_announcement_tone";
  DROP TYPE "cms"."enum__pages_v_version_kind";
  DROP TYPE "cms"."enum__pages_v_version_status";
  DROP TYPE "cms"."enum_media_category";
  DROP TYPE "cms"."enum_redirects_type";
  DROP TYPE "cms"."enum_staff_role";
  DROP TYPE "cms"."enum_payload_jobs_log_task_slug";
  DROP TYPE "cms"."enum_payload_jobs_log_state";
  DROP TYPE "cms"."enum_payload_jobs_task_slug";
  DROP TYPE "cms"."enum_home_layout_courses_selection";
  DROP TYPE "cms"."enum_home_layout_courses_position";`)
}
