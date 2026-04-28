CREATE TABLE IF NOT EXISTS "approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"change_details" jsonb NOT NULL,
	"original_data" jsonb,
	"status" varchar(50) NOT NULL,
	"submitter_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"submission_timestamp" timestamp DEFAULT now(),
	"decision_timestamp" timestamp,
	"application_timestamp" timestamp,
	"comments" text,
	"department_id" uuid,
	"entity_version" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"failure_reason" text,
	"idempotency_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "approvals_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_status" ON "approvals" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_submitter" ON "approvals" ("submitter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_reviewer" ON "approvals" ("reviewer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_department" ON "approvals" ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_submission_ts" ON "approvals" ("submission_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_idempotency" ON "approvals" ("idempotency_key");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approvals" ADD CONSTRAINT "approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
