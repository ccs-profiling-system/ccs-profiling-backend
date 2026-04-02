CREATE TABLE IF NOT EXISTS "violations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"violation_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"violation_date" date NOT NULL,
	"resolution_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"resolution_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "violations_student_id_idx" ON "violations" ("student_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "violations" ADD CONSTRAINT "violations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
