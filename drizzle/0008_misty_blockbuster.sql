CREATE TABLE IF NOT EXISTS "affiliations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"organization_name" varchar(200) NOT NULL,
	"role" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliations_student_id_idx" ON "affiliations" ("student_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
