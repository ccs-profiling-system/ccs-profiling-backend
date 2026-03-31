CREATE TABLE IF NOT EXISTS "entity_counters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"year" integer NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "entity_counters_entity_type_year_unique" UNIQUE("entity_type","year")
);
--> statement-breakpoint
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "faculty" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "faculty" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ALTER COLUMN "department" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "middle_name" varchar(100);--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "position" varchar(100);--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "specialization" varchar(255);--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "status" varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_faculty_id_idx" ON "faculty" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_first_name_idx" ON "faculty" ("first_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_last_name_idx" ON "faculty" ("last_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_department_idx" ON "faculty" ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_user_id_idx" ON "faculty" ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
