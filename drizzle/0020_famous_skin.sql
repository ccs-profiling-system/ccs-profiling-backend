CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "students" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" varchar(50) NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"date_of_birth" date,
	"address" text,
	"year_level" integer,
	"program" varchar(100),
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculty" (
	"id" uuid PRIMARY KEY NOT NULL,
	"faculty_id" varchar(50) NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"department" varchar(100) NOT NULL,
	"position" varchar(100),
	"specialization" varchar(255),
	"office_location" varchar(255),
	"consultation_hours" varchar(255),
	"bio" varchar(1000),
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "faculty_faculty_id_unique" UNIQUE("faculty_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entity_counters" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"year" integer NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "entity_counters_entity_type_year_unique" UNIQUE("entity_type","year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instructions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"subject_code" varchar(50) NOT NULL,
	"subject_name" varchar(255) NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"curriculum_year" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"instruction_id" uuid NOT NULL,
	"enrollment_status" varchar(50) DEFAULT 'enrolled' NOT NULL,
	"semester" varchar(20) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academic_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"subject_code" varchar(50) NOT NULL,
	"subject_name" varchar(200) NOT NULL,
	"grade" numeric(4, 2) NOT NULL,
	"semester" varchar(20) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"credits" integer NOT NULL,
	"remarks" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "skills" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"skill_name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"proficiency_level" varchar(50),
	"years_of_experience" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "violations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"violation_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"violation_date" date NOT NULL,
	"resolution_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"resolution_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"organization_name" varchar(200) NOT NULL,
	"role" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"organizer" varchar(200),
	"max_participants" integer,
	"registration_deadline" date,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"department_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"abstract" text,
	"research_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'ongoing',
	"start_date" date,
	"completion_date" date,
	"publication_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_advisers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"adviser_role" varchar(100) DEFAULT 'adviser',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "research_advisers_research_faculty_unique" UNIQUE("research_id","faculty_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_authors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"research_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"author_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "research_authors_research_student_unique" UNIQUE("research_id","student_id")
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action_type" varchar(50) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"before_state" jsonb,
	"after_state" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"report_name" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"format" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"generated_by" uuid NOT NULL,
	"parameters" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance" (
	"id" uuid PRIMARY KEY NOT NULL,
	"instruction_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" varchar(20) NOT NULL,
	"remarks" text,
	"recorded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculty_skills" (
	"id" uuid PRIMARY KEY NOT NULL,
	"faculty_id" uuid NOT NULL,
	"skill_name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"proficiency_level" varchar(50),
	"years_of_experience" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculty_affiliations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"faculty_id" uuid NOT NULL,
	"organization_name" varchar(200) NOT NULL,
	"type" varchar(50) NOT NULL,
	"role" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_participation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"instruction_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"date" date NOT NULL,
	"participation_score" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "students_student_id_idx" ON "students" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "students_first_name_idx" ON "students" ("first_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "students_last_name_idx" ON "students" ("last_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "students_email_idx" ON "students" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "students_user_id_idx" ON "students" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_faculty_id_idx" ON "faculty" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_first_name_idx" ON "faculty" ("first_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_last_name_idx" ON "faculty" ("last_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_department_idx" ON "faculty" ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_user_id_idx" ON "faculty" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "instructions_subject_code_curriculum_year_unique" ON "instructions" ("subject_code","curriculum_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instructions_subject_code_idx" ON "instructions" ("subject_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_student_instruction_semester_year_unique" ON "enrollments" ("student_id","instruction_id","semester","academic_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_student_id_idx" ON "enrollments" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_instruction_id_idx" ON "enrollments" ("instruction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrollments_semester_academic_year_idx" ON "enrollments" ("semester","academic_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "academic_history_student_id_idx" ON "academic_history" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "academic_history_semester_academic_year_idx" ON "academic_history" ("semester","academic_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_room_idx" ON "schedules" ("room");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_faculty_id_idx" ON "schedules" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_day_idx" ON "schedules" ("day");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_semester_academic_year_idx" ON "schedules" ("semester","academic_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_instruction_id_idx" ON "schedules" ("instruction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_student_id_idx" ON "skills" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "violations_student_id_idx" ON "violations" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliations_student_id_idx" ON "affiliations" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_participants_event_id_idx" ON "event_participants" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_participants_student_id_idx" ON "event_participants" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_participants_faculty_id_idx" ON "event_participants" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_name_idx" ON "events" ("event_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_date_idx" ON "events" ("event_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_type_idx" ON "events" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_department_id_idx" ON "events" ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_title_idx" ON "research" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_status_idx" ON "research" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_advisers_research_id_idx" ON "research_advisers" ("research_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_advisers_faculty_id_idx" ON "research_advisers" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_authors_research_id_idx" ON "research_authors" ("research_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "research_authors_student_id_idx" ON "research_authors" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_entity_type_idx" ON "uploads" ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_entity_id_idx" ON "uploads" ("entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_entity_composite_idx" ON "uploads" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploads_uploaded_by_idx" ON "uploads" ("uploaded_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_entity_id_idx" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_type_idx" ON "audit_logs" ("action_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_instruction_id_idx" ON "attendance" ("instruction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_student_id_idx" ON "attendance" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_date_idx" ON "attendance" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendance_instruction_date_idx" ON "attendance" ("instruction_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_skills_faculty_id_idx" ON "faculty_skills" ("faculty_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "faculty_affiliations_faculty_id_idx" ON "faculty_affiliations" ("faculty_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_participation_instruction_student_date_unique" ON "student_participation" ("instruction_id","student_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_participation_instruction_id_idx" ON "student_participation" ("instruction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_participation_student_id_idx" ON "student_participation" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_participation_date_idx" ON "student_participation" ("date");--> statement-breakpoint
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
 ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_instruction_id_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "instructions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "violations" ADD CONSTRAINT "violations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_advisers" ADD CONSTRAINT "research_advisers_research_id_research_id_fk" FOREIGN KEY ("research_id") REFERENCES "research"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_advisers" ADD CONSTRAINT "research_advisers_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_authors" ADD CONSTRAINT "research_authors_research_id_research_id_fk" FOREIGN KEY ("research_id") REFERENCES "research"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_authors" ADD CONSTRAINT "research_authors_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_instruction_id_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "instructions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faculty_skills" ADD CONSTRAINT "faculty_skills_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faculty_affiliations" ADD CONSTRAINT "faculty_affiliations_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_participation" ADD CONSTRAINT "student_participation_instruction_id_instructions_id_fk" FOREIGN KEY ("instruction_id") REFERENCES "instructions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_participation" ADD CONSTRAINT "student_participation_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
