CREATE TABLE IF NOT EXISTS "academic_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" varchar(50) NOT NULL,
	"subject_name" varchar(200) NOT NULL,
	"grade" numeric(4, 2) NOT NULL,
	"semester" varchar(20) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"credits" integer NOT NULL,
	"remarks" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "academic_history_student_id_idx" ON "academic_history" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "academic_history_semester_academic_year_idx" ON "academic_history" ("semester","academic_year");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
