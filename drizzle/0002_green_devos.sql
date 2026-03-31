CREATE TABLE IF NOT EXISTS "instructions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"subject_code" varchar(50) NOT NULL,
	"subject_name" varchar(255) NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"curriculum_year" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "instructions_subject_code_curriculum_year_unique" ON "instructions" ("subject_code","curriculum_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instructions_subject_code_idx" ON "instructions" ("subject_code");