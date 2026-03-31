import { pgTable, varchar, integer, unique } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey } from './utils';

/**
 * Entity Counters table schema
 * 
 * Stores sequential counter values for generating human-readable IDs
 * for students and faculty (e.g., S-2024-0001, F-2024-0001).
 * 
 * The counter resets each year and is unique per entity type.
 * 
 * Requirements: 23.2
 */
export const entityCounters = pgTable('entity_counters', {
  id: uuidPrimaryKey(),
  entity_type: varchar('entity_type', { length: 50 }).notNull(), // 'student' or 'faculty'
  year: integer('year').notNull(),
  last_sequence: integer('last_sequence').notNull().default(0),
}, (table) => ({
  // Unique constraint to ensure one counter per entity type per year
  entityTypeYearUnique: unique('entity_counters_entity_type_year_unique').on(
    table.entity_type,
    table.year
  ),
}));
