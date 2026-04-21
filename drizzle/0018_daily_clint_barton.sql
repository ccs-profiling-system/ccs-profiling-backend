CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"total_tuition" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_fees" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_payments" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"outstanding_balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financial_records_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference_number" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"application_date" date NOT NULL,
	"statement_of_interest" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"faculty_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "research_applications_research_student_unique" UNIQUE("research_id","student_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advisor_appointments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"appointment_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"purpose" text NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"advisor_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advisor_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" varchar(20) NOT NULL,
	"message_content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advisor_slots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"faculty_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_advisors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"assigned_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_student_id_idx" ON "notifications" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_records_student_id_idx" ON "financial_records" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_student_id_idx" ON "payments" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "payments" ("payment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_applications_student_id_idx" ON "research_applications" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_applications_research_id_idx" ON "research_applications" ("research_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_applications_status_idx" ON "research_applications" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_appointments_student_id_idx" ON "advisor_appointments" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_appointments_faculty_id_idx" ON "advisor_appointments" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_appointments_slot_id_idx" ON "advisor_appointments" ("slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_appointments_appointment_date_idx" ON "advisor_appointments" ("appointment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_appointments_status_idx" ON "advisor_appointments" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_messages_student_id_idx" ON "advisor_messages" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_messages_faculty_id_idx" ON "advisor_messages" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_messages_sent_at_idx" ON "advisor_messages" ("sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_slots_faculty_id_idx" ON "advisor_slots" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_slots_slot_date_idx" ON "advisor_slots" ("slot_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisor_slots_is_booked_idx" ON "advisor_slots" ("is_booked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_advisors_student_id_idx" ON "student_advisors" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_advisors_faculty_id_idx" ON "student_advisors" ("faculty_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_applications" ADD CONSTRAINT "research_applications_research_id_research_id_fk" FOREIGN KEY ("research_id") REFERENCES "research"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_applications" ADD CONSTRAINT "research_applications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advisor_appointments" ADD CONSTRAINT "advisor_appointments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advisor_appointments" ADD CONSTRAINT "advisor_appointments_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advisor_appointments" ADD CONSTRAINT "advisor_appointments_slot_id_advisor_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "advisor_slots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advisor_messages" ADD CONSTRAINT "advisor_messages_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advisor_messages" ADD CONSTRAINT "advisor_messages_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advisor_messages" ADD CONSTRAINT "advisor_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advisor_slots" ADD CONSTRAINT "advisor_slots_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
