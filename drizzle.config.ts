/**
 * Drizzle ORM Configuration
 * 
 * This configuration file defines the database schema files and migration settings
 * for Drizzle Kit (the migration generator and manager for Drizzle ORM).
 * 
 * SCHEMA FILES:
 * All database schema files are listed here. When you run `npm run db:generate`,
 * Drizzle Kit will analyze these files and generate SQL migration files.
 * 
 * REGISTERED SCHEMAS:
 * - users: User accounts and authentication
 * - students: Student profiles
 * - faculty: Faculty profiles
 * - entityCounters: Auto-incrementing ID counters
 * - instructions: Curriculum and subjects
 * - enrollments: Student course enrollments
 * - academicHistory: Student grades and academic records
 * - schedules: Class and exam schedules
 * - skills: Student skills and competencies
 * - violations: Student disciplinary records
 * - affiliations: Student organization memberships
 * - events: Academic and institutional events
 * - research: Research projects and theses
 * - uploads: File upload metadata
 * - auditLogs: System activity audit trail
 * 
 * MIGRATION COMMANDS:
 * - npm run db:generate - Generate migration files from schema changes
 * - npm run db:migrate - Apply migrations to database
 * - npm run db:push - Push schema changes directly (development only)
 * 
 * Requirements: 23.1, 23.2, 23.3
 */

import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default {
  schema: [
    './src/db/schema/users.ts',
    './src/db/schema/students.ts',
    './src/db/schema/faculty.ts',
    './src/db/schema/entityCounters.ts',
    './src/db/schema/instructions.ts',
    './src/db/schema/enrollments.ts',
    './src/db/schema/academicHistory.ts',
    './src/db/schema/schedules.ts',
    './src/db/schema/skills.ts',
    './src/db/schema/violations.ts',
    './src/db/schema/affiliations.ts',
    './src/db/schema/events.ts',
    './src/db/schema/research.ts',
    './src/db/schema/uploads.ts',
    './src/db/schema/auditLogs.ts',
    './src/db/schema/reports.ts',
  ],
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
} satisfies Config;
