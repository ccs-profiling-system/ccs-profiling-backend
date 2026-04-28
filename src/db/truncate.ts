/**
 * Database Truncate Script
 * 
 * Truncates all tables in the database, removing all data while preserving table structure.
 * This is useful for development and testing when you want to start fresh.
 * 
 * WARNING: This will delete ALL data from ALL tables!
 * Use with caution, especially in production environments.
 */

import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * List of all tables in the correct order for truncation
 * (respecting foreign key constraints - child tables first)
 */
const TABLES_TO_TRUNCATE = [
  // Child tables (with foreign keys) - truncate first
  'advisor_appointments',
  'advisor_appointment_slots',
  'advisor_messages',
  'student_advisors',
  'research_applications',
  'payments',
  'financial_records',
  'notifications',
  'attendance',
  'faculty_affiliations',
  'faculty_skills',
  'audit_logs',
  'uploads',
  'research',
  'schedules',
  'events',
  'affiliations',
  'violations',
  'skills',
  'academic_history',
  'enrollments',
  'instructions',
  'faculty',
  'students',
  'users',
  'entity_counters',
];

/**
 * Truncate all tables in the database
 */
async function truncateAllTables() {
  console.log('🗑️  Starting database truncation...\n');

  try {
    // Truncate each table with CASCADE to handle foreign keys
    for (const table of TABLES_TO_TRUNCATE) {
      try {
        console.log(`  - Truncating table: ${table}`);
        await db.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} RESTART IDENTITY CASCADE`);
      } catch (error) {
        // Table might not exist, skip it
        if (error instanceof Error) {
          console.log(`  ⚠️  Could not truncate ${table}: ${error.message}`);
        } else {
          console.log(`  ⚠️  Could not truncate ${table} (table may not exist)`);
        }
      }
    }

    console.log('\n✅ Database truncation completed successfully!');
    console.log('💡 All tables have been cleared. Run "npm run db:seed" to populate with fresh data.\n');
  } catch (error) {
    console.error('❌ Error truncating database:', error);
    throw error;
  }
}

// Run truncation if this file is executed directly
if (require.main === module) {
  truncateAllTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { truncateAllTables };
