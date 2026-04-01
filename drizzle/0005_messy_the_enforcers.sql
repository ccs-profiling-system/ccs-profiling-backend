CREATE TABLE IF NOT EXISTS "schedules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schedule_type" varchar(50) NOT NULL,
	"instruction_id" uuid,
	"faculty_id" uuid,
	"room" varchar(100) NOT NULL,
	"day" varchar(20) NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"semester" varchar(20) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_room_idx" ON "schedules" ("room");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_faculty_id_idx" ON "schedules" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_day_idx" ON "schedules" ("day");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_semester_academic_year_idx" ON "schedules" ("semester","academic_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_instruction_id_idx" ON "schedules" ("instruction_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instruction_id_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "instructions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
