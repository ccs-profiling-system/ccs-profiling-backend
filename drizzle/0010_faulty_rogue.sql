CREATE TABLE IF NOT EXISTS "research" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"abstract" text,
	"research_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ongoing',
	"start_date" date,
	"completion_date" date,
	"publication_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_advisers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"adviser_role" varchar(100) DEFAULT 'adviser',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "research_advisers_research_faculty_unique" UNIQUE("research_id","faculty_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_authors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"author_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "research_authors_research_student_unique" UNIQUE("research_id","student_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_title_idx" ON "research" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_status_idx" ON "research" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_advisers_research_id_idx" ON "research_advisers" ("research_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_advisers_faculty_id_idx" ON "research_advisers" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_authors_research_id_idx" ON "research_authors" ("research_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_authors_student_id_idx" ON "research_authors" ("student_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_advisers" ADD CONSTRAINT "research_advisers_research_id_research_id_fk" FOREIGN KEY ("research_id") REFERENCES "research"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_advisers" ADD CONSTRAINT "research_advisers_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_authors" ADD CONSTRAINT "research_authors_research_id_research_id_fk" FOREIGN KEY ("research_id") REFERENCES "research"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_authors" ADD CONSTRAINT "research_authors_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
