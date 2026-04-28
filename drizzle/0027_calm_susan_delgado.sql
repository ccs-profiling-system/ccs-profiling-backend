CREATE TABLE IF NOT EXISTS "curriculum" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"program" varchar(100) NOT NULL,
	"year" varchar(10) NOT NULL,
	"total_units" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"effective_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"units" integer NOT NULL,
	"semester" integer NOT NULL,
	"year_level" integer NOT NULL,
	"description" text,
	"prerequisites" text[],
	"corequisites" text[],
	"type" varchar(50) NOT NULL,
	"lecture_hours" integer DEFAULT 0 NOT NULL,
	"laboratory_hours" integer DEFAULT 0 NOT NULL,
	"objectives" text[],
	"topics" text[],
	"curriculum_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "syllabus" (
	"id" uuid PRIMARY KEY NOT NULL,
	"subject_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content_type" varchar(20) NOT NULL,
	"file_url" text,
	"file_name" varchar(255),
	"file_size" bigint,
	"file_type" varchar(100),
	"external_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lessons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"subject_id" uuid NOT NULL,
	"week" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"file_url" text,
	"file_name" varchar(255),
	"file_size" bigint,
	"external_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"building" varchar(100),
	"capacity" integer,
	"type" varchar(50),
	"facilities" text[],
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_occurrences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schedule_id" uuid NOT NULL,
	"occurrence_date" date NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "curriculum_code_unique" ON "curriculum" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "curriculum_program_idx" ON "curriculum" ("program");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "curriculum_year_idx" ON "curriculum" ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "curriculum_status_idx" ON "curriculum" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_unique" ON "subjects" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_code_idx" ON "subjects" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_curriculum_id_idx" ON "subjects" ("curriculum_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_semester_idx" ON "subjects" ("semester");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_year_level_idx" ON "subjects" ("year_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_type_idx" ON "subjects" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "syllabus_subject_id_unique" ON "syllabus" ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "syllabus_subject_id_idx" ON "syllabus" ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_subject_id_idx" ON "lessons" ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_week_idx" ON "lessons" ("week");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lessons_type_idx" ON "lessons" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rooms_name_unique" ON "rooms" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rooms_building_idx" ON "rooms" ("building");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rooms_type_idx" ON "rooms" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rooms_status_idx" ON "rooms" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "schedule_occurrences_schedule_id_date_unique" ON "schedule_occurrences" ("schedule_id","occurrence_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_occurrences_schedule_id_idx" ON "schedule_occurrences" ("schedule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_occurrences_date_idx" ON "schedule_occurrences" ("occurrence_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedule_occurrences_is_cancelled_idx" ON "schedule_occurrences" ("is_cancelled");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subjects" ADD CONSTRAINT "subjects_curriculum_id_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "curriculum"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "syllabus" ADD CONSTRAINT "syllabus_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_occurrences" ADD CONSTRAINT "schedule_occurrences_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
