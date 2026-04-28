ALTER TABLE "schedules" DROP CONSTRAINT "schedules_instruction_id_instructions_id_fk";
--> statement-breakpoint
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_faculty_id_faculty_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "schedules_instruction_id_idx";--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "subject_id" uuid;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "room_id" uuid;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "recurrence_pattern" varchar(20);--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "recurrence_end_date" date;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_room_id_idx" ON "schedules" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_subject_id_idx" ON "schedules" ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_is_recurring_idx" ON "schedules" ("is_recurring");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN IF EXISTS "instruction_id";