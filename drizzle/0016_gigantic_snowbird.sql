CREATE TABLE IF NOT EXISTS "student_participation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"instruction_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"date" date NOT NULL,
	"participation_score" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_participation_score_check" CHECK ("participation_score" >= 1 AND "participation_score" <= 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_participation_instruction_student_date_unique" ON "student_participation" ("instruction_id","student_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_participation_instruction_id_idx" ON "student_participation" ("instruction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_participation_student_id_idx" ON "student_participation" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_participation_date_idx" ON "student_participation" ("date");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_participation" ADD CONSTRAINT "student_participation_instruction_id_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "instructions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_participation" ADD CONSTRAINT "student_participation_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
