CREATE TABLE IF NOT EXISTS "pending_changes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'pending_approval' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_changes_entity_type_idx" ON "pending_changes" ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_changes_entity_id_idx" ON "pending_changes" ("entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_changes_status_idx" ON "pending_changes" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_changes_created_by_idx" ON "pending_changes" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_changes_created_at_idx" ON "pending_changes" ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_changes" ADD CONSTRAINT "pending_changes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
