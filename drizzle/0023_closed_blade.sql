CREATE TABLE IF NOT EXISTS "approval_notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"change_request_id" uuid,
	"type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"read_status" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approval_notifications_user_read_created" ON "approval_notifications" ("user_id","read_status","created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_notifications" ADD CONSTRAINT "approval_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "approval_notifications" ADD CONSTRAINT "approval_notifications_change_request_id_approvals_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "approvals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
