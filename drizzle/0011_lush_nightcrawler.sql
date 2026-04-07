CREATE TABLE IF NOT EXISTS "uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_path" varchar(500) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_entity_type_idx" ON "uploads" ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_entity_id_idx" ON "uploads" ("entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_entity_composite_idx" ON "uploads" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_uploaded_by_idx" ON "uploads" ("uploaded_by");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
