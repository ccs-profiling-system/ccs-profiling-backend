-- Migration: Add performance optimization indexes
-- Task: 41.1 Implement performance optimizations
-- Requirements: 16.1-16.8

-- Add missing single-column indexes for frequently queried fields

-- Students table: Add indexes for status, program, year_level
CREATE INDEX IF NOT EXISTS "students_status_idx" ON "students" ("status");
CREATE INDEX IF NOT EXISTS "students_program_idx" ON "students" ("program");
CREATE INDEX IF NOT EXISTS "students_year_level_idx" ON "students" ("year_level");

-- Faculty table: Add indexes for status, position, email
CREATE INDEX IF NOT EXISTS "faculty_status_idx" ON "faculty" ("status");
CREATE INDEX IF NOT EXISTS "faculty_position_idx" ON "faculty" ("position");
CREATE INDEX IF NOT EXISTS "faculty_email_idx" ON "faculty" ("email");

-- Events table: Add index for organizer (already has status, event_type, event_date)
CREATE INDEX IF NOT EXISTS "events_organizer_idx" ON "events" ("organizer");

-- Research table: Add indexes for research_type and dates
CREATE INDEX IF NOT EXISTS "research_research_type_idx" ON "research" ("research_type");
CREATE INDEX IF NOT EXISTS "research_start_date_idx" ON "research" ("start_date");
CREATE INDEX IF NOT EXISTS "research_completion_date_idx" ON "research" ("completion_date");

-- Uploads table: Add index for file_type
CREATE INDEX IF NOT EXISTS "uploads_file_type_idx" ON "uploads" ("file_type");

-- Reports table: Add indexes for report_type, status, generated_by, created_at
CREATE INDEX IF NOT EXISTS "reports_report_type_idx" ON "reports" ("report_type");
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports" ("status");
CREATE INDEX IF NOT EXISTS "reports_generated_by_idx" ON "reports" ("generated_by");
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports" ("created_at");

-- Add composite indexes for common multi-column filter combinations

-- Students: Common filters (program + year_level, program + status, status + year_level)
CREATE INDEX IF NOT EXISTS "students_program_year_level_idx" ON "students" ("program", "year_level");
CREATE INDEX IF NOT EXISTS "students_program_status_idx" ON "students" ("program", "status");
CREATE INDEX IF NOT EXISTS "students_status_year_level_idx" ON "students" ("status", "year_level");

-- Faculty: Common filters (department + position, department + status)
CREATE INDEX IF NOT EXISTS "faculty_department_position_idx" ON "faculty" ("department", "position");
CREATE INDEX IF NOT EXISTS "faculty_department_status_idx" ON "faculty" ("department", "status");

-- Events: Common filters (event_type + status, event_date + status, event_type + event_date)
CREATE INDEX IF NOT EXISTS "events_event_type_status_idx" ON "events" ("event_type", "status");
CREATE INDEX IF NOT EXISTS "events_event_date_status_idx" ON "events" ("event_date", "status");
CREATE INDEX IF NOT EXISTS "events_event_type_event_date_idx" ON "events" ("event_type", "event_date");

-- Research: Common filters (research_type + status, status + start_date)
CREATE INDEX IF NOT EXISTS "research_research_type_status_idx" ON "research" ("research_type", "status");
CREATE INDEX IF NOT EXISTS "research_status_start_date_idx" ON "research" ("status", "start_date");

-- Schedules: Common filters (faculty_id + semester + academic_year, room + day)
CREATE INDEX IF NOT EXISTS "schedules_faculty_semester_year_idx" ON "schedules" ("faculty_id", "semester", "academic_year");
CREATE INDEX IF NOT EXISTS "schedules_room_day_idx" ON "schedules" ("room", "day");

-- Audit logs: Add composite index for entity queries with time range
CREATE INDEX IF NOT EXISTS "audit_logs_entity_created_idx" ON "audit_logs" ("entity_type", "entity_id", "created_at");

-- Add indexes for soft delete queries (deleted_at IS NULL is common)
-- These help with filtering out soft-deleted records efficiently
CREATE INDEX IF NOT EXISTS "students_deleted_at_idx" ON "students" ("deleted_at");
CREATE INDEX IF NOT EXISTS "faculty_deleted_at_idx" ON "faculty" ("deleted_at");
CREATE INDEX IF NOT EXISTS "events_deleted_at_idx" ON "events" ("deleted_at");
CREATE INDEX IF NOT EXISTS "research_deleted_at_idx" ON "research" ("deleted_at");
CREATE INDEX IF NOT EXISTS "schedules_deleted_at_idx" ON "schedules" ("deleted_at");
CREATE INDEX IF NOT EXISTS "instructions_deleted_at_idx" ON "instructions" ("deleted_at");
