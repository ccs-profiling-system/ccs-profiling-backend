CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"instruction_id" uuid NOT NULL,
	"enrollment_status" varchar(50) DEFAULT 'enrolled' NOT NULL,
	"semester" varchar(20) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_student_instruction_semester_year_unique" ON "enrollments" ("student_id","instruction_id","semester","academic_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_student_id_idx" ON "enrollments" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_instruction_id_idx" ON "enrollments" ("instruction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_semester_academic_year_idx" ON "enrollments" ("semester","academic_year");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_instruction_id_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "instructions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
