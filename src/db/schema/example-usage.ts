/**
 * Example Schema File Demonstrating Schema Utilities Usage
 * 
 * This file shows how to use the common schema utilities in real table definitions.
 * These patterns should be followed across all schema files in the project.
 */

import { pgTable, varchar, text, integer } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestamps, timestampsWithSoftDelete } from './utils';
import { users } from './users';

/**
 * Example 1: Simple table with timestamps (no soft delete)
 * Use this pattern for tables that don't need soft delete functionality
 */
export const skills = pgTable('skills', {
  id: uuidPrimaryKey(),
  student_id: varchar('student_id', { length: 50 }).notNull(),
  skill_name: varchar('skill_name', { length: 100 }).notNull(),
  proficiency_level: varchar('proficiency_level', { length: 50 }),
  years_of_experience: integer('years_of_experience'),
  ...timestamps, // Adds created_at and updated_at
});

/**
 * Example 2: Table with soft delete support
 * Use this pattern for core entities that should be preserved for audit purposes
 */
export const events = pgTable('events', {
  id: uuidPrimaryKey(),
  event_name: varchar('event_name', { length: 200 }).notNull(),
  event_type: varchar('event_type', { length: 50 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 200 }),
  max_participants: integer('max_participants'),
  ...timestampsWithSoftDelete, // Adds created_at, updated_at, and deleted_at
});

/**
 * Example 3: Table with foreign key and soft delete
 * Shows how to combine utilities with relationships
 */
export const profiles = pgTable('profiles', {
  id: uuidPrimaryKey(),
  user_id: varchar('user_id', { length: 50 })
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  bio: text('bio'),
  avatar_url: varchar('avatar_url', { length: 500 }),
  ...timestampsWithSoftDelete,
});

/**
 * Key Benefits of Using These Utilities:
 * 
 * 1. Consistency: All tables have the same field names and types
 * 2. Maintainability: Changes to common patterns happen in one place
 * 3. Type Safety: TypeScript ensures correct usage
 * 4. Less Boilerplate: Reduces repetitive code
 * 5. Audit Trail: Automatic tracking of creation/modification times
 * 6. Soft Delete: Easy implementation of soft delete pattern
 */
