CREATE TABLE IF NOT EXISTS "event_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"student_id" uuid,
	"faculty_id" uuid,
	"participation_role" varchar(100),
	"attendance_status" varchar(50) DEFAULT 'registered',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"location" varchar(255),
	"max_participants" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_participants_event_id_idx" ON "event_participants" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_participants_student_id_idx" ON "event_participants" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_participants_faculty_id_idx" ON "event_participants" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_name_idx" ON "events" ("event_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_date_idx" ON "events" ("event_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_type_idx" ON "events" ("event_type");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
