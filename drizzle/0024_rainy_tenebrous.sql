CREATE TABLE IF NOT EXISTS "background_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"initiated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "background_jobs_status_created_at_idx" ON "background_jobs" ("status","created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
